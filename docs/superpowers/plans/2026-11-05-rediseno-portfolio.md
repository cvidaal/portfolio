# Rediseño del portfolio — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el portfolio actual (Vite + shadcn) por la web nueva aprobada: hero con el avatar de Carlos en tinta roja que hace gestos, juego opcional Pub/Sub Rush con logros, tres proyectos y dos casos de estudio, todo legible sin JS y con Lighthouse ≥ 90.

**Architecture:** Astro con salida estática; todo el contenido se renderiza a HTML en build. Dos islas de React cargadas en diferido: el avatar (compone capas de imagen precocinadas en build) y el juego (motor puro en TypeScript + UI). Se comunican por un bus de eventos en `window`, así ninguna depende de la otra.

**Tech Stack:** Astro (última estable al empezar, fijada en `package.json`), React 18 para islas, TypeScript estricto, CSS propio con variables (sin Tailwind), Vitest, Playwright + `@axe-core/playwright`, `@lhci/cli`, `sharp` (script de capas del avatar), `@fontsource-variable/bricolage-grotesque` y `@fontsource/jetbrains-mono`.

**Spec:** `docs/superpowers/specs/2026-11-04-rediseno-portfolio-design.md` (léelo entero antes de la Task 1). Prototipos visuales de referencia en `docs/superpowers/prototypes/` (desechables; copiar estilo y comportamiento, no el código tal cual).

## Global Constraints

- Colores: fondo `#101012`, papel `#F1EDE6`, acento `#E4251B`, tinta `#D8261C`, tinta clara `#F0A193`, línea `#2E2E33`, tarjeta `#17171A`, texto apagado `#9A968F`.
- Tipografías: Bricolage Grotesque (display, 800) y JetBrains Mono (datos), autoalojadas. Sin Google Fonts en producción.
- Todo el texto visible en el HTML servido (sin JS). Las islas solo añaden interacción.
- `prefers-reduced-motion: reduce` desactiva gestos automáticos, seguimiento suave, animaciones de scroll y transiciones.
- Móvil 320–390 px sin scroll horizontal.
- Lighthouse ≥ 90 en Performance y Accessibility (móvil y escritorio) en `/` y en cada caso de estudio.
- Idioma `es`; todos los textos fuera de los componentes, en `src/content/` y `src/i18n/es.ts`.
- CV: `/CarlosVidal_Backend_CV.pdf`. Ninguna referencia a `CarlosVidal_FullStack_CV.pdf`, "Full Stack" ni `twitter:site`.
- Ningún `[PLACEHOLDER]` visible en el build de producción (ver Task 2).
- Sin emojis en la interfaz. No mencionar Claude Code ni IA como herramienta de desarrollo en los textos. No inventar datos: cada afirmación de los casos de estudio debe poder comprobarse en el repo citado.
- Sin analítica, cookies, sonido ni servicios de terceros en tiempo de ejecución.

## Review Focus

1. `localStorage` no disponible o que lanza excepción (Safari privado): el juego se puede jugar, los logros funcionan durante la sesión y nada se rompe → test en Task 9.
2. Pestaña oculta a mitad de partida (rAF parado, `dt` enorme al volver): el tiempo de turno y la caducidad no deben "saltar" y vaciar la cola de golpe → test en Task 8.
3. Teclas `1/2/3` pulsadas fuera del juego, en un campo de texto o con el turno terminado: no hacen nada → test en Task 10.
4. JS desactivado o isla que falla al cargar: el hero muestra el avatar estático y todo el texto; el botón del juego no aparece si no puede funcionar → test en Task 3.
5. Redimensionar o girar el móvil con el avatar o el juego abiertos: los ojos miran bien (se recalcula la posición del avatar en cada evento) y el tablero no desborda → test en Task 6 y Task 10.

---

### Task 1: Base del proyecto en Astro

Reemplaza la plantilla Vite por Astro en la rama `rediseno-portfolio`, con layout base, tokens, fuentes, metadatos y herramientas de test.

