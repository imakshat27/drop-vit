import { after } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
/** Delivery runs in a separate invocation, away from the visitor's render/CPU budget. */
export function kickNotification(id?: string) {
  if (!id || process.env.DROP_RUNTIME !== 'cloudflare') return;
  const env = getCloudflareContext().env as unknown as {
    NOTIFICATION_JOB_SECRET?: string;
    WORKER_SELF_REFERENCE?: { fetch: typeof fetch };
  };
  after(async () => {
    try {
      if (!env.NOTIFICATION_JOB_SECRET || !env.WORKER_SELF_REFERENCE)
        throw new Error('Delivery not configured');
      const result = await env.WORKER_SELF_REFERENCE.fetch(
        'https://notifications.internal/api/internal/notifications',
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.NOTIFICATION_JOB_SECRET}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ id }),
        },
      );
      if (!result.ok) throw new Error('Delivery trigger failed');
    } catch {
      console.warn('Notification queued for scheduled retry', { id });
    }
  });
}
