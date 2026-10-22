import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [375, 1440])
  test(`clean launch has dated placeholders and no projects at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const first = new Date(String(test.info().config.metadata.firstRelease)).toLocaleDateString(
      'en-IN',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' },
    );
    for (const path of ['/', '/discover', '/weekly', '/honors', '/honors?view=hall', '/recruit']) {
      await page.goto(path);
      await expect(page.locator('main')).toContainText(first);
      await expect(page.locator('.project-card, .ranking-row, .collage-build')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
      await expect(page.getByText('Fictional sample exhibition')).toHaveCount(0);
      if (path === '/') {
        await expect(page.locator('.hero-first-drop')).toBeVisible();
        const audit = await new AxeBuilder({ page })
          .include('main')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([]);
        await page.screenshot({ path: `.data/launch-empty-${width}.png`, fullPage: true });
      }
    }
  });