**Files:**
- Delete: `src/` (todo lo anterior salvo `src/assets/profile.jpg` y `src/assets/benditaburger_app.png`, que se mueven a `src/assets/legacy/`), `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `bun.lockb`, `tsconfig.app.json`, `tsconfig.node.json`, `public/CarlosVidal_FullStack_CV.pdf`, `public/placeholder.svg`
- Create: `astro.config.mjs`, `tsconfig.json`, `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro` (mínima), `src/pages/404.astro`, `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/base.spec.ts`, `CLAUDE.md`
- Modify: `package.json` (dependencias y scripts), `README.md`, `.gitignore`

**Interfaces:**
- Produces: `Base.astro` con props `{ title: string; description: string; path: string; ogImage?: string }`. Scripts npm: `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright contra `astro preview`), `lhci`.

- [ ] **Step 1:** Crear el proyecto Astro en la carpeta (plantilla mínima, TypeScript estricto), añadir `@astrojs/react`, React 18, las fuentes de Global Constraints, Vitest, Playwright, `@axe-core/playwright`. Quitar todas las dependencias de la plantilla anterior (radix, recharts, react-query, shadcn, tailwind…).
- [ ] **Step 2: Test que falla** `tests/e2e/base.spec.ts`:
```ts
test('home: idioma, título y metadatos', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle('Carlos Vidal · Backend Developer · Go');
  await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Backend Developer.*Go/);
});
test('404 propia', async ({ page }) => {
  const r = await page.goto('/no-existe');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/');
});
```
- [ ] **Step 3:** Ejecutar `npm run build && npm run test:e2e -- base` → FAIL.
- [ ] **Step 4:** Implementar `Base.astro`: `<html lang="es">`, título, descripción, canónica `https://www.cvidal.dev{path}`, Open Graph y `twitter:card=summary_large_image` (sin `twitter:site`), favicon, fuentes importadas desde fontsource, `tokens.css` con las variables de Global Constraints, `body { background: var(--bg) }`. `og:image` → `/og.png` (Task 3 lo genera). 404 con el estilo de la web y enlace "Volver al inicio".
- [ ] **Step 5:** Escribir `CLAUDE.md` con las reglas de la sección 16 de la spec (texto literal) más: comandos del proyecto y "los textos van en `src/content` / `src/i18n`".
- [ ] **Step 6:** `npm run build && npm run test:e2e -- base` → PASS.
- [ ] **Step 7: Commit** `chore: migrar a Astro con layout base, tokens y tests`

---

### Task 2: Textos, contenido y política de placeholders

