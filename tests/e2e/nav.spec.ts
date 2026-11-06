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
    await expect(img).toHaveAttribute('srcset', '/face-nav.webp 1x, /face-nav@2x.webp 2x, /face-nav@3x.webp 3x');
  });

  test('la cara va sola: sin círculo, sin borde y sin fondo de papel', async ({ page }) => {
    await page.goto(CASO);
    const st = await page.locator(`${bar} a.nav-home img`).evaluate((e) => {
      const c = getComputedStyle(e);
      return { radius: c.borderRadius, borde: c.borderTopWidth, fondo: c.backgroundColor, alto: e.getBoundingClientRect().height };
    });
    expect(st.radius).toBe('0px');
    expect(st.borde).toBe('0px');
    expect(st.fondo).toBe('rgba(0, 0, 0, 0)');
    expect(st.alto).toBeGreaterThanOrEqual(38);
    expect(st.alto).toBeLessThanOrEqual(44);
  });

  test('en la home la cara enlaza a #top', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`${bar} a.nav-home`)).toHaveAttribute('href', '#top');
  });

  test('en un caso de estudio la cara enlaza a la home y navega', async ({ page }) => {
    await page.goto(CASO);
    await expect(page.locator(`${bar} a.nav-home`)).toHaveAttribute('href', '/');
    await page.locator(`${bar} a.nav-home`).click();
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('h1').first()).toContainText('Carlos');
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
    await expect(page.locator('#cta-proyectos')).toBeFocused();
  });

  for (const w of [320, 360]) {
    test(`a ${w} px la barra ocupa una sola fila, sin scroll horizontal, y el ancla deja visible el cartel`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 700 });
      await page.goto('/');
      await page.evaluate(() => document.getElementById('experiencia')!.scrollIntoView());
      await expect(page.locator(bar)).toBeVisible();
      expect((await page.locator(bar).boundingBox())!.height).toBeLessThanOrEqual(60);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
      for (const a of await page.locator(`${bar} ul a`).all()) {
        const b = (await a.boundingBox())!;
        expect(b.height).toBeGreaterThanOrEqual(24);
        expect(b.x + b.width).toBeLessThanOrEqual(w);
      }
      await page.locator(`${bar} a[href="#contacto"]`).click();
      await page.waitForFunction(() => location.hash === '#contacto');
      await page.waitForTimeout(600);
      const label = (await page.locator('#contacto .poster').boundingBox())!;
      const nav = (await page.locator(bar).boundingBox())!;
      expect(label.y).toBeGreaterThanOrEqual(nav.y + nav.height - 1);
      expect(label.y).toBeLessThan(nav.y + nav.height + 40);
    });
  }

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
    for (const h of ['/favicon.ico', '/favicon.png', '/face-nav.webp', '/face-nav@2x.webp', '/face-nav@3x.webp']) expect((await request.get(h)).ok()).toBe(true);
  });
});

test('el botón CV del menú está centrado verticalmente con el resto de enlaces', async ({ page }) => {
  await page.goto('/proyectos/acelerik-booking');
  const centro = async (sel: string) => { const b = (await page.locator(sel).boundingBox())!; return b.y + b.height / 2; };
  const cv = await centro('a.nav-cv');
  const otro = await centro('nav ul li:first-child a');
  expect(Math.abs(cv - otro)).toBeLessThanOrEqual(1.5);
});
