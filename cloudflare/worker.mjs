import { fetchWithPublicCache } from './public-cache';
import { version } from '../.open-next/drop-cache-version.mjs';

const worker = {
  fetch(request, env, ctx) {
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