**Files:**
- Create: `src/i18n/es.ts`, `src/i18n/index.ts`, `src/lib/placeholder.ts`, `src/components/Ph.astro`, `src/content.config.ts`, `src/content/proyectos/es/acelerik-booking.mdx`, `src/content/proyectos/es/bot-pedidos-whatsapp.mdx`, `src/content/proyectos/es/bendita-burger.md`, `tests/unit/placeholder.test.ts`, `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `t(key: keyof typeof es): string` y `locale = 'es'` en `src/i18n/index.ts`.
  - `isPlaceholder(text: string): boolean` (true si contiene `[PLACEHOLDER`) y `showPlaceholders: boolean` (= `import.meta.env.DEV`) en `src/lib/placeholder.ts`.
  - `<Ph text={string} />`: en dev pinta el texto marcado en rojo monoespaciado; en producción no pinta nada. Las secciones cuyo contenido principal sea placeholder se ocultan enteras en producción con `isPlaceholder`.
  - Colección `proyectos` con esquema: `{ slug, orden: number, titulo, etiqueta, tipo: 'producto' | 'cliente' | 'practicas', titular, hechos: string[], stack: string[], imagen?: ImageMetadata, enlaces: {label, href}[], caso: boolean, estado?: string }`.

- [ ] **Step 1: Tests que fallan**
```ts
// tests/unit/placeholder.test.ts
expect(isPlaceholder('[PLACEHOLDER: texto de Carlos]')).toBe(true);
expect(isPlaceholder('Go, PostgreSQL')).toBe(false);
// tests/unit/i18n.test.ts
expect(t('hero.rol')).toBe('Backend Developer · Go');
expect(t('hero.estado')).toBe('Abierto a oportunidades · Backend / Go');
expect(Object.values(es).join(' ')).not.toMatch(/Full ?Stack/i);
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `es.ts` con todos los textos de las secciones 6, 8, 11, 12 y 13 de la spec, literales (experiencia de Top Doctors y Ulandu, stack mostrado, email/LinkedIn/GitHub, botones, texto del botón del juego "▶ ¿Te atreves a hacer mi trabajo?"). Sobre mí y nota secreta como `[PLACEHOLDER: …]`.
- [ ] **Step 4:** Rellenar los tres archivos de proyecto con los datos de la sección 9 de la spec (titulares, hechos, stack, enlaces, etiquetas). `bendita-burger.md` con `caso: false`.
- [ ] **Step 5:** `npm test` → PASS. **Commit** `feat: textos en es y colección de proyectos`

---

### Task 3: Home estática (todas las secciones sin interacción)

**Files:**
- Create: `src/components/Nav.astro`, `Poster.astro`, `Hero.astro`, `Experience.astro`, `Stack.astro`, `About.astro`, `Contact.astro`, `Footer.astro`, `src/scripts/copy-email.ts`, `public/og.png`, `scripts/make-og.mjs`, `tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `t()`, `<Ph>`, `Base.astro`; `public/avatar/static.webp` (Task 5; hasta entonces usar `docs/superpowers/prototypes/avatar-ref.webp` copiado a `public/avatar/static.webp` como provisional).
- Produces: `<Poster num="01" titulo="Experiencia" meta?={string} />`. Hero con huecos para islas: `<div id="avatar-slot">` (contiene la `<img>` estática) y `<button id="play-game" hidden>` (la isla del juego lo muestra al hidratar). IDs `cta-proyectos`, `cta-cv` en los botones del hero.

- [ ] **Step 1: Tests que fallan** (`home.spec.ts`), uno ejecutado con `javaScriptEnabled: false`:
```ts
test('sin JS se lee todo', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  for (const txt of ['Carlos','Vidal','Backend Developer · Go','Top Doctors','Integration Developer','Acelerik Booking','POST /contacto','carlosvidal.developer@gmail.com'])
    await expect(page.getByText(txt, { exact: false }).first()).toBeVisible();
  await expect(page.locator('#avatar-slot img')).toBeVisible();
  await expect(page.locator('#play-game')).toBeHidden();               // Review Focus 4
});
test('CV y enlaces', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#cta-cv')).toHaveAttribute('href', '/CarlosVidal_Backend_CV.pdf');
  expect(await page.content()).not.toMatch(/FullStack_CV|Full Stack/);
});
test('sin scroll horizontal a 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
test('copiar email', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']); await page.goto('/');
  await page.getByRole('button', { name: /copiar email/i }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('carlosvidal.developer@gmail.com');
});
test('a11y sin violaciones serias', async ({ page }) => { /* AxeBuilder: 0 violaciones critical/serious */ });
```
- [ ] **Step 2:** `npm run build && npm run test:e2e -- home` → FAIL.
- [ ] **Step 3:** Implementar los componentes con el aspecto de los prototipos (`hero-avatar-y-juego.html` para el hero; `proyectos-y-caso-de-estudio.html` para el póster). Orden: Hero → Poster 01 Experiencia → Experience → Poster 02 Proyectos → (hueco para Task 4) → Stack → Poster 03 Sobre mí → About → Poster 04 Contacto → Contact → Footer. Contacto: bloque terminal con la línea `POST /contacto` y respuesta JSON con enlaces clicables. Sin formulario.
- [ ] **Step 4:** `scripts/make-og.mjs` (sharp): genera `public/og.png` 1200×630 con fondo `#101012`, avatar en tinta roja a la derecha y "Carlos Vidal · Backend Developer · Go". Ejecutarlo una vez y commitear el PNG.
- [ ] **Step 5:** Tests → PASS. **Commit** `feat: home estática con todas las secciones`

---

### Task 4: Proyectos y casos de estudio

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/Projects.astro`, `src/components/RisoImage.astro`, `src/layouts/CaseStudy.astro`, `src/components/case/Toc.astro`, `src/components/case/Decision.astro`, `src/components/case/ArchDiagram.astro`, `src/scripts/toc-active.ts`, `src/pages/proyectos/[slug].astro`, `src/assets/proyectos/` (imágenes), `tests/e2e/proyectos.spec.ts`
- Modify: `src/pages/index.astro`, los dos `.mdx` de proyectos (cuerpo del caso)

**Interfaces:**
- Consumes: colección `proyectos` (Task 2), `Poster`, `<Ph>`.
- Produces: `<RisoImage src alt fit? position? />` (duotono rojo en reposo, color real en hover del contenedor `.card`); rutas `/proyectos/acelerik-booking` y `/proyectos/bot-pedidos-whatsapp` (solo proyectos con `caso: true`).

- [ ] **Step 1: Tests que fallan**
```ts
test('tres tarjetas en orden', async ({ page }) => {
  await page.goto('/');
  const titles = page.locator('#proyectos article h3');
  await expect(titles).toHaveText(['Acelerik Booking','Bot de pedidos por WhatsApp','App Bendita Burger']);
  await expect(page.locator('#proyectos')).not.toContainText(/Taller Manager|en producción/);
});
test('caso Acelerik: índice, código real y navegación', async ({ page }) => {
  await page.goto('/proyectos/acelerik-booking');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Acelerik');
  await expect(page.locator('nav.toc a')).toHaveCount(8);
  await expect(page.locator('pre')).toContainText('pg_advisory_xact_lock');
  await expect(page.locator('body')).not.toContainText(/\bCI\b(?! con GitHub Actions)/); // la CI solo como "siguiente paso"
  await expect(page.getByRole('link', { name: /Bot de pedidos/ })).toHaveAttribute('href', '/proyectos/bot-pedidos-whatsapp');
});
test('Bendita no tiene caso de estudio', async ({ page }) => {
  expect((await page.goto('/proyectos/bendita-burger'))?.status()).toBe(404);
});
```
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Copiar imágenes: `docs/superpowers/prototypes/ab-panel.png`, `ab-reserva.png`, `pani-logo.png`, y `src/assets/legacy/benditaburger_app.png`. Las capturas de la App Store de Bendita **solo** si Carlos lo autoriza en el momento (descargar archivos pide permiso); si no, usar `benditaburger_app.png`.
- [ ] **Step 4:** Implementar tarjetas (destacada a ancho completo para `orden: 1`; las otras dos a media anchura en ≥ 900 px, apiladas en móvil) y la plantilla de caso según el prototipo. `toc-active.ts`: IntersectionObserver que marca el enlace de la sección visible.
- [ ] **Step 5:** Redactar el cuerpo de los dos casos con la sección 10 de la spec. El fragmento de código de Acelerik se copia de `C:\Users\Carlo\Desktop\Proyectos\acelerik-demo-cumple\backend\internal\booking\repository.go` (función `Create`). Para el bot, **leer** `C:\Users\Carlo\Desktop\Proyectos\Panaderia\ia_pani\src` y recontar los tests con `uv run pytest --collect-only -q | tail -1` antes de escribir; afirmar solo lo implementado. "El problema" de Acelerik y "Qué aprendí" como `[PLACEHOLDER]` / "confirmar con Carlos" vía `<Ph>`.
- [ ] **Step 6:** Tests → PASS. **Commit** `feat: proyectos y casos de estudio`

---

### Task 5: Capas del avatar precocinadas

Porta a Node la lógica de recoloreado y separación de capas del prototipo (`hero-avatar-y-juego.html`, script del avatar) para ejecutarla una vez en build, no en el navegador.

**Files:**
- Create: `scripts/avatar/bake.mjs`, `scripts/avatar/pixels.mjs`, `assets-src/avatar-ref.webp` (copia del prototipo), `public/avatar/` (salida commiteada), `tests/unit/avatar-pixels.test.ts`

**Interfaces:**
- Produces: `public/avatar/layers.json`:
```ts
type Layers = {
  size: 1254;
  base: string;                         // base.webp: sin iris, cejas ni labios
  static: string;                       // static.webp: base + iris centrados + cejas + labios (lo que ve quien no tiene JS)
  eyes: { ix:number; iy:number; ex:number; ey:number; rx:number; ry:number; lid: Sprite }[]; // 2
  brows: { cx:number; cy:number; sprite: Sprite }[];               // 2
  lips: { upper: Sprite; lower: Sprite; mcx:number; mhalf:number; upBot: Record<number,number> };
};
type Sprite = { src: string; x: number; y: number; w: number; h: number }; // recortado a su caja
```
  Valores de ojos tomados del prototipo: `{ix:501,iy:517.5,ex:494,ey:518,rx:47,ry:12.5}` y `{ix:692.5,iy:512.5,ex:690,ey:514,rx:48,ry:12.5}`; centro de boca `mcx=598`, `mhalf=92`; centros de cejas `(485,470)` y `(697,465)`.
- `pixels.mjs` exporta `purpleness(r,g,b): number`, `luminance(r,g,b): number`, `ramp(stops, l): [r,g,b]`, `floodBackground(L, P, w, h): Uint8Array`, `largestComponent(P, box, threshold): number[]`.

- [ ] **Step 1: Tests que fallan** con los valores medidos en la sesión de diseño:
```ts
expect(purpleness(59,13,165)).toBeGreaterThan(0.9);   // línea de la ilustración
expect(purpleness(177,223,237)).toBe(0);              // relleno del pelo
expect(luminance(242,248,253)).toBeGreaterThan(0.95); // fondo
expect(ramp([[0,[0,0,0]],[1,[255,255,255]]], 0.5)).toEqual([127.5,127.5,127.5]);
// floodBackground sobre una imagen 5x5 con un marco de "línea": el centro no es fondo
```
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementar `pixels.mjs` y `bake.mjs` (sharp `raw()`), con las mismas rampas FIG/BGS y umbrales del prototipo, máscara de fondo por inundación, cejas = componente mayor con P>0.5 en las cajas `(414,430)-(600,500)` y `(600,425)-(800,500)` dilatado 3 px, labios = componentes con P>0.55 en `(495,685)-(710,750)` (superior/inferior por centro vertical). Salida WebP calidad 85.
- [ ] **Step 4:** `node scripts/avatar/bake.mjs` → genera `public/avatar/*` ; `npm test` → PASS. Comprobar a ojo `static.webp` contra el prototipo.
- [ ] **Step 5: Commit** `feat: capas del avatar precocinadas en build`

---

### Task 6: Isla del avatar (ojos, parpadeo, gestos, guiño)

**Files:**
- Create: `src/islands/avatar/Avatar.tsx`, `compositor.ts`, `poses.ts`, `mouth.ts`, `src/lib/bus.ts`, `tests/unit/poses.test.ts`, `tests/unit/mouth.test.ts`, `tests/e2e/avatar.spec.ts`
- Modify: `src/components/Hero.astro` (montar `<Avatar client:idle />` dentro de `#avatar-slot`, solo con `min-width: 768px` y `(hover: hover)`; en móvil se monta en diferido solo si el juego se abre o hay accesorios/tema guardados)

**Interfaces:**
- Consumes: `layers.json` (Task 5).
- Produces (`src/lib/bus.ts`):
```ts
type PoseName = 'neutral'|'smile'|'grin'|'smirkL'|'smirkR'|'surprised'|'think'|'winkL'|'winkR';
emit('avatar:pose', { name: PoseName; ms: number }); emit('avatar:wink');
emit('avatar:look', { x: number; y: number } | null);   // punto de pantalla; null = ratón
emit('avatar:cosmetics', { shades: boolean; chain: boolean; theme: 'rojo'|'azul'|'verde' });
on(type, handler): () => void;  // devuelve unsubscribe
```
- `poses.ts`: `POSES: Record<PoseName, { b: [{y:number;r:number},{y:number;r:number}]; m: {s:number;o:number;a:number;w:number} }>` con los valores finales del prototipo v7 (sorpresa = `m:{s:5,o:0,a:0,w:1.02}`; sin boca en "o"), `step(cur, target, k): Pose` (interpolación exponencial), `lookOffset(dx, dy): {x,y}` (normalizado, saturado a 260 px).
- `mouth.ts`: `export const MCX = 598, MHALF = 92, OPEN_HALF = 72`; `dyUp(x, m)`, `openAt(x, m)`, `dyLo(x, m)`, `mapX(x, m)` — mismas fórmulas que el prototipo (en producción `MCX`/`MHALF` deben coincidir con `layers.json`).

- [ ] **Step 1: Tests unitarios que fallan**
```ts
expect(lookOffset(0,0)).toEqual({x:0,y:0});
expect(lookOffset(1000,0).x).toBeCloseTo(1);           // saturado
expect(dyUp(MCX, POSES.smile.m)).toBe(0);              // centro no se mueve
expect(dyUp(MCX+92, POSES.smile.m)).toBeLessThan(0);   // comisura sube
expect(dyUp(MCX-92, POSES.smirkR.m)).toBe(0);          // mueca derecha: lado izquierdo quieto
expect(openAt(MCX, POSES.grin.m)).toBe(POSES.grin.m.o);
expect(POSES.surprised.m.o).toBe(0);                   // la "o" descartada
```
- [ ] **Step 2:** FAIL → implementar `poses.ts`, `mouth.ts` → PASS.
- [ ] **Step 3: Tests e2e que fallan** (`avatar.spec.ts`, escritorio):
```ts
test('guiño al pulsar Descargar CV sin bloquear la descarga', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('#avatar-slot canvas');
  const winked = page.evaluate(() => new Promise(r => addEventListener('avatar:wink', () => r(true), { once: true })));
  await page.route('**/CarlosVidal_Backend_CV.pdf', r => r.fulfill({ status: 200, contentType: 'application/pdf', body: '' }));
  await page.locator('#cta-cv').click();
  expect(await winked).toBe(true);
});
test('reduced motion: sin gestos automáticos', async ({ browser }) => { /* emulateMedia reduce; espiar avatar:pose 8 s → 0 emisiones automáticas */ });
test('redimensionar recalcula la mirada', async ({ page }) => { /* resize a 1000px y mover ratón: el offset del iris apunta hacia el ratón (leer data-look del canvas) */ }); // Review Focus 5
```
- [ ] **Step 4:** Implementar `compositor.ts` (`createCompositor(canvas, layers): { draw(state) }`, dibuja base → iris recortados → párpados → boca por columnas de 2 px → cejas transformadas → accesorios) y `Avatar.tsx` (bucle rAF que solo redibuja si cambia el estado; parpadeo cada 2,8–6,4 s; gestos solos cada 3,2–6 s entre `smile, smirkL, smirkR, think, grin`; hover `#cta-proyectos` → `grin`; velocidad de ratón > 3,2 px/ms → `surprised`; clic en `#cta-cv` o en el avatar → guiño de 1 s; escucha el bus). Expone `data-look` en el canvas para el test. La `<img>` estática se mantiene hasta que el canvas pinta su primer frame.
- [ ] **Step 5:** Tests → PASS. **Commit** `feat: avatar interactivo con gestos y guiño`

