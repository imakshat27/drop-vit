import type { EdgeCache } from './public-cache';
/** Cache only media the app has explicitly marked public after release. */
export async function fetchWithMediaCache(
  request: Request,
  options: {
    cache: EdgeCache;
    version?: string;
    waitUntil: (promise: Promise<unknown>) => void;
    render: () => Promise<Response>;
  },
) {
  if (
    request.method !== 'GET' ||
    request.headers.has('range') ||
    /no-cache|no-store/i.test(request.headers.get('cache-control') || '')
  )
    return options.render();
  const url = new URL(request.url);
  url.search = '';
  url.searchParams.set('release-policy', options.version || 'scheduled-v1');
  const key = new Request(url, { method: 'GET' });
  const found = await options.cache.match(key);
  if (found) return found;
  const response = await options.render();
  if (
    response.ok &&
    /^image\/webp/i.test(response.headers.get('content-type') || '') &&
    /\bpublic\b/.test(response.headers.get('cache-control') || '') &&
    !response.headers.has('set-cookie')
  ) {
    const copy = response.clone();
    const headers = new Headers(copy.headers);
    headers.delete('vary');
    options.waitUntil(
      options.cache
        .put(key, new Response(copy.body, { status: copy.status, headers }))
        .catch(() => {}),
    );
  }
  return response;
}
