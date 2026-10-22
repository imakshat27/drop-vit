import { fetchWithMediaCache } from './media-cache';
import { fetchWithPublicCache } from './public-cache';
import { version } from '../.open-next/drop-cache-version.mjs';

const worker = {
  fetch(request, env, ctx) {
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
