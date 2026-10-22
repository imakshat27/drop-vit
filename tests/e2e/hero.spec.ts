import { test, expect } from '@playwright/test';
import { fixtures } from '../../scripts/demo-fixtures';

test('hero uses the latest closed top three with covers and illustrated fallbacks', async ({
  page,
}) => {
  await page.route('https://images.example.test/hero-cover.webp', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="450"><rect width="720" height="450" fill="#dbff76"/></svg>',
    }),
  );
  await page.goto('/');
  const builds = page.locator('.collage-build');
  await expect(builds).toHaveCount(3);
  for (let i = 0; i < 3; i++)
    await expect(builds.nth(i)).toHaveAttribute('href', `/projects/${fixtures[i].id}`);
  await expect(builds.nth(1).locator('img.project-cover-image')).toHaveAttribute(
    'src',
    'https://images.example.test/hero-cover.webp',
  );
  await expect(builds.first().locator('.project-art')).toBeVisible();
  await page.route('https://images.example.test/hero-cover.webp', (route) => route.abort());
  await page.reload();
  await expect(builds.nth(1).locator('.project-art')).toBeVisible();
});
