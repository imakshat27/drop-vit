import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const routes = [
  '/',
  '/discover',
  '/discover?category=Launches',
  '/weekly',
  '/honors',
  '/honors?view=hall',
  '/recruit',
  '/projects/canvas',
  '/projects/patchwork',
  '/builders/ananya',
  '/signin',
  '/signup',
  '/projects/demo-drop-folio',
  '/projects/demo-drop-canvas',
  '/builders/demo-drop-ananya',
  '/builders/demo-drop-ananya?tab=achievements',
];
test('populated public pages fit narrow phones', async ({ page }) => {
  test.setTimeout(120000);
  await mkdir('.data/mobile-audit', { recursive: true });
  for (const width of [320, 375, 430]) {
    await page.setViewportSize({ width, height: 812 });
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      if (route === '/') {
        const copyWidth = await page
          .locator('.contribute-card p')
          .evaluate((el) => el.getBoundingClientRect().width);
        expect.soft(copyWidth).toBeGreaterThan(width * 0.5);
        await expect(page.locator('.contribute-card .brand-mark')).toBeVisible();
      }
      const report = await page.evaluate(() => {
        const width = innerWidth;
        const selectors =
          '.project-card,.ranking-row,.role-card,.hall-card,.project-title,.profile-header,.section-title,.filter-tabs,.period-tabs,.drop-banner,.project-grid,.role-grid,.search-form,.award-item';
        return {
          width,
          scroll: document.documentElement.scrollWidth,
          overflow: [...document.querySelectorAll(selectors)].flatMap((el) => {
            const r = el.getBoundingClientRect();
            return r.width &&
              (r.right > width + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)
              ? [
                  {
                    tag: el.className,
                    text: el.textContent?.slice(0, 80),
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                    scroll: el.scrollWidth,
                    client: el.clientWidth,
                  },
                ]
              : [];
          }),
        };
      });
      if (width === 375 || report.overflow.length)
        await page.screenshot({
          path: `.data/mobile-audit/${width}-${route.replace(/[^a-zA-Z0-9]/g, '_') || 'home'}.png`,
          fullPage: true,
        });
      expect
        .soft(report.scroll, `page overflow at ${width}: ${route}`)
        .toBeLessThanOrEqual(width + 1);
      expect.soft(report.overflow, `content overflow at ${width}: ${route}`).toEqual([]);
    }
  }
});

test('mobile navigation and authenticated workspaces stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Weekly Drop' })
    .click();
  await expect(page).toHaveURL(/weekly$/);
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await page.goto('/signin');
  await page.getByLabel('VIT student email', { exact: true }).fill('admin@vitstudent.ac.in');
  await page.getByLabel('Password', { exact: true }).fill('Drop-test-only-2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/me$/);
  for (const route of ['/me', '/me?edit=1', '/submit', '/admin']) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: `.data/mobile-audit/320-${route.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
      fullPage: true,
    });
    expect
      .soft(await page.evaluate(() => document.documentElement.scrollWidth), route)
      .toBeLessThanOrEqual(321);
    for (const field of await page.locator('main input, main textarea, main select').all()) {
      const bounds = await field.boundingBox();
      if (bounds) expect.soft(bounds.x + bounds.width, route).toBeLessThanOrEqual(321);
    }
  }
});

test('winner stamp keeps the period separate and the action clear', async ({ page }) => {
  for (const width of [320, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('.champion-period')).not.toBeEmpty();
    await expect(page.locator('.winner-seal')).toHaveText('WEEKLY01WINNER');
    const center = await page.locator('.champion').evaluate((el) => {
      const bounds = el.getBoundingClientRect();
      return scrollY + bounds.top + bounds.height / 2 - innerHeight / 2;
    });
    const rotation = () =>
      page.evaluate(() =>
        parseFloat(document.documentElement.style.getPropertyValue('--winner-rotation')),
      );
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), center - 150);
    await expect.poll(rotation).toBeLessThan(-15);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), center);
    await expect.poll(async () => Math.abs(await rotation())).toBeLessThan(0.2);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), center + 150);
    await expect.poll(rotation).toBeGreaterThan(15);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), center);
    const layout = await page.locator('.champion-action').evaluate((el) => {
      const seal = el.querySelector('.winner-seal')!;
      const link = el.querySelector('a')!;
      const s = seal.getBoundingClientRect();
      const a = link.getBoundingClientRect();
      return { scroll: seal.scrollWidth, width: seal.clientWidth, gap: s.left - a.right };
    });
    expect(layout.scroll).toBeLessThanOrEqual(layout.width);
    expect(layout.gap).toBeGreaterThan(0);
    await page
      .locator('.champion-section')
      .screenshot({ path: `.data/mobile-audit/champion-${width}.png` });
  }
});
