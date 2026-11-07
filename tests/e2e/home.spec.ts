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
  await expect(page.locator('.arcade')).toBeHidden();
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

test('a11y sin violaciones serias', async ({ page }) => {
  await page.goto('/');
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});

test('copiar email: si falla el portapapeles se avisa y no se dice copiado', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
    document.execCommand = () => false;
  });
  await page.goto('/');
  const btn = page.getByRole('button', { name: /^Email/ });
  await btn.click();
  await expect(page.locator('#copy-status')).toContainText('No se pudo copiar');
  await expect(page.locator('#copy-status')).toBeVisible();
  await expect(page.getByText('Email copiado')).toHaveCount(0);
  await expect(btn.locator('.copy-txt')).toHaveText('Copiar email');
});

test('copiar email: dos clics rápidos no dejan la etiqueta atascada', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const btn = page.getByRole('button', { name: /^Email/ });
  await btn.click();
  await expect(btn.locator('.copy-txt')).toHaveText('Email copiado');
  await btn.click();
  await expect(btn.locator('.copy-txt')).toHaveText('Email copiado');
  await expect(btn.locator('.copy-txt')).toHaveText('Copiar email', { timeout: 5000 });
});

test('botones de CV: descargan, ruedan el texto al pasar y avisan con 200 OK al pulsar', async ({ page }) => {
  await page.route('**/CarlosVidal_Backend_CV.pdf', (r) => r.fulfill({ status: 200, contentType: 'application/pdf', body: '' }));
  await page.goto('/');
  const hero = page.locator('#cta-cv');
  await expect(hero).toHaveAccessibleName('Descargar CV');
  await hero.hover();
  await expect(hero.locator('.roll .alt')).toHaveText('↓ PDF · 1 página');
  await hero.click();
  await expect(hero.locator('.cv-toast')).toHaveText('GET /cv → 200 OK');
  await expect(hero.locator('.cv-toast')).toHaveCount(0, { timeout: 3000 });
  await page.locator('#contacto').scrollIntoViewIfNeeded(); // el menú solo se muestra pasado el hero
  const nav = page.locator('a.nav-cv');
  await expect(nav).toHaveAttribute('download', 'CarlosVidal_Backend_CV.pdf');
  await expect(nav).toHaveAccessibleName('CV');
});
