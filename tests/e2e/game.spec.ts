import { test, expect, type Page } from '@playwright/test';

const KEY = 'pubsub-rush:v1';
const CANVAS = '#avatar-slot canvas[data-ready="1"]';
type SaveIn = { best?: number; unlocked?: string[]; theme?: string; shades?: boolean; chain?: boolean; progress?: object };
const save = (s: SaveIn) => ({
  best: 0, unlocked: [], theme: 'rojo', shades: false, chain: false,
  progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 }, ...s,
});
/** Inyecta un guardado antes de cargar la página. */
const withSave = (page: Page, s: SaveIn) =>
  page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(save(s))] as const);
/** Partida no guiada: ya se ha jugado antes. */
const veteran = (page: Page) => withSave(page, { best: 10, unlocked: ['hola'] });
/** Registra los eventos del bus en window.__ev. */
const recordBus = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __ev: { type: string; detail: unknown }[] };
    w.__ev = [];
    for (const type of ['game:open', 'game:close', 'avatar:cosmetics', 'avatar:pose', 'avatar:wink'])
      addEventListener(type, (e) => w.__ev.push({ type, detail: (e as CustomEvent).detail }));
  });
const events = (page: Page, type: string) =>
  page.evaluate((t) => (window as unknown as { __ev: { type: string; detail: unknown }[] }).__ev.filter((e) => e.type === t).map((e) => e.detail), type);

/** Ancho de página y elementos que se salen por la derecha (para depurar si falla). */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out: string[] = [];
    document.querySelectorAll('body *').forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.right > w + 0.5) out.push(`${e.tagName}.${(e as HTMLElement).className} ${Math.round(r.right)}`);
    });
    return { scrollWidth: document.documentElement.scrollWidth, out: out.slice(0, 6) };
  });

const score = (page: Page) => page.locator('.game-board [data-hud="score"]');

async function openGame(page: Page) {
  await page.goto('/');
  const play = page.locator('#play-game');
  await expect(play).toBeVisible();
  await play.click();
  await expect(page.locator('.game-board')).toBeVisible();
}

/** Fuerza el fin: manda cada mensaje al servicio equivocado hasta 5 dead letters. */
async function forceEnd(page: Page) {
  const pm = page.locator('.postmortem');
  const deadline = Date.now() + 25000;
  while (!(await pm.isVisible())) {
    if (Date.now() > deadline) throw new Error('la partida no terminó');
    const first = page.locator('.game-board .msg').first();
    const type = await first.getAttribute('data-type', { timeout: 200 }).catch(() => null);
    if (type) await page.locator(`.game-board .svc:not([data-type="${type}"])`).first().click({ timeout: 1000 }).catch(() => {});
    else await page.waitForTimeout(100);
  }
}

test('partida guiada jugable con teclado', async ({ page }) => {
  await recordBus(page);
  await openGame(page);
  // el texto del hero se aparta y deja de ser accesible; el foco entra en el tablero
  const txt = page.locator('.hero .txt');
  await expect(txt).toHaveAttribute('aria-hidden', 'true');
  expect(await txt.evaluate((e) => (e as HTMLElement).inert)).toBe(true);
  expect(await page.evaluate(() => !!document.activeElement?.closest('.game-board'))).toBe(true);
  expect(await events(page, 'game:open')).toHaveLength(1);

  const hint = page.locator('.game-hint');
  await expect(hint).toContainText(/pulsa [123]/);
  const key = (await hint.textContent())!.match(/pulsa ([123])/)![1];
  await page.keyboard.press(key);
  await expect(page.locator('.game-board .float').first()).toContainText('200 OK +10');
  await expect(score(page)).toHaveText('10');

  // Escape cierra y devuelve el foco al botón del juego
  await page.keyboard.press('Escape');
  await expect(page.locator('.game-board')).toHaveCount(0);
  await expect(page.locator('#play-game')).toBeFocused();
  await expect(txt).not.toHaveAttribute('aria-hidden', 'true');
  expect(await txt.evaluate((e) => (e as HTMLElement).inert)).toBe(false);
  expect(await events(page, 'game:close')).toHaveLength(1);
});