---

### Task 7: Accesorios y temas del avatar

**Files:**
- Create: `src/islands/avatar/cosmetics.ts`, `tests/e2e/cosmetics.spec.ts`
- Modify: `compositor.ts`, `Avatar.tsx`, `src/styles/tokens.css`

**Interfaces:**
- Consumes: evento `avatar:cosmetics`.
- Produces: `drawShades(ctx, layers)`, `drawChains(ctx)` (geometría del prototipo v3 del juego: lentes, puente, patillas; cadena fina de 34 eslabones con chapa `200` y gruesa de 24); `applyTheme(theme)` que cambia `--acc` en `:root` (`rojo #E4251B`, `azul #2F6BFF`, `verde #3DDC84`) y el filtro CSS del avatar (`''`, `hue-rotate(215deg) saturate(1.1)`, `hue-rotate(125deg) saturate(.9)`).

- [ ] **Step 1: Test que falla:** emitir `avatar:cosmetics {theme:'azul'}` → `getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() === '#2F6BFF'`; con `shades:true` el canvas cambia (comparar `toDataURL()` antes/después).
- [ ] **Step 2:** FAIL → implementar → PASS. **Commit** `feat: accesorios y temas del avatar`

---

### Task 8: Motor del juego (lógica pura)

**Files:**
- Create: `src/islands/game/engine.ts`, `src/islands/game/incidents.ts`, `src/islands/game/rng.ts`, `tests/unit/engine.test.ts`

