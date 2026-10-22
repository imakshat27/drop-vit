import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

/** One-time, user-authorized launch reset. Authentication and schema stay intact. */
export async function resetLaunchData(connection: ReturnType<typeof db>) {
  return connection.transaction(async (tx) => {
    await tx.execute(
      sql`LOCK TABLE projects, periods, entries, supports, results, awards, members, recruitments, audit, users IN ACCESS EXCLUSIVE MODE`,
    );
    const before = await tx.execute(sql`SELECT
      (SELECT count(*)::int FROM projects) projects,
      (SELECT count(*)::int FROM periods) periods,
      (SELECT count(*)::int FROM supports) supports,
      (SELECT count(*)::int FROM users WHERE role='admin') curators`);
    // Explicit table list avoids deleting auth data through a CASCADE. TRUNCATE is
    // intentional here: this launch reset removes even immutable test snapshots.
    await tx.execute(
      sql`TRUNCATE notification_outbox, projects, periods, entries, supports, results, awards, members, recruitments, audit, rate_limits, verification_tokens`,
    );
    const removed = await tx.execute(
      sql`DELETE FROM users WHERE email LIKE '%@demo.drop.test' AND password_hash='!demo-only!' AND role='user' RETURNING id`,
    );
    const check = await tx.execute(
      sql`SELECT count(*)::int AS curators FROM users WHERE role='admin'`,
    );
    if (check.rows[0].curators !== before.rows[0].curators)
      throw new Error('Curator preservation check failed');
    return { ...before.rows[0], demoAccountsRemoved: removed.rows.length };
  });
}
