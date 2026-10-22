import { drizzle } from 'drizzle-orm/node-postgres';
import { createPostgresPool } from '../src/lib/postgres-pool';
import { createEmailTransport } from '../src/lib/email';
import { deliverNotification, dueNotifications } from '../src/lib/notifications';
export type MailEnvironment = {
  APP_URL: string;
  SMTP_FROM: string;
  SMTP_HOST: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  NOTIFICATION_JOB_SECRET: string;
  WORKER_SELF_REFERENCE: { fetch: typeof fetch };
};
function connection(env: MailEnvironment) {
  const url = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  if (!url) throw new Error('Notification database unavailable');
  const pool = createPostgresPool(url);
  return { connection: drizzle(pool.client), close: pool.close };
}
export async function runNotification(env: MailEnvironment, id: string) {
  const client = connection(env);
  try {
    return await deliverNotification(client.connection, id, {
      origin: env.APP_URL,
      send: async (message) => {
        const transport = createEmailTransport(env);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const result = await Promise.race([
            transport.sendMail({ ...message, from: env.SMTP_FROM }),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                transport.close();
                reject(new Error('SMTP deadline'));
              }, 20000);
            }),
          ]);
          if (!result.accepted?.length) throw new Error('SMTP did not accept the recipient');
        } finally {
          clearTimeout(timer);
          transport.close();
        }
      },
    });
  } finally {
    await client.close();
  }
}
export async function sweepNotifications(env: MailEnvironment) {
  const client = connection(env);
  let jobs: string[];
  try {
    jobs = await dueNotifications(client.connection);
  } finally {
    await client.close();
  }
  // Isolate each SMTP delivery so a batch cannot exhaust one invocation's CPU budget.
  for (let start = 0; start < jobs.length; start += 4)
    await Promise.all(
      jobs.slice(start, start + 4).map((id) =>
        env.WORKER_SELF_REFERENCE.fetch(
          'https://notifications.internal/api/internal/notifications',
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${env.NOTIFICATION_JOB_SECRET}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ id }),
          },
        )
          .then((response) => {
            if (!response.ok) console.warn('Scheduled notification kick deferred', { id });
          })
          .catch(() => console.warn('Scheduled notification kick deferred', { id })),
      ),
    );
  console.log('Notification sweep queued', { count: jobs.length });
}

export async function verifyNotificationTransport(env: MailEnvironment) {
  const transport = createEmailTransport(env);
  try {
    await transport.verify();
  } finally {
    transport.close();
  }
}
