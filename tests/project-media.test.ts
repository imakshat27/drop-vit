import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProjectMedia, webpDimensions, MAX_IMAGE_BYTES } from '../src/lib/project-media';
import { uploadTicket, imageOwnedBy } from '../src/lib/image-storage';
import { fetchWithMediaCache } from '../cloudflare/media-cache';
const id = 'dXNlcg.12345678-1234-1234-1234-123456789abc';
test('image references enforce four slots, valid URLs and no duplicate or unsafe references', () => {
  assert.deepEqual(parseProjectMedia(''), []);
  assert.equal(parseProjectMedia(JSON.stringify(['/api/media/' + id])).length, 1);
  for (const input of [
    '["javascript:alert(1)"]',
    '["/api/media/../secret"]',
    '["https://"]',
    JSON.stringify(Array(5).fill('https://example.com/a.png')),
    '["https://example.com/a.png","https://example.com/a.png"]',
  ])
    assert.throws(() => parseProjectMedia(input));
  assert.deepEqual(parseProjectMedia('https://example.com/legacy.png'), [
    'https://example.com/legacy.png',
  ]);
});
test('WebP validation rejects malformed files, oversized decoded dimensions and animation', () => {
  const bytes = Buffer.alloc(64);
  bytes.write('RIFF', 0);
  bytes.write('WEBP', 8);
  bytes.write('VP8X', 12);
  bytes.writeUIntLE(1599, 24, 3);
  bytes.writeUIntLE(899, 27, 3);
  assert.deepEqual(webpDimensions(bytes), { width: 1600, height: 900 });
  bytes.writeUIntLE(50000, 24, 3);
  assert.throws(() => webpDimensions(bytes));
  bytes.writeUIntLE(1599, 24, 3);
  bytes[20] = 2;
  assert.throws(() => webpDimensions(bytes));
  assert.throws(() => webpDimensions(Buffer.from('<svg>invalid</svg>')));
});
test('direct upload policy restricts object key, type, size and expiry without exposing the storage secret', () => {
  const keys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_ENDPOINT_URL_S3', 'AWS_REGION'];
  const previous = keys.map((key) => process.env[key]);
  try {
    for (const [index, key] of keys.entries())
      process.env[key] = [
        'test-id',
        'test-secret',
        'https://storage.example.test',
        'ap-southeast-1',
      ][index];
    const ticket = uploadTicket('user');
    const policy = JSON.parse(Buffer.from(ticket.fields.policy, 'base64').toString());
    assert.equal(imageOwnedBy(ticket.media.split('/').pop()!, 'user'), true);
    assert.equal(imageOwnedBy(ticket.media.split('/').pop()!, 'other'), false);
    assert.ok(ticket.fields.key.startsWith('staging/'));
    assert.ok(
      policy.conditions.some(
        (v: unknown) =>
          JSON.stringify(v) === JSON.stringify(['content-length-range', 1, MAX_IMAGE_BYTES]),
      ),
    );
    assert.ok(Date.parse(policy.expiration) < Date.now() + 11 * 60000);
    assert.equal(JSON.stringify(ticket).includes('test-secret'), false);
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
test('edge media caching only shares approved public images, never private or failed previews', async () => {
  for (const control of ['private, no-store', 'public, max-age=300']) {
    let puts = 0;
    const work: Promise<unknown>[] = [];
    const response = await fetchWithMediaCache(new Request('https://droppp.tech/api/media/' + id), {
      cache: {
        match: async () => undefined,
        put: async () => {
          puts++;
        },
      },
      waitUntil: (promise) => work.push(promise),
      render: async () =>
        new Response('image', {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': control },
        }),
    });
    await Promise.all(work);
    assert.equal(puts, control.startsWith('public') ? 1 : 0);
    assert.equal(response.status, 200);
  }
});
