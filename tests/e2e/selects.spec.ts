import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './auth-fixture';

test('edition selector supports keyboard, escape, typeahead and GET form values', async ({
  page,
}) => {
  await page.goto('/honors?kind=weekly');
  const edition = page.getByRole('combobox', { name: 'Edition' });
  await expect(edition).not.toBeEmpty();
  await edition.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.screenshot({ path: '.data/selects-desktop.png', animations: 'disabled' });
  await page.keyboard.press('End');
  const last = page.getByRole('option').last();
  await expect(last).toBeFocused();
  const label = await last.innerText();
  await page.keyboard.press('Enter');
  await expect(edition).toContainText(label);
  const value = await page
    .locator('.period-select')
    .evaluate((form) => new FormData(form as HTMLFormElement).get('period'));
  await edition.click();
  await page.keyboard.press('Escape');
  await expect(edition).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'View edition' }).click();
  await expect(page).toHaveURL(new RegExp(`period=${value}`));
});

test('custom menus fit mobile, expose selection and do not introduce accessibility violations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, 'admin@vitstudent.ac.in');
  await page.goto('/admin');
  const decision = page.getByRole('combobox', { name: 'Project', exact: true });
  const initialLabel = await decision.innerText();
  await decision.click();
  const menu = page.getByRole('listbox');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  expect(box!.y + box!.height).toBeLessThanOrEqual(812);
  await page.screenshot({ path: '.data/selects-mobile.png', animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('[role="listbox"]').analyze()).violations).toEqual(
    [],
  );
  await page.getByRole('option', { name: 'Folio', exact: true }).click();
  await expect(decision).toContainText('Folio');
  await decision.click();
  await expect(page.getByRole('option', { name: 'Folio', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('c');
  await expect(page.getByRole('option', { name: 'Canvas Club', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(decision).toContainText('Canvas Club');
  await decision.click();
  await expect(page.getByRole('option', { name: 'Canvas Club', exact: true })).toBeFocused();
  await page.mouse.move(4, 400, { steps: 5 });
  await page.mouse.click(4, 400);
  await expect(menu).toHaveCount(0);
  await decision
    .locator('..')
    .evaluate((field) => (field.closest('form') as HTMLFormElement).reset());
  await expect(decision).toContainText(initialLabel);
});
