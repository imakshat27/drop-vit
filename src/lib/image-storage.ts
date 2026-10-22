import { AwsClient } from 'aws4fetch';
import { createHmac, randomUUID } from 'node:crypto';
import { MAX_IMAGE_BYTES, mediaId, webpDimensions } from './project-media';
const bucket = 'drop-project-images';
export function storageConfigured() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_ENDPOINT_URL_S3 &&
    process.env.AWS_REGION
  );
}
function config() {
  if (!storageConfigured())
    throw new Error('Image uploads are temporarily unavailable. Try again later.');
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
  };
}
export const ownerPrefix = (userId: string) => Buffer.from(userId).toString('base64url') + '.';
export function imageOwnedBy(id: string, userId: string) {
  return id.startsWith(ownerPrefix(userId));
}
function objectUrl(id = '') {
  const endpoint = new URL(process.env.AWS_ENDPOINT_URL_S3!);
  if (endpoint.protocol !== 'https:') throw new Error('Image storage requires HTTPS.');
  endpoint.pathname =
    endpoint.pathname.replace(/\/$/, '') + '/' + bucket + (id ? '/' + id + '.webp' : '');
  return endpoint.toString();
}
export async function storageRequest(
  id: string,
  init: RequestInit = {},
  query = '',
  staging = false,
) {
  const credentials = config();
  const aws = new AwsClient({ ...credentials, service: 's3', retries: 1 });
  const signed = await aws.sign(
    objectUrl(id ? (staging ? 'staging/' : 'images/') + id : '') + query,
    init,
  );
  return fetch(signed, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
}
/** Exact-key POST policy enforces the file size in storage before accepting bytes. */
export function uploadTicket(userId: string): {
  url: string;
  fields: Record<string, string>;
  media: string;
} {
  const { accessKeyId, secretAccessKey, region } = config();
  const id = ownerPrefix(userId) + randomUUID();
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = date.slice(0, 8);
  const credential = `${accessKeyId}/${day}/${region}/s3/aws4_request`;
  const fields: Record<string, string> = {
    key: 'staging/' + id + '.webp',
    'Content-Type': 'image/webp',
    'x-amz-algorithm': 'AWS4-HMAC-SHA256',
    'x-amz-credential': credential,
    'x-amz-date': date,
    success_action_status: '204',
  };
  const policy = Buffer.from(
    JSON.stringify({
      expiration: new Date(Date.now() + 10 * 60000).toISOString(),
      conditions: [
        { bucket },
        ...Object.entries(fields).map(([key, value]) => ({ [key]: value })),
        ['content-length-range', 1, MAX_IMAGE_BYTES],
      ],
    }),
  ).toString('base64');
  const hmac = (key: Buffer | string, message: string) =>
    createHmac('sha256', key).update(message).digest();
  const signingKey = hmac(
    hmac(hmac(hmac('AWS4' + secretAccessKey, day), region), 's3'),
    'aws4_request',
  );
  return {
    url: objectUrl(),
    fields: {
      ...fields,
      policy,
      'x-amz-signature': createHmac('sha256', signingKey).update(policy).digest('hex'),
    },
    media: '/api/media/' + id,
  };
}
export async function verifyUploadedImage(url: string, userId: string) {
  const id = mediaId(url);
  if (!id || !imageOwnedBy(id, userId)) throw new Error('Choose images uploaded by your account.');
  const exists = await storageRequest(id, { method: 'HEAD' });
  if (!exists.ok) {
    if (exists.status !== 404) throw new Error('Image storage is temporarily unavailable.');
    const copied = await storageRequest(id, {
      method: 'PUT',
      headers: { 'x-amz-copy-source': `/${bucket}/staging/${id}.webp` },
    });
    if (!copied.ok) throw new Error('An image upload did not finish. Remove it and try again.');
  }
  const head = await storageRequest(id, { method: 'HEAD' });
  const size = Number(head.headers.get('content-length'));
  try {
    if (
      !head.ok ||
      !size ||
      size > MAX_IMAGE_BYTES ||
      head.headers.get('content-type')?.split(';')[0] !== 'image/webp'
    )
      throw new Error('An image is missing or too large. Remove it and upload it again.');
    const header = await storageRequest(id, { headers: { Range: 'bytes=0-63' } });
    if (!header.ok) throw new Error('Could not verify this image.');
    webpDimensions(new Uint8Array(await header.arrayBuffer()));
  } catch (error) {
    if (!exists.ok) await storageRequest(id, { method: 'DELETE' });
    throw error;
  }
  // The upload ticket can only overwrite staging. Reviewed images are immutable copies.
  await storageRequest(id, { method: 'DELETE' }, '', true);
}
