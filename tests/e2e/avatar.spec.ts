import { test, expect, devices, type Page } from '@playwright/test';

const CANVAS = '#avatar-slot canvas[data-ready="1"]';
const readLook = async (page: Page) => {
  const v = await page.locator(CANVAS).getAttribute('data-look');
  const [x, y] = (v ?? 'NaN,NaN').split(',').map(Number);
  return { x, y };
};
/** Cuenta los avatar:pose emitidos durante ms milisegundos. */
const countPoses = (page: Page, ms: number) =>
  page.evaluate((ms) => new Promise<number>((r) => {
    let n = 0;
    addEventListener('avatar:pose', () => n++);
    setTimeout(() => r(n), ms);
  }), ms);

test('escritorio: el canvas sustituye a la imagen estática sin mover el layout', async ({ page }) => {
  await page.goto('/');
  const img = page.locator('#avatar-slot img');
  const before = await img.boundingBox();
  await page.waitForSelector(CANVAS);
  const box = await page.locator(CANVAS).boundingBox();
  const after = await img.boundingBox();
  expect(before && box && after).toBeTruthy();
  expect(after).toEqual(before);
  for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![k] - before![k])).toBeLessThan(1);
  await expect(page.locator(CANVAS)).toHaveAttribute('aria-hidden', 'true');
  // el canvas tiene contenido (no transparente) en el centro de la cara
  const alpha = await page.locator(CANVAS).evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(600, 600, 1, 1).data[3]);
  expect(alpha).toBe(255);
});

test('guiño al pulsar Descargar CV sin bloquear la descarga', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  const winked = page.evaluate(() => new Promise((r) => addEventListener('avatar:wink', () => r(true), { once: true })));
  await page.route('**/CarlosVidal_Backend_CV.pdf', (r) => r.fulfill({ status: 200, contentType: 'application/pdf', body: '' }));
  const download = page.waitForEvent('download');
  await page.locator('#cta-cv').click();
  expect(await winked).toBe(true);
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  // el guiño cierra un ojo: el canvas cambia y vuelve a abrirse ~1 s después
  await expect(page.locator(CANVAS)).toHaveAttribute('data-closed', /^(0,2|2,0)$/);
  await expect(page.locator(CANVAS)).toHaveAttribute('data-closed', '0,0', { timeout: 3000 });
});

test('clic en el avatar también guiña', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  const winked = page.evaluate(() => new Promise((r) => addEventListener('avatar:wink', () => r(true), { once: true })));
  await page.locator(CANVAS).click();
  expect(await winked).toBe(true);
});

test('reduced motion: sin gestos automáticos (con control sin reduced motion)', async ({ browser }) => {
  const reduce = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  const normal = await (await browser.newContext({ reducedMotion: 'no-preference' })).newPage();
  await Promise.all([reduce.goto('/'), normal.goto('/')]);
  await Promise.all([reduce.waitForSelector(CANVAS), normal.waitForSelector(CANVAS)]);
  const [nReduce, nNormal] = await Promise.all([countPoses(reduce, 8000), countPoses(normal, 8000)]);
  expect(nReduce).toBe(0);
  expect(nNormal).toBeGreaterThan(0);
  // sin parpadeo animado: los ojos nunca se cierran solos
  await expect(reduce.locator(CANVAS)).toHaveAttribute('data-closed', '0,0');
  // la mirada salta directamente (sin suavizado)
  await reduce.mouse.move(0, 0);
  await reduce.mouse.move(5, 300);
  await reduce.waitForTimeout(50);
  const l = await readLook(reduce);
  expect(l.x).toBeLessThan(-0.9);
  await reduce.context().close(); await normal.context().close();
});

test('hover en Ver proyectos pone la risa', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  await page.locator('#cta-proyectos').hover();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-pose', 'grin');
});

test('redimensionar recalcula la mirada', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  await page.setViewportSize({ width: 1000, height: 800 });
  const box = (await page.locator(CANVAS).boundingBox())!;
  // ojos ~ (597/1254, 515/1254) de la caja del canvas
  const eyeX = box.x + box.width * (597 / 1254), eyeY = box.y + box.height * (515 / 1254);
  await page.mouse.move(Math.max(1, eyeX - 400), eyeY, { steps: 20 });
  await expect.poll(async () => (await readLook(page)).x, { timeout: 4000 }).toBeLessThan(-0.9);
  expect(Math.abs((await readLook(page)).y)).toBeLessThan(0.2);
  await page.mouse.move(eyeX + 20, eyeY + 300, { steps: 20 });
  await expect.poll(async () => (await readLook(page)).y, { timeout: 4000 }).toBeGreaterThan(0.9);
  // un resize sin mover el ratón también recalcula: el avatar se mueve bajo un ratón quieto
  await page.mouse.move(eyeX, eyeY, { steps: 10 });
  await expect.poll(async () => Math.hypot(...Object.values(await readLook(page))), { timeout: 4000 }).toBeLessThan(0.1);
  await page.setViewportSize({ width: 1400, height: 800 });
  await expect.poll(async () => Math.hypot(...Object.values(await readLook(page))), { timeout: 4000 }).toBeGreaterThan(0.3);
});

test.describe('móvil', () => {
  const { defaultBrowserType: _b, ...pixel } = devices['Pixel 5'];
  test.use(pixel);

  test('no carga el compositor al inicio', async ({ page }) => {
    const reqs: string[] = [];
    page.on('request', (r) => reqs.push(r.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page.locator('#avatar-slot canvas')).toHaveCount(0);
    expect(reqs.some((u) => u.includes('/avatar/layers.json') || u.includes('/avatar/base.webp'))).toBe(false);
    await expect(page.locator('#avatar-slot img')).toBeVisible();
  });

  test('se carga al abrir el juego', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => dispatchEvent(new CustomEvent('game:open')));
    await page.waitForSelector(CANVAS);
  });

  test('se carga si hay accesorios o tema guardados', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pubsub-rush:v1', JSON.stringify({ best: 0, unlocked: [], theme: 'rojo', shades: true, chain: false, progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 } })));
    await page.goto('/');
    await page.waitForSelector(CANVAS);
  });

  test('save sin accesorios ni tema no carga el compositor', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pubsub-rush:v1', JSON.stringify({ best: 0, unlocked: [], theme: 'rojo', shades: false, chain: false, progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 } })));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page.locator('#avatar-slot canvas')).toHaveCount(0);
  });
});