**Interfaces:**
- Produces:
```ts
type MsgType = 'pago'|'reserva'|'aviso';
type Msg = { id:number; type:MsgType; hook:boolean; ttl:number; left:number };
type Incident = { kind:'pico'|'caido'|'deploy'; until:number; service?: MsgType };
type GameState = { t:number; score:number; combo:number; maxCombo:number; dlq:number; routed:number; hooks:number;
  msgs:Msg[]; order:MsgType[]; incident:Incident|null; guided:boolean; over:boolean; events:GameEvent[] };
type GameEvent = { kind:'ok'|'bad'|'timeout'|'save'|'combo5'|'combo10'|'incident'|'end'; pts?:number; msgId?:number };
createGame(opts:{ seed:number; guided:boolean }): GameState
tick(s:GameState, dtSec:number): GameState        // dt se recorta a 0.05 s
route(s:GameState, service:MsgType, msgId?:number): GameState   // sin msgId → el más antiguo
```
  Constantes de la spec/prototipo: `ROUND=45`, `MAXDLQ=5`, `MAXQUEUE=7`, intervalo de aparición `1500-950*p` ms, caducidad `(6.5-3*p)` s (×0.7 si webhook), webhooks 13 %, puntos `(hook?20:10)*mult`, `mult=min(4,1+floor(combo/5))`, "salvada" si `left/ttl<0.2`. Incidentes cada ~15 s: `pico` (5 mensajes de golpe), `caido` (un servicio 5 s: enrutar a él → `bad`), `deploy` (baraja `order`). Modo guiado: los 3 primeros mensajes con `ttl=12` y sin incidentes.

