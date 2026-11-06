import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/proyectos/acelerik-booking', '/proyectos/bot-pedidos-whatsapp'];
const CANVAS = '#avatar-slot canvas[data-ready="1"]';
const SAVE_KEY = 'pubsub-rush:v1';

const opacities = (page: Page) =>
  page.locator('.reveal').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));

/** Registra si la navegación entrante trae View Transition (evento pagereveal de las transiciones entre documentos). */
const watchReveal = (page: Page) =>
  page.addInitScript(() => {
    addEventListener('pagereveal', (e) => {
      (window as unknown as { __vt: boolean }).__vt = !!(e as Event & { viewTransition?: unknown }).viewTransition;
    });
  });
const hadTransition = (page: Page) => page.evaluate(() => (window as unknown as { __vt?: boolean }).__vt ?? null);

/** Espera a que terminen las apariciones en curso (axe mide contraste con la opacidad real). */
const revealsSettled = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((a) => (a as CSSAnimation).animationName !== 'reveal-in' || a.playState === 'finished'),
  );

const withTheme = (page: Page, theme: string) =>
  page.addInitScript(
    ([k, th]) => localStorage.setItem(k, JSON.stringify({ v: 1, theme: th })),
    [SAVE_KEY, theme],
  );

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('los .reveal se ven al cargar y no hay transición entre páginas', async ({ page }) => {
    await watchReveal(page);
    await page.goto('/');
    const ops = await opacities(page);
    expect(ops.length).toBeGreaterThan(4);
    expect(ops.every((o) => o === '1')).toBe(true);
    await expect(page.locator('html')).not.toHaveClass(/js-reveal/);
    await page.locator('a.card-link[href="/proyectos/acelerik-booking"]').click();
    await page.waitForURL('**/proyectos/acelerik-booking');
    expect(await hadTransition(page)).toBe(false);
    const caseOps = await opacities(page);
    expect(caseOps.length).toBeGreaterThan(2);
    expect(caseOps.every((o) => o === '1')).toBe(true);
  });
});

test.describe('con movimiento', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('los .reveal fuera de pantalla aparecen al hacer scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/js-reveal/);
    const last = page.locator('.reveal').last();
    expect(await last.evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
    await last.scrollIntoViewIfNeeded();
    await expect.poll(() => last.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await expect(last).toHaveClass(/is-in/);
  });

  test('transición entre la home y un caso', async ({ page }) => {
    await watchReveal(page);
    await page.goto('/');
    await page.locator('a.card-link[href="/proyectos/acelerik-booking"]').click();
    await page.waitForURL('**/proyectos/acelerik-booking');
    expect(await hadTransition(page)).toBe(true);
  });

  test('ida y vuelta home → caso → home: el avatar sigue vivo y sin errores', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/');
    await page.waitForSelector(CANVAS);
    await page.locator('a.card-link[href="/proyectos/acelerik-booking"]').click();
    await page.waitForURL('**/proyectos/acelerik-booking');
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/');
    await expect(page.locator(CANVAS)).toHaveCount(1);
    await expect(page.locator('#play-game')).toBeVisible();
    await page.goto('/proyectos/bot-pedidos-whatsapp');
    await page.locator('nav.next a.prev').click();
    await page.waitForURL((u) => u.pathname === '/');
    await page.waitForSelector(CANVAS);
    await expect(page.locator(CANVAS)).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});

test('sin JS los .reveal se ven', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(p);
    const ops = await opacities(page);
    expect(ops.length).toBeGreaterThan(2);
    expect(ops.every((o) => o === '1')).toBe(true);
  }
  await ctx.close();
});

test('tema azul: el diagrama y la risografía usan el acento azul', async ({ page }) => {
  await withTheme(page, 'azul');
  await page.goto('/proyectos/acelerik-booking');
  const arch = await page.locator('figure.arch').evaluate((f) => {
    const cs = (sel: string) => [...f.querySelectorAll(sel)].map((e) => getComputedStyle(e));
    return {
      fills: cs('.acc-fill').map((s) => s.fill),
      strokes: cs('.acc-stroke').map((s) => s.stroke),
      html: f.innerHTML,
    };
  });
  expect(arch.fills.length).toBeGreaterThan(1); // cabecera de la API y punta de flecha
  expect(arch.strokes.length).toBeGreaterThan(0);
  for (const c of [...arch.fills, ...arch.strokes]) expect(c).toBe('rgb(47, 107, 255)');
  expect(arch.html).not.toMatch(/#E4251B/i);

  const riso = await page.locator('.riso').first().evaluate((e) => ({
    after: getComputedStyle(e, '::after').backgroundColor,
    before: getComputedStyle(e, '::before').backgroundImage,
  }));
  expect(riso.after).toBe('rgb(47, 107, 255)');
  expect(riso.before).not.toMatch(/228,\s*37,\s*27/);
  expect(riso.before).toMatch(/47,\s*107,\s*255|0\.18\d* 0\.41\d* 1/);
});

for (const theme of ['rojo', 'azul', 'verde']) {
  test(`axe sin violaciones serias con el tema ${theme}`, async ({ page }) => {
    await withTheme(page, theme);
    for (const p of PAGES) {
      await page.goto(p);
      await revealsSettled(page);
      const r = await new AxeBuilder({ page }).analyze();
      const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(bad.map((v) => `${p} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    }
  });
}
