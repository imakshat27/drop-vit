import { fetchWithMediaCache } from './media-cache';
import { fetchWithPublicCache } from './public-cache';
import { version } from '../.open-next/drop-cache-version.mjs';

const worker = {
  async scheduled(_controller, env, ctx) {
    const { sweepNotifications } = await import('./notifications');
    ctx.waitUntil(sweepNotifications(env));
  },
  async fetch(request, env, ctx) {
    if (
      ['/api/internal/notifications', '/api/internal/notifications/verify'].includes(
        new URL(request.url).pathname,
      )
    ) {
      if (
        request.method !== 'POST' ||
        !env.NOTIFICATION_JOB_SECRET ||
        request.headers.get('authorization') !== `Bearer ${env.NOTIFICATION_JOB_SECRET}`
      )
        return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      if (new URL(request.url).pathname.endsWith('/verify')) {
        try {
          const { verifyNotificationTransport } = await import('./notifications');
          await verifyNotificationTransport(env);
          return Response.json({ ok: true });
        } catch (error) {
          const code =
            typeof error?.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code)
              ? error.code
              : 'SMTP_CHECK_FAILED';
          return Response.json({ ok: false, code }, { status: 503 });
        }
      }
      let id;
      try {
        ({ id } = await request.json());
      } catch {
        return new Response(null, { status: 400 });
      }
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id))
        return new Response(null, { status: 400 });
      const { runNotification } = await import('./notifications');
      try {
        await runNotification(env, id);
        return new Response(null, { status: 202, headers: { 'Cache-Control': 'no-store' } });
      } catch {
        console.warn('Notification invocation failed', { id });
        return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    if (/^\/api\/media\/[A-Za-z0-9_-]+\.[0-9a-f-]{36}$/.test(new URL(request.url).pathname)) {
      return fetchWithMediaCache(request, {
        version,
        cache: caches.default,
        waitUntil: (promise) => ctx.waitUntil(promise),
        render: async () => {
          const { default: app } = await import('../.open-next/worker.js');
          return app.fetch(request, env, ctx);
        },
      });
    }
    return fetchWithPublicCache(request, {
      cache: caches.default,
      version,
      waitUntil: (promise) => ctx.waitUntil(promise),
      render: async (canonical) => {
        const { default: worker } = await import('../.open-next/worker.js');
        return worker.fetch(canonical, env, ctx);
      },
    });
  },
};
export default worker;
