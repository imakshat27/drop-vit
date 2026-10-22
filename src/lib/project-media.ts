export const MAX_PROJECT_IMAGES = 4;
export const MAX_IMAGE_BYTES = 500 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const MEDIA_ID = /^[A-Za-z0-9_-]{1,180}\.[0-9a-f-]{36}$/;
export function mediaId(url: string) {
  const match = /^\/api\/media\/([^/?#]+)$/.exec(url);
  return match && MEDIA_ID.test(match[1]) ? match[1] : null;
}
export function parseProjectMedia(value: string): string[] {
  if (!value.trim()) return [];
  const items: unknown = value.trim().startsWith('[') ? JSON.parse(value) : [value.trim()];
  if (
    !Array.isArray(items) ||
    items.length > MAX_PROJECT_IMAGES ||
    items.some(
      (url) =>
        typeof url !== 'string' ||
        url.length > 1000 ||
        (!mediaId(url) && !(/^https?:\/\//i.test(url) && URL.canParse(url))),
    )
  )
    throw new Error('Choose up to four project images.');
  if (new Set(items).size !== items.length) throw new Error('Each image must be different.');
  return items;
}
/** Only the WebP formats emitted by browser Canvas; reject oversized decoded images. */
export function webpDimensions(bytes: Uint8Array) {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 30 || text(0, 4) !== 'RIFF' || text(8, 12) !== 'WEBP')
    throw new Error('Invalid WebP image.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0;
  if (text(12, 16) === 'VP8 ' && text(23, 26) === '\x9d\x01\x2a') {
    width = view.getUint16(26, true) & 0x3fff;
    height = view.getUint16(28, true) & 0x3fff;
  } else if (text(12, 16) === 'VP8L' && bytes[20] === 0x2f) {
    const packed = view.getUint32(21, true);
    width = (packed & 0x3fff) + 1;
    height = ((packed >>> 14) & 0x3fff) + 1;
  } else if (text(12, 16) === 'VP8X') {
    width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    if (bytes[20] & 2) throw new Error('Animated images are not supported.');
  }
  if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION)
    throw new Error('Images must be at most 1600 pixels on either side.');
  return { width, height };
}
