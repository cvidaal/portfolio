import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('tres tarjetas en orden', async ({ page }) => {
  await page.goto('/');
  const titles = page.locator('#proyectos article h3');
  await expect(titles).toHaveText(['Acelerik Booking', 'Bot de pedidos por WhatsApp', 'App Bendita Burger']);
  await expect(page.locator('#proyectos')).not.toContainText(/Taller Manager|en producción/);
});

test('las tarjetas enlazan a su caso o a las tiendas', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#proyectos article');
  await expect(cards.nth(0).locator('a.card-link')).toHaveAttribute('href', '/proyectos/acelerik-booking');
  await expect(cards.nth(1).locator('a.card-link')).toHaveAttribute('href', '/proyectos/bot-pedidos-whatsapp');
  await expect(cards.nth(2).getByRole('link', { name: /App Store/ })).toHaveAttribute('href', /apps\.apple\.com/);
  await expect(cards.nth(2).getByRole('link', { name: /Google Play/ })).toHaveAttribute('href', /play\.google\.com/);
  await expect(cards.nth(1)).toContainText('más de 300 tests');
  await expect(page.locator('#proyectos')).not.toContainText('880');
});

test('caso Acelerik: índice, código real y navegación', async ({ page }) => {
  await page.goto('/proyectos/acelerik-booking');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Acelerik');
  // En producción "El problema" y "Qué aprendí" (pendientes de Carlos) no se publican: 8 - 2 = 6.
  await expect(page.locator('nav.toc a')).toHaveCount(6);
  await expect(page.locator('pre')).toContainText('pg_advisory_xact_lock');
  await expect(page.locator('body')).not.toContainText(/\bCI\b(?! con GitHub Actions)/);
  await expect(page.getByRole('link', { name: /Bot de pedidos/ })).toHaveAttribute('href', '/proyectos/bot-pedidos-whatsapp');
  await expect(page.getByRole('link', { name: /Volver a proyectos/ })).toHaveAttribute('href', '/#proyectos');
});

test('caso Bot: índice y sin menciones prohibidas', async ({ page }) => {
  await page.goto('/proyectos/bot-pedidos-whatsapp');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bot');
  await expect(page.locator('nav.toc a')).toHaveCount(5);
  await expect(page.locator('body')).toContainText('más de 300 tests');
  await expect(page.locator('body')).not.toContainText(/Claude|880/);
  await expect(page.getByRole('link', { name: /Acelerik Booking/ }).first()).toHaveAttribute('href', '/proyectos/acelerik-booking');
});

test('los casos no publican secciones pendientes', async ({ page }) => {
  for (const slug of ['acelerik-booking', 'bot-pedidos-whatsapp']) {
    await page.goto(`/proyectos/${slug}`);
    await expect(page.locator('body')).not.toContainText(/PLACEHOLDER|confirmar con Carlos|Qué aprendí/);
  }
});

test('Bendita no tiene caso de estudio', async ({ page }) => {
  expect((await page.goto('/proyectos/bendita-burger'))?.status()).toBe(404);
});

test('casos sin scroll horizontal a 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const url of ['/', '/proyectos/acelerik-booking', '/proyectos/bot-pedidos-whatsapp']) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});

test('accesibilidad de los casos', async ({ page }) => {
  for (const slug of ['acelerik-booking', 'bot-pedidos-whatsapp']) {
    await page.goto(`/proyectos/${slug}`);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  }
});

test('sin JS el caso se lee entero', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/proyectos/acelerik-booking');
  await expect(page.getByText('Cero overbooking').first()).toBeVisible();
  await expect(page.locator('nav.toc')).toBeVisible();
  await ctx.close();
});

test('el índice marca la sección que se lee', async ({ page }) => {
  await page.goto('/proyectos/acelerik-booking');
  await page.locator('#testing').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('#testing')!.scrollIntoView());
  await expect(page.locator('nav.toc a[aria-current]')).toHaveText('Testing');
});
