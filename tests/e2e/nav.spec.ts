import { test, expect } from '@playwright/test';
import { t } from '../../src/i18n';

const bar = 'header.nav';
const CASO = '/proyectos/acelerik-booking';

test.describe('menú con la cara', () => {
  test('la barra no lleva el nombre en texto y sí la cara con alt', async ({ page }) => {
    await page.goto(CASO);
    await expect(page.locator(bar)).not.toContainText('Carlos Vidal');
    const img = page.locator(`${bar} a.nav-home img`);
    await expect(img).toHaveAttribute('alt', t('nav.inicio'));
    await expect(img).toHaveAttribute('src', '/face-nav.webp');
    await expect(page.locator(`${bar} a.nav-home`)).toHaveAttribute('href', '#top');
  });

  test('en la home, con JS, la barra está oculta mientras se ve el hero y aparece al bajar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(bar)).toBeHidden();
    await expect(page.locator(bar)).toHaveAttribute('inert', '');
    await expect(page.locator('html')).toHaveClass(/nav-hidden/);
    await page.locator('#experiencia').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('experiencia')!.scrollIntoView());
    await expect(page.locator(bar)).toBeVisible();
    await expect(page.locator(bar)).not.toHaveAttribute('inert', '');
    await expect(page.locator('html')).not.toHaveClass(/nav-hidden/);
    // Vuelve a ocultarse al subir al hero.
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator(bar)).toBeHidden();
  });

  test('la barra oculta no recibe foco', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // enlace "saltar"
    await page.keyboard.press('Tab');
    const enBarra = await page.evaluate(() => !!document.activeElement?.closest('header.nav'));
    expect(enBarra).toBe(false);
  });

  test.describe('sin JS', () => {
    test.use({ javaScriptEnabled: false });
    test('la barra es visible en la home', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator(bar)).toBeVisible();
      await expect(page.locator(`${bar} a.nav-home img`)).toBeVisible();
    });
  });

  test('en un caso de estudio la barra se ve al cargar', async ({ page }) => {
    await page.goto(CASO);
    await expect(page.locator(bar)).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/nav-hidden/);
  });

  test.describe('movimiento reducido', () => {
    test.use({ reducedMotion: 'reduce' });
    test('aparece sin transición', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator(bar)).toBeHidden();
      const dur = await page.locator(bar).evaluate((e) => getComputedStyle(e).transitionDuration);
      expect(dur.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
      await page.evaluate(() => document.getElementById('experiencia')!.scrollIntoView());
      await expect(page.locator(bar)).toBeVisible();
    });
  });

  test('la cara hace un gesto al pasar el ratón', async ({ page }) => {
    await page.goto(CASO);
    const img = page.locator(`${bar} a.nav-home img`);
    const antes = await img.evaluate((e) => getComputedStyle(e).transform);
    await page.locator(`${bar} a.nav-home`).hover();
    await expect.poll(() => img.evaluate((e) => getComputedStyle(e).transform)).not.toBe(antes);
  });
});

test.describe('favicon', () => {
  test('los iconos enlazados son los de la cara y no hay favicon.svg', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((l) =>
      l.map((e) => e.getAttribute('href')),
    );
    expect(hrefs).toEqual(['/favicon.ico', '/favicon.png', '/favicon.png']);
    expect(hrefs.join()).not.toContain('.svg');
    expect((await request.get('/favicon.svg')).status()).toBe(404);
    for (const h of ['/favicon.ico', '/favicon.png', '/face-nav.webp']) expect((await request.get(h)).ok()).toBe(true);
  });
});
