import { MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION } from './project-media';
export async function optimizeImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPG, PNG or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an original image smaller than 10 MB.');
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this image.');
    for (const limit of [MAX_IMAGE_DIMENSION, 1280, 960, 720]) {
      const scale = Math.min(1, limit / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', quality),
        );
        if (!blob || blob.type !== 'image/webp')
          throw new Error('Please use a browser that supports WebP export.');
        if (blob.size <= MAX_IMAGE_BYTES) return blob;
      }
    }
    throw new Error('This image is too detailed to fit. Try a smaller screenshot.');
  } finally {
    image.close();
  }
}