test('teclas 1/2/3 no hacen nada fuera del juego', async ({ page }) => {
  await veteran(page);
  await page.goto('/');
  await expect(page.locator('#play-game')).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.locator('.game-board')).toHaveCount(0);

  await page.locator('#play-game').click();
  const first = page.locator('.game-board .msg').first();
  await expect(first).toBeVisible();
  const id = await first.getAttribute('data-id');
  // foco en un campo de texto: las teclas se escriben, no enrutan
  await page.evaluate(() => { const i = document.createElement('input'); i.id = 'probe'; document.body.appendChild(i); i.focus(); });
  for (const k of ['1', '2', '3']) await page.keyboard.press(k);
  await expect(page.locator('#probe')).toHaveValue('123');
  await expect(score(page)).toHaveText('0');
  await expect(page.locator('.game-board [data-hud="dlq"]')).toHaveText('0/5');
  await expect(page.locator(`.game-board .msg[data-id="${id}"]`)).toHaveCount(1);
  // tecla mantenida (repeat) se ignora
  await page.locator('.game-board').focus();
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key: '1', repeat: true, bubbles: true })));
  await expect(page.locator(`.game-board .msg[data-id="${id}"]`)).toHaveCount(1);
  await expect(page.locator('.game-board [data-hud="dlq"]')).toHaveText('0/5');

  // con el post-mortem abierto la puntuación no cambia
  await forceEnd(page);
  const final = await page.locator('.postmortem [data-pm="score"]').textContent();
  for (const k of ['1', '2', '3']) await page.keyboard.press(k);
  await page.waitForTimeout(200);
  await expect(page.locator('.postmortem [data-pm="score"]')).toHaveText(final!);
  await expect(page.locator('.game-board [data-hud="dlq"]')).toHaveText('5/5');
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('botones de servicio grandes y tocar mensaje lo selecciona', async ({ page }) => {
    await openGame(page);
    const svcs = page.locator('.game-board .svc');
    await expect(svcs).toHaveCount(3);
    for (const b of await svcs.all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const o = await overflow(page);
    expect(o.scrollWidth, JSON.stringify(o)).toBeLessThanOrEqual(375);
    const msg = page.locator('.game-board .msg').first();
    await expect(msg).toBeVisible();
    await msg.tap();
    await expect(msg).toHaveAttribute('aria-pressed', 'true');
    const type = await msg.getAttribute('data-type');
    await page.locator(`.game-board .svc[data-type="${type}"]`).tap();
    await expect(score(page)).toHaveText('10');
  });

  test('a 320 px el tablero no provoca scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openGame(page);
    await expect(page.locator('.game-board .msg').first()).toBeVisible();
    const o = await overflow(page);
    expect(o.scrollWidth, JSON.stringify(o)).toBeLessThanOrEqual(320);
  });

  test('abrir el juego monta un avatar que reacciona', async ({ page }) => {
    await openGame(page);
    await page.waitForSelector(CANVAS);
    expect(await page.evaluate(() => document.documentElement.dataset.game)).toBe('open');
    await page.evaluate(() => dispatchEvent(new CustomEvent('avatar:pose', { detail: { name: 'think', ms: 3000 } })));
    await expect(page.locator(CANVAS)).toHaveAttribute('data-pose', 'think');
  });
});

test('el avatar no hace gestos sueltos mientras se juega', async ({ page }) => {
  await recordBus(page);
  await page.goto('/');
  await page.waitForSelector(CANVAS);
  await page.locator('#play-game').click(); // partida guiada: sin eventos en los primeros 12 s
  await page.mouse.move(2, 2);
  await page.evaluate(() => { (window as unknown as { __ev: unknown[] }).__ev.length = 0; }); // solo lo que pasa ya jugando
  await page.waitForTimeout(7000);
  expect(await events(page, 'avatar:pose')).toEqual([]);
  // al cerrar (escritorio) vuelven los gestos sueltos
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await events(page, 'avatar:pose')).length, { timeout: 9000 }).toBeGreaterThan(0);
});

test('incidentes visibles en el tablero', async ({ page }) => {
  test.slow();
  await veteran(page);
  await openGame(page);
  const banner = page.locator('.game-incident');
  const deadline = Date.now() + 40000;
  // jugar bien hasta que llegue el primer incidente (~15 s)
  while (!(await banner.isVisible())) {
    if (Date.now() > deadline) throw new Error('no hubo incidente');
    const first = page.locator('.game-board .msg').first();
    const type = await first.getAttribute('data-type', { timeout: 200 }).catch(() => null);
    if (type) await page.locator(`.game-board .svc[data-type="${type}"]`).click({ timeout: 1000 }).catch(() => {});
    else await page.waitForTimeout(50);
  }
  const kind = await banner.getAttribute('data-kind');
  expect(['pico', 'caido', 'deploy']).toContain(kind);
  if (kind === 'caido') await expect(page.locator('.game-board .svc.down')).toHaveCount(1);
  if (kind === 'deploy') {
    const order = await page.locator('.game-board .svc').evaluateAll((els) => els.map((e) => e.getAttribute('data-type')));
    expect(order).not.toEqual(['pago', 'reserva', 'aviso']);
  }
  if (kind === 'pico') await expect(banner).toContainText(/pico/i);
});