- [ ] **Step 1: Tests que fallan** (semilla fija):
```ts
test('acierto suma y sube racha', ...)            // route al tipo correcto → score 10, combo 1, evento ok
test('error va a dead letters y corta racha', ...) // tipo incorrecto → dlq 1, combo 0
test('multiplicador x2 tras 5 aciertos y tope x4', ...)
test('webhook vale el doble', ...)
test('caducidad manda a dead letters con timeout', ...)
test('5 dead letters terminan la partida', ...)   // over=true, evento end
test('45 s terminan la partida', ...)
test('dt enorme se recorta: una pestaña oculta no vacía la cola', () => {   // Review Focus 2
  let s = createGame({ seed: 1, guided: false }); s = tick(s, 0.5);
  const before = s.msgs.length; s = tick(s, 30);
  expect(s.t).toBeCloseTo(45 - 0.5 - 0.05, 2); expect(s.dlq).toBe(0); expect(s.msgs.length).toBeGreaterThanOrEqual(before);
});
test('servicio caído rechaza mensajes', ...)
test('deploy cambia el orden de servicios', ...)
test('modo guiado: 3 primeros mensajes con ttl 12 y sin incidentes', ...)
test('nunca más de 7 mensajes en cola', ...)
```
- [ ] **Step 2:** FAIL → implementar → PASS. **Commit** `feat: motor del juego Pub/Sub Rush`

