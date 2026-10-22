import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './auth-fixture';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64',
);
test('screenshot gallery supports thumbnails, lightbox keys, focus return and mobile layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('https://images.example.test/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: png }),
  );
  await page.goto('/projects/canvas');
  const fallback = page.locator('.project-compact-fallback');
  await expect(fallback).toBeVisible();
  expect((await fallback.boundingBox())!.height).toBeLessThan(160);
  await page.goto('/projects/qa-gallery');
  const cover = page.getByRole('button', { name: 'View Gallery QA screenshots full screen' });
  await expect(cover).toBeVisible();
  await page.getByRole('button', { name: 'Show screenshot 2', exact: true }).click();
  await expect(cover).toContainText('2 / 3');
  await cover.click();
  const lightbox = page.getByRole('dialog', { name: 'Gallery QA screenshots' });
  await expect(lightbox).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(lightbox).toContainText('3 / 3');
  const box = await lightbox.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(375);
  expect((await new AxeBuilder({ page }).include('.media-lightbox').analyze()).violations).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await expect(lightbox).not.toBeVisible();
  await expect(cover).toBeFocused();
});
test('upload UI compresses images, enforces four slots, supports reorder and rejects unsafe files', async ({
  page,
}) => {
  await login(page, 'ananya@vitstudent.ac.in');
  await page.goto('/submit');
  await page.getByLabel('Name of your build').fill('Screenshot Studio');
  await page
    .getByLabel('The one-line pitch')
    .fill('A project for checking beautiful screenshot uploads.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  let count = 0;
  await page.route('**/api/media/upload', async (route) => {
    count++;
    await route.fulfill({
      json: {
        url: 'https://uploads.example.test',
        fields: { key: 'test.webp' },
        media: `/api/media/YW5hbnlh.00000000-0000-0000-0000-${String(count).padStart(12, '0')}`,
      },
    });
  });
  const uploads: number[] = [];
  await page.route('https://uploads.example.test/', async (route) => {
    uploads.push(route.request().postDataBuffer()!.length);
    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/media/YW5hbnlh.*', (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ contentType: 'image/png', body: png }),
  );
  const input = page.locator('input#project-images');
  await input.setInputFiles({
    name: 'bad.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await expect(page.locator('.image-upload').getByRole('alert')).toContainText('JPG, PNG or WebP');
  const uploadPng = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1200;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#dbff76';
      context.fillRect(0, 0, 2400, 1200);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );
  await input.setInputFiles(
    Array.from({ length: 4 }, (_, i) => ({
      name: `image-${i}.png`,
      mimeType: 'image/png',
      buffer: uploadPng,
    })),
  );
  await expect(page.locator('.image-upload-list li')).toHaveCount(4);
  await expect(input).toBeDisabled();
  await page.screenshot({ path: '.data/media-uploader.png', animations: 'disabled' });
  expect(uploads).toHaveLength(4);
  expect(uploads.every((size) => size < 500 * 1024 + 2048)).toBe(true);
  await page.getByRole('button', { name: 'Move image 2 earlier' }).click();
  const media = JSON.parse(await page.locator('input[name="media"]').inputValue());
  expect(media[0]).toContain('000000000002');
  await page.getByRole('button', { name: 'Remove image 1', exact: true }).click();
  await expect(page.locator('.image-upload-list li')).toHaveCount(3);
  await expect(input).toBeEnabled();
});
test('media endpoints reject anonymous uploads, forged origins and private image access', async ({
  request,
}) => {
  const id = 'cHJpdmF0ZQ.00000000-0000-0000-0000-000000000000';
  expect((await request.get('/api/media/' + id)).status()).toBe(404);
  expect(
    (
      await request.post('/api/media/upload', { headers: { origin: 'http://localhost:3100' } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post('/api/media/upload', { headers: { origin: 'https://evil.example' } })
    ).status(),
  ).toBe(403);
});