test.describe('post-mortem', () => {
  test('compartir copia el texto y hay puente al contenido', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
    await veteran(page);
    await openGame(page);
    await forceEnd(page);
    const pm = page.locator('.postmortem');
    await expect(pm).toContainText('entregados');
    await expect(pm).toContainText('dead letters');
    await expect(pm).toContainText('racha máx.');
    await expect(pm).toContainText('récord');
    await expect(pm.locator('[data-pm="dlq"]')).toHaveText('5/5');
    await expect(pm.getByRole('button', { name: 'Otra partida' })).toBeFocused();
    await pm.getByRole('button', { name: /compartir/i }).click();
    await expect(pm.locator('.pm-status')).toContainText('Copiado');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(/^He sobrevivido a un turno de guardia de Carlos: \d+ pts — https:\/\/www\.cvidal\.dev$/);
    await expect(pm.locator('a[href="#experiencia"]')).toHaveCount(1);
    await expect(pm.locator('a[href="#proyectos"]')).toHaveCount(1);
    // otra partida reinicia; volver cierra
    await pm.getByRole('button', { name: 'Otra partida' }).click();
    await expect(pm).toHaveCount(0);
    await expect(score(page)).toHaveText('0');
    await page.locator('.game-board').getByRole('button', { name: /salir/i }).click();
    await expect(page.locator('.game-board')).toHaveCount(0);
  });

  test('con Web Share usa navigator.share', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared: unknown[] };
      w.__shared = [];
      Object.defineProperty(navigator, 'share', { value: (d: unknown) => { w.__shared.push(d); return Promise.resolve(); }, configurable: true });
    });
    await veteran(page);
    await openGame(page);
    await forceEnd(page);
    await page.locator('.postmortem').getByRole('button', { name: /compartir/i }).click();
    await expect(page.locator('.postmortem .pm-status')).toContainText('Compartido');
    const shared = await page.evaluate(() => (window as unknown as { __shared: { text: string; url: string }[] }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toBe('https://www.cvidal.dev');
    expect(shared[0].text).toMatch(/^He sobrevivido a un turno de guardia de Carlos: \d+ pts$/);
  });

  test('si no se puede copiar se avisa', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
      document.execCommand = () => false;
    });
    await veteran(page);
    await openGame(page);
    await forceEnd(page);
    await page.locator('.postmortem').getByRole('button', { name: /compartir/i }).click();
    await expect(page.locator('.postmortem .pm-status')).toContainText('No se pudo copiar');
    await expect(page.locator('.postmortem .pm-status')).not.toContainText('Copiado');
  });

  test('volver cierra el tablero y devuelve el foco', async ({ page }) => {
    await recordBus(page);
    await veteran(page);
    await openGame(page);
    await forceEnd(page);
    await page.locator('.postmortem').getByRole('button', { name: 'Volver' }).click();
    await expect(page.locator('.game-board')).toHaveCount(0);
    await expect(page.locator('#play-game')).toBeFocused();
    expect(await events(page, 'game:close')).toHaveLength(1);
    // el resultado queda guardado
    const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
    expect(s.best).toBeGreaterThanOrEqual(10);
  });
});

test.describe('vitrina', () => {
  test('progreso visible sin haber jugado', async ({ page }) => {
    await page.goto('/');
    const shelf = page.locator('.vitrina');
    await expect(shelf).toBeVisible();
    await expect(shelf).toContainText('racha máx.: 0/10');
    await expect(shelf).toContainText('webhooks: 0/5');
    await expect(shelf).toContainText('puntos: 0/500');
    await expect(shelf.getByRole('button')).toHaveCount(0); // nada desbloqueado, nada que activar
  });

  test('accesorios activables con save preinyectado', async ({ page }) => {
    await recordBus(page);
    await withSave(page, { best: 120, unlocked: ['hola', 'racha'], progress: { maxCombo: 10, maxHooks: 2, maxScore: 120 } });
    await page.goto('/');
    const shelf = page.locator('.vitrina');
    await expect(shelf).toContainText('racha máx.: 10/10');
    await expect(shelf).toContainText('webhooks: 2/5');
    await expect(shelf).toContainText('120');
    const gafas = shelf.getByRole('button', { name: /gafas/i });
    await expect(gafas).toHaveAttribute('aria-pressed', 'false');
    await expect(shelf.getByRole('button', { name: /cadenas/i })).toHaveCount(0);
    await expect(shelf.getByRole('button', { name: /azul|verde/i })).toHaveCount(0);
    await gafas.click();
    await expect(gafas).toHaveAttribute('aria-pressed', 'true');
    expect(await events(page, 'avatar:cosmetics')).toContainEqual({ shades: true, chain: false, theme: 'rojo' });
    expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)).shades).toBe(true);
  });

  test('tema desbloqueado cambia el acento del sitio', async ({ page }) => {
    await withSave(page, { best: 200, unlocked: ['hola', 'cero'] });
    await page.goto('/');
    await page.locator('.vitrina').getByRole('button', { name: /azul/i }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim())).toBe('#2F6BFF');
    await page.locator('.vitrina').getByRole('button', { name: /rojo/i }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim().toUpperCase())).toBe('#E4251B');
  });

  test('nota secreta oculta en producción si es placeholder', async ({ page }) => {
    await withSave(page, { best: 600, unlocked: ['hola', 'racha', 'hooks', 'cero', 'mil', 'secreto'], shades: true, chain: true });
    await page.goto('/');
    const secret = page.locator('.vitrina [data-ach="secreto"]');
    await expect(secret).toContainText('Lo has visto todo');
    await expect(secret.locator('.nota')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('PLACEHOLDER');
  });

  test('secreto bloqueado no revela su nombre', async ({ page }) => {
    await page.goto('/');
    const secret = page.locator('.vitrina [data-ach="secreto"]');
    await expect(secret).toContainText('???');
    await expect(secret).not.toContainText('Lo has visto todo');
  });
});
