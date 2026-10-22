// This cache is deliberately outside Next: hits avoid loading its server runtime.
// Never put authenticated HTML, actions, or private routes in shared storage.
const routes: Record<string, string[]> = {
  '/': [],
  '/weekly': ['period'],
  '/discover': ['category', 'q', 'format'],
  '/honors': ['kind', 'category', 'period', 'view'],
  '/recruit': [],
};
const routerHeaders = [
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-url',
];
export interface EdgeCache {
  match(key: Request): Promise<Response | undefined>;
  put(key: Request, response: Response): Promise<void>;
}

export async function publicCacheRequest(request: Request, version: string, now = Date.now()) {
  if (
    request.method !== 'GET' ||
    ['cookie', 'authorization', 'next-action', 'range', 'x-nextjs-data'].some((h) =>
      request.headers.has(h),
    ) ||
    /no-cache|no-store/i.test(request.headers.get('cache-control') || '')
  )
    return null;
  const url = new URL(request.url);
  const allowed =
    routes[url.pathname] ||
    (/^\/projects\/[a-z0-9-]{1,100}$/.test(url.pathname)
      ? []
      : /^\/builders\/[a-zA-Z0-9-]{1,100}$/.test(url.pathname)
        ? ['tab']
        : undefined);
  if (!allowed || url.search.length > 2048) return null;
  const rsc = request.headers.get('rsc') === '1';
  if (!rsc && !request.headers.get('accept')?.includes('text/html')) return null;
  for (const [key, value] of url.searchParams) {
    if (key === '_rsc' && rsc) continue;
    if (!allowed.includes(key) || value.length > 200 || url.searchParams.getAll(key).length > 1)
      return null;
  }
  if (routerHeaders.reduce((n, h) => n + (request.headers.get(h)?.length || 0), 0) > 16384)
    return null;
  // Only these headers may affect a cacheable render. Forwarded-host and other
  // caller-controlled Next override headers must not poison a shared response.
  const headers = new Headers({ accept: rsc ? 'text/x-component' : 'text/html' });
  if (rsc)
    for (const h of routerHeaders) {
      const value = request.headers.get(h);
      if (value !== null) headers.set(h, value);
    }
  const canonical = new Request(url, { headers });
  // Next 16.4 validates _rsc against the router headers. Keep it on the actual
  // render request; discard it only from the edge key, where the header hash
  // already distinguishes the payload. Stripping it before rendering redirects.
  url.searchParams.delete('_rsc');
  url.searchParams.sort();
  const variant = rsc
    ? Array.from(headers.entries())
        .map(([k, v]) => `${k}:${v}`)
        .join('\n')
    : 'html';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(variant));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  // Rotate at Monday 00:00 IST even if an old entry hasn't expired yet.
  const week = Math.floor((now + (3 * 86400 + 19800) * 1000) / (7 * 86400000));
  url.searchParams.set('__drop_cache', `${version}:${week}:${hash}`);
  return { key: new Request(url), canonical };
}

export async function fetchWithPublicCache(
  request: Request,
  options: {
    cache: EdgeCache;
    version: string;
    render: (request: Request) => Promise<Response>;
    waitUntil: (promise: Promise<unknown>) => void;
  },
) {
  const entry = await publicCacheRequest(request, options.version);
  if (!entry) return options.render(request);
  // Cache trouble must not make otherwise healthy pages unavailable.
  let cached: Response | undefined;
  try {
    cached = await options.cache.match(entry.key);
  } catch {}
  if (cached) return clientResponse(cached, 'HIT');
  const response = await options.render(entry.canonical);
  const type = response.headers.get('content-type') || '';
  if (
    response.status === 200 &&
    !response.headers.has('set-cookie') &&
    !response.headers.has('location') &&
    (type.includes('text/html') || type.includes('text/x-component'))
  ) {
    const stored = new Response(response.clone().body, response);
    stored.headers.set('cache-control', 'public, max-age=60');
    // HTML/RSC/router variants are already separated in the key.
    stored.headers.delete('vary');
    options.waitUntil(options.cache.put(entry.key, stored).catch(() => {}));
  }
  return clientResponse(response, 'MISS');
}

function clientResponse(response: Response, state: string) {
  const result = new Response(response.body, response);
  // Only the edge may retain it. Browsers must check again after sign-in.
  result.headers.set('cache-control', 'private, no-store');
  result.headers.set('x-drop-cache', state);
  return result;
}
