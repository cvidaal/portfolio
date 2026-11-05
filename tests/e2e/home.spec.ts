import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('sin JS se lee todo', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const txt of [
    'Carlos',
    'Vidal',
    'Backend Developer · Go',
    'Top Doctors',
    'Integration Developer',
    'Acelerik Booking',
    'POST /contacto',
    'carlosvidal.developer@gmail.com',
  ])
    await expect(page.getByText(txt, { exact: false }).first()).toBeVisible();
  await expect(page.locator('#avatar-slot img')).toBeVisible();
  await expect(page.locator('#play-game')).toBeHidden();
  await ctx.close();
});

test('CV y enlaces', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#cta-cv')).toHaveAttribute('href', '/CarlosVidal_Backend_CV.pdf');
  await expect(page.locator('#cta-proyectos')).toHaveAttribute('href', '#proyectos');
  for (const id of ['experiencia', 'proyectos', 'contacto'])
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  expect(await page.content()).not.toMatch(/FullStack_CV|Full Stack/);
});

test('sin scroll horizontal a 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('copiar email', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: /copiar email/i }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('carlosvidal.developer@gmail.com');
});

test('a11y sin violaciones serias', async ({ page }) => {
  await page.goto('/');
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});