---

### Task 9: Logros y guardado

**Files:**
- Create: `src/islands/game/achievements.ts`, `src/islands/game/storage.ts`, `tests/unit/achievements.test.ts`

**Interfaces:**
- Produces:
```ts
type AchId = 'hola'|'racha'|'hooks'|'cero'|'mil'|'secreto';
type Save = { best:number; unlocked:AchId[]; theme:'rojo'|'azul'|'verde'; shades:boolean; chain:boolean; progress:{ maxCombo:number; maxHooks:number; maxScore:number } };
ACHIEVEMENTS: { id:AchId; nombre:string; desc:string; recompensa?:string; meta?:number }[]
evaluate(save:Save, game:GameState, final:boolean): { save:Save; nuevos:AchId[] }
loadSave(): Save; persist(save:Save): void   // tolerantes a fallos
```
  Reglas: `hola` primer acierto; `racha` combo ≥ 10 (activa `shades`); `hooks` ≥ 5 webhooks en un turno (activa `chain`); `cero` al terminar el turno completo con `dlq=0` y `routed ≥ 12`; `mil` score ≥ 500 en un turno; `secreto` cuando están `racha`, `hooks`, `cero` y `mil`. Nombres y textos del logro como en la tabla de la sección 7 de la spec.

- [ ] **Step 1: Tests que fallan**: una prueba por regla + `secreto` solo con los cuatro + `cero` no se concede si el turno acabó por 5 dead letters +
```ts
test('localStorage que lanza no rompe nada', () => {          // Review Focus 1
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  const s = loadSave(); expect(s.unlocked).toEqual([]); expect(() => persist(s)).not.toThrow();
});
```
- [ ] **Step 2:** FAIL → implementar (clave `localStorage`: `pubsub-rush:v1`) → PASS. **Commit** `feat: logros y guardado del juego`

---

### Task 10: Interfaz del juego y vitrina

