import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecoveryFetch, recoverAction, recoveryStore } from '../src/lib/request-recovery';

const origin = 'https://droppp.tech';
const read = () => new Request(`${origin}/weekly?_rsc=test`, { headers: { rsc: '1' } });
const untilFailure = () =>
  new Promise<void>((resolve) => {
    if (recoveryStore.getSnapshot().canRetry) return resolve();
    const unsubscribe = recoveryStore.subscribe(() => {
      if (recoveryStore.getSnapshot().canRetry) {
        unsubscribe();
        resolve();
      }
    });
  });

test('RSC proxy failures stay pending until manual retry, then return real data', async () => {
  let calls = 0;
  const guarded = createRecoveryFetch(async () => {
    calls++;
    return calls === 1 ? new Response('Cloudflare 1102', { status: 500 }) : new Response('flight');
  }, origin);
  let settled = false;
  const result = guarded(read()).then((value) => {
    settled = true;
    return value;
  });
  await untilFailure();
  assert.equal(settled, false);
  assert.equal(calls, 1);
  recoveryStore.retry();
  assert.equal(await (await result).text(), 'flight');
  assert.equal(calls, 2);
  assert.equal(recoveryStore.getSnapshot().canRetry, false);
});

test('aborted waiting navigation rejects and removes its retry', async () => {
  const controller = new AbortController();
  const guarded = createRecoveryFetch(async () => {
    throw new TypeError('Failed to fetch');
  }, origin);
  const result = guarded(read(), { signal: controller.signal });
  const rejection = assert.rejects(result, { name: 'AbortError' });
  await untilFailure();
  controller.abort();
  await rejection;
  assert.equal(recoveryStore.getSnapshot().message, '');
});

test('writes, full documents, and external fetches are never replayed or held', async () => {
  let calls = 0;
  const guarded = createRecoveryFetch(async () => {
    calls++;
    return new Response('', { status: 500 });
  }, origin);
  for (const request of [
    new Request(`${origin}/weekly`, { method: 'POST', headers: { rsc: '1' } }),
    new Request(`${origin}/weekly`),
    new Request('https://example.com/data', { headers: { rsc: '1' } }),
  ])
    assert.equal((await guarded(request)).status, 500);
  assert.equal(calls, 3);
  assert.equal(recoveryStore.getSnapshot().canRetry, false);
});

test('action transport failure returns feedback without retrying the write', async () => {
  let calls = 0;
  const action = recoverAction(async () => {
    calls++;
    throw new Error('Proxy error');
  });
  const result = await action({}, new FormData());
  assert.match(result.error!, /Couldn’t confirm/);
  assert.equal(calls, 1);
  assert.equal(recoveryStore.getSnapshot().canRetry, false);
  recoveryStore.dismiss();
  const validation = { error: 'Enter a valid email' };
  assert.deepEqual(await recoverAction(async () => validation)({}, new FormData()), validation);
  assert.equal(recoveryStore.getSnapshot().message, '');
});

test('guard leaves POST Request bodies intact for the original fetch', async () => {
  const guarded = createRecoveryFetch(async (input) => {
    assert.equal(await (input as Request).text(), 'unsent form');
    return new Response('ok');
  }, origin);
  await guarded(new Request(`${origin}/signin`, { method: 'POST', body: 'unsent form' }));
});
