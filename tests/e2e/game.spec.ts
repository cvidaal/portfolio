import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KEY = 'pubsub-rush:v1';
const CANVAS = '#avatar-slot canvas[data-ready="1"]';
type SaveIn = { best?: number; unlocked?: string[]; theme?: string; shades?: boolean; chain?: boolean; progress?: object };
const save = (s: SaveIn) => ({
  best: 0, unlocked: [], theme: 'rojo', shades: false, chain: false,
  progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 }, ...s,
});
/** Inyecta un guardado antes de la primera carga (una recarga conserva lo que haya guardado el juego). */
const withSave = (page: Page, s: SaveIn) =>
  page.addInitScript(([k, v]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem(k, v);
  }, [KEY, JSON.stringify(save(s))] as const);
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

/** Abre el panel de logros desde la pegatina de la tarjeta arcade. */
async function openLogros(page: Page) {
  const chip = page.locator('.arcade .chip');
  await expect(chip).toBeVisible();
  await chip.click();
  const dlg = page.getByRole('dialog', { name: 'Logros' });
  await expect(dlg).toBeVisible();
  return dlg;
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


  test('abrir el juego monta un avatar que reacciona', async ({ page }) => {
    await openGame(page);
    await page.waitForSelector(CANVAS);
    expect(await page.evaluate(() => document.documentElement.dataset.game)).toBe('open');
    await page.evaluate(() => dispatchEvent(new CustomEvent('avatar:pose', { detail: { name: 'think', ms: 3000 } })));
    await expect(page.locator(CANVAS)).toHaveAttribute('data-pose', 'think');
  });
});

test.describe('móvil 320', () => {
  // viewport fijado al crear el contexto (no con setViewportSize tras crearlo a 375)
  test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });

  test('a 320 px el tablero no provoca scroll horizontal', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('.game-board .msg').first()).toBeVisible();
    const o = await overflow(page);
    expect(o.scrollWidth, JSON.stringify(o)).toBeLessThanOrEqual(320);
    // y tampoco al terminar (post-mortem) ni con un toast o flotante largo
    await page.locator('.game-board .toasts').evaluate((el) => {
      const p = document.createElement('p'); p.className = 'toast'; p.textContent = 'x'.repeat(200); el.appendChild(p);
    });
    const o2 = await overflow(page);
    expect(o2.scrollWidth, JSON.stringify(o2)).toBeLessThanOrEqual(320);
  });

  test('ningún elemento del tablero puede ensanchar la página', async ({ page }) => {
    await openGame(page);
    await page.locator('.game-board').evaluate((el) => {
      const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:0;top:0;width:1200px;height:4px'; el.appendChild(d);
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test('salir a mitad de turno: el panel de logros refleja el progreso y un interruptor no lo pisa', async ({ page }) => {
  await withSave(page, { best: 10, unlocked: ['hola', 'racha'] });
  await openGame(page);
  let routed = 0;
  const deadline = Date.now() + 15000;
  while (routed < 3 && Date.now() < deadline) {
    const type = await page.locator('.game-board .msg').first().getAttribute('data-type', { timeout: 300 }).catch(() => null);
    if (!type) continue;
    await page.locator(`.game-board .svc[data-type="${type}"]`).click();
    routed++;
  }
  expect(routed).toBe(3);
  await expect(score(page)).not.toHaveText('0');
  await page.keyboard.press('Escape');
  const shelf = await openLogros(page);
  const racha = shelf.locator('[data-ach="racha"] .pg');
  await expect(racha).not.toHaveText('racha máx.: 0/10');
  const progress = await racha.textContent();
  const n = Number(progress!.match(/(\d+)\/10/)![1]);
  expect(n).toBeGreaterThanOrEqual(1);
  // un interruptor después de salir no borra el progreso guardado
  await shelf.getByRole('button', { name: /gafas/i }).click();
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.shades).toBe(true);
  expect(saved.progress.maxCombo).toBe(n);
  await page.reload();
  await expect((await openLogros(page)).locator('[data-ach="racha"] .pg')).toHaveText(progress!);
});

test('durante la partida no se llega a los logros; tras el turno, un interruptor no pisa el progreso', async ({ page }) => {
  await withSave(page, { best: 10, unlocked: ['hola', 'racha'] });
  await openGame(page);
  await expect(page.locator('.arcade')).toBeHidden(); // la tarjeta (y su pegatina) se aparta con el texto del hero
  let routed = 0;
  const deadline = Date.now() + 15000;
  while (routed < 2 && Date.now() < deadline) {
    const type = await page.locator('.game-board .msg').first().getAttribute('data-type', { timeout: 300 }).catch(() => null);
    if (!type) continue;
    await page.locator(`.game-board .svc[data-type="${type}"]`).click();
    routed++;
  }
  await forceEnd(page);
  await page.locator('.postmortem').getByRole('button', { name: 'Ver logros' }).click();
  await page.getByRole('dialog', { name: 'Logros' }).getByRole('button', { name: /gafas/i }).click();
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.shades).toBe(true);
  expect(saved.progress.maxCombo).toBeGreaterThanOrEqual(1);
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
    await expect(pm).toContainText('peor momento');
    await expect(pm.locator('[data-pm="peor"]')).toHaveText(/^[1-7] en cola a los \d+ s$/);
    // el post-mortem tapa el tablero: lo de detrás es inert y el tabulador no llega
    const body = page.locator('.game-board .gb-body');
    expect(await body.evaluate((e) => (e as HTMLElement).inert)).toBe(true);
    await expect(body).toHaveAttribute('aria-hidden', 'true');
    expect(await pm.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(16, 16, 18)');
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => !!document.activeElement?.closest('.gb-body'))).toBe(false);
      }
    }
    await pm.getByRole('button', { name: 'Otra partida' }).focus();
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

test.describe('logros en panel', () => {
  test('progreso visible sin haber jugado', async ({ page }) => {
    await page.goto('/');
    const shelf = await openLogros(page);
    await expect(shelf).toContainText('racha máx.: 0/10');
    await expect(shelf).toContainText('webhooks: 0/5');
    await expect(shelf).toContainText('puntos: 0/500');
    await expect(shelf.locator('.shelf').getByRole('button')).toHaveCount(0); // nada desbloqueado, nada que activar
  });

  test('accesorios activables con save preinyectado', async ({ page }) => {
    await recordBus(page);
    await withSave(page, { best: 120, unlocked: ['hola', 'racha'], progress: { maxCombo: 10, maxHooks: 2, maxScore: 120 } });
    await page.goto('/');
    const shelf = await openLogros(page);
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
    const shelf = await openLogros(page);
    await shelf.getByRole('button', { name: /azul/i }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim())).toBe('#2F6BFF');
    await shelf.getByRole('button', { name: /rojo/i }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim().toUpperCase())).toBe('#E4251B');
  });

  test('nota secreta visible al conseguir todos los logros', async ({ page }) => {
    await withSave(page, { best: 600, unlocked: ['hola', 'racha', 'hooks', 'cero', 'mil', 'secreto'], shades: true, chain: true });
    await page.goto('/');
    await expect(page.locator('.arcade .chip')).toHaveText('LOGROS 6/6');
    const secret = (await openLogros(page)).locator('[data-ach="secreto"]');
    await expect(secret).toContainText('Lo has visto todo');
    await expect(secret.locator('.nota')).toBeVisible();
    await expect(secret.locator('.nota')).toContainText('Nunca te rindas');
    await expect(page.locator('body')).not.toContainText('PLACEHOLDER');
  });

  test('secreto bloqueado no revela su nombre', async ({ page }) => {
    await page.goto('/');
    const secret = (await openLogros(page)).locator('[data-ach="secreto"]');
    await expect(secret).toContainText('???');
    await expect(secret).not.toContainText('Lo has visto todo');
  });
});

