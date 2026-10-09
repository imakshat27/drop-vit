import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresPool } from '../src/lib/postgres-pool';

test('idle socket errors are handled without logging the credential-bearing client', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { client, close } = createPostgresPool('postgres://unused:secret@localhost/unused');
  const error = Object.assign(new TypeError('This socket has been closed.'), {
    client: { password: 'secret' },
  });
  assert.doesNotThrow(() => client.emit('error', error));
  assert.equal(warn.mock.callCount(), 1);
  assert.equal(JSON.stringify(warn.mock.calls[0].arguments).includes('secret'), false);
  const first = close();
  assert.equal(close(), first);
  await first;
});

test('query connection failures still reject normally', async () => {
  const { client, close } = createPostgresPool('postgres://unused:unused@127.0.0.1:1/unused');
  await assert.rejects(client.query('SELECT 1'));
  await close();
});
