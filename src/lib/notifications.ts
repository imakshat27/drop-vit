import { randomUUID } from 'node:crypto';
import { sql, type SQL } from 'drizzle-orm';
import type { NotificationPayload } from './schema';
import { notificationEmail, type NotificationKind } from './notification-email';
export type NotificationDatabase = {
  execute: (query: SQL) => Promise<{ rows: Record<string, unknown>[] }>;
};
export const MAX_NOTIFICATION_ATTEMPTS = 6;
export async function queueNotification(
  connection: NotificationDatabase,
  input: {
    eventKey: string;
    kind: NotificationKind;
    projectId: string;
    userId: string;
    recipient: string;
    payload: NotificationPayload;
    periodId?: string;
    availableAt?: Date;
  },
) {
  const id = randomUUID();
  const result = await connection.execute(sql`INSERT INTO notification_outbox
    (id, event_key, kind, project_id, user_id, period_id, recipient, payload, available_at)
    VALUES (${id}, ${input.eventKey}, ${input.kind}, ${input.projectId}, ${input.userId}, ${input.periodId || null}, ${input.recipient}, ${JSON.stringify(input.payload)}::jsonb, ${input.availableAt || new Date()})
    ON CONFLICT (event_key) DO NOTHING RETURNING id`);
  return result.rows[0]?.id as string | undefined;
}
export async function dueNotifications(connection: NotificationDatabase, limit = 100) {
  const rows = await connection.execute(sql`SELECT id FROM notification_outbox
    WHERE sent_at IS NULL AND cancelled_at IS NULL AND attempts < ${MAX_NOTIFICATION_ATTEMPTS}
    AND available_at <= now() AND (leased_until IS NULL OR leased_until < now())
    ORDER BY available_at, created_at LIMIT ${limit}`);
  return rows.rows.map((row) => String(row.id));
}
export async function deliverNotification(
  connection: NotificationDatabase,
  id: string,
  options: {
    origin: string;
    send: (
      message: ReturnType<typeof notificationEmail> & { to: string; messageId: string },
    ) => Promise<void>;
  },
) {
  const token = randomUUID();
  // An atomic lease prevents concurrent action kicks and cron runs sending one job twice.
  const claim = await connection.execute(sql`UPDATE notification_outbox SET
    lease_token=${token}, leased_until=now()+interval '10 minutes', attempts=attempts+1
    WHERE id=${id} AND sent_at IS NULL AND cancelled_at IS NULL AND attempts < ${MAX_NOTIFICATION_ATTEMPTS}
    AND available_at <= now() AND (leased_until IS NULL OR leased_until < now()) RETURNING *`);
  const row = claim.rows[0];
  if (!row) return 'skipped';
  try {
    if (row.kind === 'live') {
      const eligible = await connection.execute(sql`SELECT 1 FROM projects p
        JOIN entries e ON e.project_id=p.id JOIN periods w ON w.id=e.period_id
        WHERE p.id=${String(row.project_id)} AND p.status='approved' AND w.id=${String(row.period_id)}
        AND w.kind='weekly' AND w.starts_at <= now() LIMIT 1`);
      if (!eligible.rows.length) {
        await connection.execute(sql`UPDATE notification_outbox SET cancelled_at=now(), leased_until=NULL, lease_token=NULL
          WHERE id=${id} AND lease_token=${token}`);
        return 'cancelled';
      }
    }
    await options.send({
      ...notificationEmail(
        row.kind as NotificationKind,
        row.payload as NotificationPayload,
        options.origin,
      ),
      to: String(row.recipient),
      messageId: `<${id}@${new URL(options.origin).hostname}>`,
    });
    await connection.execute(sql`UPDATE notification_outbox SET sent_at=now(), leased_until=NULL, lease_token=NULL, last_error=NULL
      WHERE id=${id} AND lease_token=${token}`);
    return 'sent';
  } catch (error) {
    const code =
      error &&
      typeof error === 'object' &&
      'code' in error &&
      /^[A-Z0-9_]{1,40}$/.test(String(error.code))
        ? String(error.code)
        : 'DELIVERY_FAILED';
    const retryAt = new Date(Date.now() + Math.min(60, 2 ** Number(row.attempts)) * 60000);
    await connection.execute(sql`UPDATE notification_outbox SET available_at=${retryAt}, leased_until=NULL, lease_token=NULL, last_error=${code}
      WHERE id=${id} AND lease_token=${token}`);
    console.warn('Notification delivery deferred', { id, code, attempts: row.attempts });
    return 'deferred';
  }
}
