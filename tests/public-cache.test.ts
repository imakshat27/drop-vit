import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchWithPublicCache,
  publicCacheRequest,
  type EdgeCache,
} from '../cloudflare/public-cache';

const guest = (path = '/', headers: Record<string, string> = {}) =>
  new Request(`https://droppp.tech${path}`, { headers: { accept: 'text/html', ...headers } });

test('shared edge caching excludes accounts, actions, cookies and unknown query inputs', async () => {
  for (const path of [
    '/me',
    '/admin',
    '/submit',
    '/signin',
    '/signup',
    '/verify?token=secret',
    '/auth/google',
  ])
    assert.equal(await publicCacheRequest(guest(path), 'build'), null);
  const privateHeaders: Record<string, string>[] = [
    { cookie: 'drop_session=private' },
    { cookie: 'analytics=anything' },
    { authorization: 'Bearer private' },
    { 'next-action': 'action-id' },
    { range: 'bytes=0-100' },
  ];
  for (const headers of privateHeaders)
    assert.equal(await publicCacheRequest(guest('/', headers), 'build'), null);
  assert.equal(
    await publicCacheRequest(
      new Request('https://droppp.tech/weekly', { method: 'POST' }),
      'build',
    ),
    null,
  );
  assert.equal(await publicCacheRequest(guest('/weekly?unrecognized=1'), 'build'), null);
  assert.equal(await publicCacheRequest(guest('/discover?q=one&q=two'), 'build'), null);
});

test('cache keys separate builds, searches and RSC variants and roll over exactly at Monday IST', async () => {
  const before = Date.parse('2026-10-11T18:29:59.999Z');
  const after = before + 1;
  const html = (await publicCacheRequest(guest('/weekly'), 'build', before))!;
  assert.notEqual(
    html.key.url,
    (await publicCacheRequest(guest('/weekly'), 'build', after))!.key.url,
  );
  assert.notEqual(
    html.key.url,
    (await publicCacheRequest(guest('/weekly'), 'new-build', before))!.key.url,
  );
  const rsc = (await publicCacheRequest(
    guest('/weekly?_rsc=abc', { rsc: '1', 'next-router-state-tree': 'tree' }),
    'build',
    before,
  ))!;
  assert.notEqual(html.key.url, rsc.key.url);
  assert.equal(new URL(rsc.canonical.url).searchParams.get('_rsc'), 'abc');
  assert.equal(new URL(rsc.key.url).searchParams.has('_rsc'), false);
  assert.equal(
    rsc.key.url,
    (await publicCacheRequest(
      guest('/weekly?_rsc=xyz', { rsc: '1', 'next-router-state-tree': 'tree' }),
      'build',
      before,
    ))!.key.url,
  );
  assert.notEqual(
    rsc.key.url,
    (await publicCacheRequest(
      guest('/weekly', { rsc: '1', 'next-router-state-tree': 'other-tree' }),
      'build',
      before,
    ))!.key.url,
  );
  const one = (await publicCacheRequest(guest('/discover?q=one'), 'build'))!;
  assert.notEqual(
    one.key.url,
    (await publicCacheRequest(guest('/discover?q=two'), 'build'))!.key.url,
  );
  const poisoned = (await publicCacheRequest(
    guest('/', { 'x-forwarded-host': 'evil.example', 'x-middleware-rewrite': '/admin' }),
    'build',
  ))!;
  assert.equal(poisoned.canonical.headers.has('x-forwarded-host'), false);
  assert.equal(poisoned.canonical.headers.has('x-middleware-rewrite'), false);
});

test('only guest success responses are retained, hits skip rendering, and cache failures fail open', async () => {
  const stored = new Map<string, Response>();
  const tasks: Promise<unknown>[] = [];
  let renders = 0;
  const cache: EdgeCache = {
    match: async (key) => stored.get(key.url)?.clone(),
    put: async (key, response) => {
      stored.set(key.url, response);
    },
  };
  const options = {
    cache,
    version: 'build',
    waitUntil: (task: Promise<unknown>) => {
      tasks.push(task);
    },
    render: async () => {
      renders++;
      return new Response('guest page', { headers: { 'content-type': 'text/html' } });
    },
  };
  const first = await fetchWithPublicCache(guest(), options);
  await Promise.all(tasks);
  assert.equal(first.headers.get('x-drop-cache'), 'MISS');
  const second = await fetchWithPublicCache(guest(), options);
  assert.equal(second.headers.get('x-drop-cache'), 'HIT');
  assert.equal(second.headers.get('cache-control'), 'private, no-store');
  assert.equal(await second.text(), 'guest page');
  assert.equal(renders, 1);
  await fetchWithPublicCache(guest('/', { cookie: 'drop_session=private' }), options);
  assert.equal(renders, 2);
  for (const response of [
    new Response('private', {
      headers: { 'content-type': 'text/html', 'set-cookie': 'drop_session=secret' },
    }),
    new Response('failure', { status: 500, headers: { 'content-type': 'text/html' } }),
    Response.redirect('https://droppp.tech/signin'),
  ]) {
    stored.clear();
    tasks.length = 0;
    await fetchWithPublicCache(guest(), { ...options, render: async () => response });
    await Promise.all(tasks);
    assert.equal(stored.size, 0);
  }
  const unavailable: EdgeCache = {
    match: async () => {
      throw Error('offline');
    },
    put: async () => {
      throw Error('offline');
    },
  };
  const fallback = await fetchWithPublicCache(guest(), { ...options, cache: unavailable });
  await Promise.all(tasks);
  assert.equal(fallback.status, 200);
});

test('build format filters use separate public cache entries without losing category or search', async () => {
  const cli = (await publicCacheRequest(
    guest('/discover?category=Projects&q=tool&format=cli'),
    'build',
  ))!;
  const pkg = (await publicCacheRequest(
    guest('/discover?category=Projects&q=tool&format=package'),
    'build',
  ))!;
  assert.ok(cli);
  assert.notEqual(cli.key.url, pkg.key.url);
  assert.equal(new URL(cli.canonical.url).searchParams.get('format'), 'cli');
  assert.equal(new URL(cli.canonical.url).searchParams.get('q'), 'tool');
  assert.equal(new URL(cli.canonical.url).searchParams.get('category'), 'Projects');
});