test.describe('máquina arcade', () => {
  test('la vitrina no está en la página y la tarjeta muestra título, START y logros', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.arcade');
    await expect(card).toBeVisible();
    await expect(card).toContainText('PUB/SUB RUSH');
    await expect(card).toContainText('Haz mi trabajo durante 45 segundos. Si aguantas, desbloqueas cosas.');
    await expect(card).toContainText('PULSA START');
    for (const r of ['POST /pagos', 'POST /reservas', 'POST /avisos']) await expect(card).toContainText(r);
    await expect(card.locator('.chip')).toHaveText('LOGROS 0/6');
    // la vitrina ya no vive en el flujo de la página
    await expect(page.locator('.vitrina')).toHaveCount(0);
    await expect(page.locator('[data-ach]')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // la tarjeta es el activador del juego (id de siempre)
    await expect(page.locator('#play-game')).toBeVisible();
    expect(await page.locator('#play-game').evaluate((e) => !!e.closest('.arcade'))).toBe(true);
  });

  test('la pegatina LOGROS tiene un área pulsable de al menos 44 px de alto', async ({ page }) => {
    await page.goto('/');
    const chip = page.locator('.arcade .chip');
    await expect(chip).toBeVisible();
    const hit = await chip.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const c = getComputedStyle(e, '::before');
      return { h: r.height, w: r.width, before: parseFloat(c.height), top: parseFloat(c.top), bottom: parseFloat(c.bottom) };
    });
    expect(Math.max(hit.h, hit.before)).toBeGreaterThanOrEqual(44);
    expect(hit.w).toBeLessThan(120); // el aspecto no cambia: sigue siendo una pegatina pequeña
    // Un clic 6 px por debajo del borde visible también la activa.
    const b = (await chip.boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height + 6);
    await expect(page.getByRole('dialog', { name: 'Logros' })).toBeVisible();
  });

  test('#play-game tiene un nombre accesible corto', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'PUB/SUB RUSH: jugar (45 s)' })).toHaveAttribute('id', 'play-game');
  });

  test('el contador refleja los logros desbloqueados', async ({ page }) => {
    await withSave(page, { best: 50, unlocked: ['hola', 'racha'] });
    await page.goto('/');
    await expect(page.locator('.arcade .chip')).toHaveText('LOGROS 2/6');
  });

  test('primer acierto: LOGROS pasa de 0/6 a 1/6 al volver', async ({ page }) => {
    await openGame(page);
    await expect(page.locator('.game-hint')).toContainText(/pulsa [123]/);
    const key = (await page.locator('.game-hint').textContent())!.match(/pulsa ([123])/)![1];
    await page.keyboard.press(key);
    await expect(score(page)).toHaveText('10');
    await page.keyboard.press('Escape');
    await expect(page.locator('.arcade .chip')).toHaveText('LOGROS 1/6');
  });

  test('Enter en la tarjeta abre el tablero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#play-game')).toBeVisible();
    await page.locator('#play-game').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.game-board')).toBeVisible();
  });

  test('clic en el cuerpo de la tarjeta (no en el título) abre el tablero', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.arcade');
    await expect(card).toBeVisible();
    const box = (await card.boundingBox())!;
    await page.mouse.click(box.x + 6, box.y + box.height - 6); // esquina inferior izquierda
    await expect(page.locator('.game-board')).toBeVisible();
  });

  test('la pegatina abre el panel sin abrir el juego; Escape lo cierra y devuelve el foco', async ({ page }) => {
    await recordBus(page);
    await page.goto('/');
    const chip = page.locator('.arcade .chip');
    const dlg = await openLogros(page);
    await expect(page.locator('.game-board')).toHaveCount(0);
    expect(await events(page, 'game:open')).toHaveLength(0);
    await expect(dlg).toHaveAttribute('aria-modal', 'true');
    await expect(dlg.getByRole('heading', { name: 'Logros' })).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
    // Tab y Shift+Tab no salen del panel: N+1 pulsaciones dan la vuelta completa
    const n = await dlg.locator('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    expect(n).toBeGreaterThan(0);
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < n + 1; i++) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
      }
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(chip).toBeFocused();
    await expect(page.locator('.game-board')).toHaveCount(0);
    // el botón de cerrar también devuelve el foco
    await chip.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(chip).toBeFocused();
  });

  test('el panel no se abre dos veces', async ({ page }) => {
    await page.goto('/');
    await openLogros(page);
    await page.locator('.arcade .chip').evaluate((b) => { (b as HTMLElement).click(); (b as HTMLElement).click(); });
    await expect(page.locator('dialog, [role="dialog"]')).toHaveCount(1);
  });

  test('en el post-mortem, "Ver logros" abre el panel y Escape solo cierra el panel', async ({ page }) => {
    await veteran(page);
    await openGame(page);
    await forceEnd(page);
    const ver = page.locator('.postmortem').getByRole('button', { name: 'Ver logros' });
    await ver.click();
    const dlg = page.getByRole('dialog', { name: 'Logros' });
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('[data-ach="hola"]')).toHaveClass(/on/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.postmortem')).toBeVisible();
    await expect(ver).toBeFocused();
  });

  test('con reduced motion la pantalla no desfila y START no parpadea', async ({ page }) => {
    await page.goto('/');
    const anim = () => page.locator('.arcade .screen .m, .arcade .start').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    await expect(page.locator('.arcade')).toBeVisible();
    const moving = await anim();
    expect(moving).toHaveLength(4);
    expect(moving.every((n) => n !== 'none')).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await anim()).every((n) => n === 'none')).toBe(true);
  });

  test('sin JS la tarjeta no aparece', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('#hero-titulo')).toBeVisible();
    await expect(page.locator('.arcade')).toBeHidden();
    await expect(page.getByText('PUB/SUB RUSH')).toBeHidden();
    await ctx.close();
  });

  test('axe sin violaciones serias con el panel abierto', async ({ page }) => {
    await withSave(page, { best: 600, unlocked: ['hola', 'racha', 'cero'], shades: true });
    await page.goto('/');
    await openLogros(page);
    const r = await new AxeBuilder({ page }).analyze();
    const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});

for (const width of [320, 375]) {
  test.describe(`tarjeta arcade a ${width} px`, () => {
    test.use({ viewport: { width, height: 740 }, isMobile: true, hasTouch: true });
    test('visible, sin scroll horizontal, y el panel cabe', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.arcade')).toBeVisible();
      const o = await overflow(page);
      expect(o.scrollWidth, JSON.stringify(o)).toBeLessThanOrEqual(width);
      await page.locator('.arcade .chip').tap();
      const dlg = page.getByRole('dialog', { name: 'Logros' });
      await expect(dlg).toBeVisible();
      const box = (await dlg.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      const o2 = await overflow(page);
      expect(o2.scrollWidth, JSON.stringify(o2)).toBeLessThanOrEqual(width);
    });
  });
}
