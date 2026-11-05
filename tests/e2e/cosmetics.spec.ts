import { test, expect, type Page } from '@playwright/test';

const CANVAS = '#avatar-slot canvas[data-ready="1"]';
const emitCosmetics = (page: Page, d: object) =>
  page.evaluate((d) => dispatchEvent(new CustomEvent('avatar:cosmetics', { detail: d })), d);
const prop = (page: Page, name: string) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
const frame = (page: Page) => page.locator(CANVAS).evaluate((c: HTMLCanvasElement) => c.toDataURL());
const filterOf = (page: Page, sel: string) => page.locator(sel).evaluate((e) => getComputedStyle(e).filter);

test('tema azul: cambia --acc, el acento del sitio y el filtro del avatar', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  expect((await prop(page, '--acc')).toUpperCase()).toBe('#E4251B'); // el CSS minificado lo normaliza a minúsculas
  await emitCosmetics(page, { shades: false, chain: false, theme: 'azul' });
  await expect.poll(() => prop(page, '--acc')).toBe('#2F6BFF');
  expect(await prop(page, '--accent')).toBe('#2F6BFF');
  // el botón principal usa el acento pequeño derivado del tema
  const bg = await page.locator('#cta-proyectos').evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).toBe('rgb(90, 140, 255)');
  expect(await filterOf(page, CANVAS)).toContain('hue-rotate(215deg)');
  expect(await filterOf(page, '#avatar-slot img')).toContain('hue-rotate(215deg)');
  await emitCosmetics(page, { shades: false, chain: false, theme: 'verde' });
  await expect.poll(() => prop(page, '--acc')).toBe('#3DDC84');
  expect(await filterOf(page, CANVAS)).toContain('hue-rotate(125deg)');
  await emitCosmetics(page, { shades: false, chain: false, theme: 'rojo' });
  await expect.poll(() => prop(page, '--acc')).toBe('#E4251B');
  expect(await filterOf(page, CANVAS)).toBe('none');
});

test('gafas y cadena redibujan el canvas y se pueden quitar', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1500); // que la mirada y la pose se asienten
  await page.evaluate(() => dispatchEvent(new CustomEvent('avatar:pose', { detail: { name: 'neutral', ms: 1 } })));
  const base = await frame(page);
  await emitCosmetics(page, { shades: true, chain: false, theme: 'rojo' });
  await expect.poll(() => frame(page).then((f) => f !== base)).toBe(true);
  const shades = await frame(page);
  await emitCosmetics(page, { shades: true, chain: true, theme: 'rojo' });
  await expect.poll(() => frame(page).then((f) => f !== shades)).toBe(true);
  // el cristal (#141416) está pintado con las gafas puestas y desaparece al quitarlas
  const lens = () => page.locator(CANVAS).evaluate((c: HTMLCanvasElement) => Array.from(c.getContext('2d')!.getImageData(530, 508, 1, 1).data.slice(0, 3)));
  expect(await lens()).toEqual([0x14, 0x14, 0x16]);
  await emitCosmetics(page, { shades: false, chain: false, theme: 'rojo' });
  await expect.poll(lens).not.toEqual([0x14, 0x14, 0x16]);
});

test('tema guardado se aplica antes de la primera pintura (sin parpadeo rojo)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pubsub-rush:v1', JSON.stringify({ best: 0, unlocked: [], theme: 'verde', shades: false, chain: false, progress: {} })));
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForSelector('body', { state: 'attached' });
  expect(await prop(page, '--acc')).toBe('#3DDC84');
  await page.waitForSelector('#avatar-slot img', { state: 'attached' });
  expect(await filterOf(page, '#avatar-slot img')).toContain('hue-rotate(125deg)');
});

for (const bad of ['constructor', '__proto__', 'toString']) {
  test(`tema guardado manipulado "${bad}": el acento sigue en rojo sin errores`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((bad) => localStorage.setItem('pubsub-rush:v1', `{"best":0,"unlocked":[],"theme":"${bad}","shades":false,"chain":false,"progress":{}}`), bad);
    await page.goto('/');
    for (const v of ['--acc', '--accent', '--accent-hi']) expect(await prop(page, v)).not.toContain('undefined');
    expect((await prop(page, '--accent')).toUpperCase()).toBe('#E4251B');
    // y tampoco al emitir el evento con un tema inválido
    await page.waitForSelector(CANVAS);
    await emitCosmetics(page, { shades: false, chain: false, theme: bad });
    expect((await prop(page, '--accent')).toUpperCase()).toBe('#E4251B');
    expect(errors).toEqual([]);
  });
}

test('storage bloqueado: la página sigue en rojo sin errores', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await page.goto('/');
  expect((await prop(page, '--acc')).toUpperCase()).toBe('#E4251B'); // el CSS minificado lo normaliza a minúsculas
  expect(errors).toEqual([]);
});