**Files:**
- Create: `src/islands/game/Game.tsx`, `Board.tsx`, `PostMortem.tsx`, `Shelf.tsx`, `share.ts`, `src/islands/game/game.css`, `tests/e2e/game.spec.ts`
- Modify: `src/components/Hero.astro` (montar `<Game client:visible />` y la vitrina bajo el hero)

**Interfaces:**
- Consumes: `engine.ts`, `achievements.ts`, `bus.ts`, `applyTheme`.
- Produces: al hidratar, `#play-game` se muestra; abrirlo oculta el texto del hero (`aria-hidden` + `inert`) y monta el tablero. Reacciones al avatar vía `emit('avatar:pose' …)`: combo5 → `smile`, combo10 → `grin`, save → `surprised`, bad/timeout → `think`, incident → `think`, récord al final → `emit('avatar:wink')`.

- [ ] **Step 1: Tests que fallan**
```ts
test('partida guiada jugable con teclado', async ({ page }) => { /* abrir, ver pista "pulsa 1", pulsar la tecla del primer mensaje, ver "200 OK" y score 10 */ });
test('teclas 1/2/3 no hacen nada fuera del juego', async ({ page }) => {   // Review Focus 3
  await page.goto('/'); await page.keyboard.press('1');
  await expect(page.locator('.game-board')).toHaveCount(0);
  /* y con el foco en un input o con el post-mortem abierto, la puntuación no cambia */
});
test('móvil: botones de servicio grandes y tocar mensaje lo selecciona', async ({ page }) => { /* viewport 375x812; botones >= 44px de alto; sin scroll horizontal */ }); // Review Focus 5
test('post-mortem: compartir y puente al contenido', async ({ page }) => { /* forzar fin; texto "He sobrevivido a un turno de guardia de Carlos"; enlaces a #experiencia y #proyectos */ });
test('vitrina: progreso visible y accesorios activables', async ({ page }) => { /* "racha máx.: 0/10"; con save preinyectado en localStorage, toggle de gafas emite avatar:cosmetics */ });
test('nota secreta oculta en producción si es placeholder', ...)
```
- [ ] **Step 2:** FAIL → implementar con el aspecto del prototipo (HUD, cola, servicios con forma + texto, flotantes `200 OK +N`, toasts de logro abajo). Bucle rAF que llama a `tick`; se pausa con `visibilitychange`. Compartir: `navigator.share` si existe; si no, copiar texto + `https://www.cvidal.dev`. Sin sonido.
- [ ] **Step 3:** Tests → PASS. **Commit** `feat: interfaz del juego, post-mortem y vitrina`

---

### Task 11: Movimiento, transiciones y control de calidad final

**Files:**
- Create: `src/scripts/reveal.ts`, `lighthouserc.json`, `tests/e2e/motion.spec.ts`
- Modify: `src/layouts/Base.astro` (View Transitions de Astro), componentes con clase `.reveal`, `README.md`

- [ ] **Step 1: Tests que fallan**: con `reducedMotion: 'reduce'`, los elementos `.reveal` son visibles sin animación (`opacity: 1` al cargar) y no hay transición entre páginas; sin reduce, aparecen al hacer scroll.
- [ ] **Step 2:** Implementar `reveal.ts` (IntersectionObserver, aparición + desplazamiento de 16 px, una vez) y View Transitions entre home y casos. Hover de tarjetas según el prototipo. No añadir GSAP/Lenis salvo que algo no se pueda hacer con CSS (decisión del builder; justificar en el commit).
- [ ] **Step 3:** `lighthouserc.json` con `/`, `/proyectos/acelerik-booking`, `/proyectos/bot-pedidos-whatsapp`, presets móvil y escritorio, aserciones `categories:performance >= 0.9` y `categories:accessibility >= 0.9`. Ejecutar `npm run build && npm run lhci` → PASS. Si falla, corregir (normalmente imágenes, fuentes o carga de islas) antes de seguir.
- [ ] **Step 4:** `npm test && npm run test:e2e` completos → PASS. Actualizar `README.md` (stack, comandos, cómo regenerar capas del avatar y la og).
- [ ] **Step 5: Commit** `feat: animaciones de scroll, transiciones y control de calidad`

---

## Fuera de este plan

- Publicar en cvidal.dev (paso aparte cuando Carlos tenga CV y textos; ver estado en la spec).
- Ranking global con API en Go (fase 2).
- CI en el repo de Acelerik Booking (tarea de Carlos en otro repo).
