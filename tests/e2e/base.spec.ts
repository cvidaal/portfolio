import { test, expect } from '@playwright/test';

test('home: idioma, título y metadatos', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle('Carlos Vidal · Backend Developer · Go');
  await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Backend Developer.*Go/);
});

test('404 propia', async ({ page }) => {
  const r = await page.goto('/no-existe');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/');
});
