# Carlos Vidal · Portfolio

Sitio personal de Carlos Vidal, Backend Developer · Go. https://www.cvidal.dev

## Stack

- **Astro 7** con salida estática: todo el texto está en el HTML servido y se lee sin JS.
- **Islas de React 18** solo donde aportan: el avatar animado (canvas, se monta en idle en escritorio, al abrir el juego, o en móvil cuando las cosméticas guardadas lo necesitan: gafas, cadena o tema distinto del rojo, vía `needsCompositor`) y el juego "Pub/Sub Rush" con su vitrina (`client:idle`).
- **CSS propio** con variables (`src/styles/tokens.css`); los temas rojo/azul/verde re-escriben el acento con `applyTheme` (`src/lib/theme.ts`).
- Fuentes autoalojadas con fontsource (Bricolage Grotesque y JetBrains Mono), precargadas en `src/layouts/Base.astro`.
- Movimiento sin librerías: apariciones con IntersectionObserver (`src/scripts/reveal.ts`, clase `.reveal`) y View Transitions nativas entre documentos (`@view-transition` en `src/styles/global.css`). Con `prefers-reduced-motion: reduce` no hay ni apariciones ni transiciones, y sin JS no se oculta nada.
- Textos en `src/i18n/es.ts` y `src/content/` (colección `proyectos`).
- Tests: Vitest (unidad) y Playwright + axe (e2e sobre `astro preview`). Lighthouse CI para rendimiento y accesibilidad.

## Comandos

```
npm install
npm run dev          # desarrollo
npm run build        # build estático en dist/
npm run preview      # servir el build
npm run check        # astro check + tsc --noEmit (TypeScript 6: astro check aún no soporta TS 7)
npm test             # Vitest
npm run test:e2e     # Playwright (requiere build previo; arranca astro preview en :4321)
npm run lhci         # Lighthouse CI, móvil y escritorio (requiere build previo)
```

Antes de los e2e o de Lighthouse, comprueba que no queda un `astro preview` viejo escuchando en el puerto 4321 (Playwright lo reutilizaría fuera de CI) o en el 4329 (Lighthouse).

## Lighthouse

`lighthouserc.json` audita `/`, `/proyectos/acelerik-booking` y `/proyectos/bot-pedidos-whatsapp`, 3 ejecuciones por URL, y exige la **mediana** de `performance >= 0.9` y `accessibility >= 0.9`. Arranca su propio `astro preview` en el puerto 4329.

```
npm run build
npm run lhci            # = npm run lhci:mobile && npm run lhci:desktop
npm run lhci:mobile     # preset por defecto (móvil, throttling simulado)
npm run lhci:desktop    # --collect.settings.preset=desktop
```

Los informes HTML/JSON quedan en `.lighthouseci/mobile/` y `.lighthouseci/desktop/` (ignorados por git). Usa el Chrome instalado; para usar otro (por ejemplo el Chromium de Playwright), define `CHROME_PATH` antes de lanzarlo:

```
CHROME_PATH="$LOCALAPPDATA/ms-playwright/chromium-1248/chrome-win64/chrome.exe" npm run lhci
```

## Recursos generados

- **Capas del avatar** (`public/avatar/`): `npm run avatar:bake`. Lee `assets-src/avatar-ref.webp` y escribe `base.webp`, párpados, cejas, labios, `layers.json`, la imagen estática `static.webp` y sus variantes `static-480.webp` y `static-800.webp` (srcset del hero). Los resultados se versionan; vuelve a ejecutarlo solo si cambia la imagen de referencia o la lógica de `scripts/avatar/`.
- **Imagen og** (`public/og.png`, 1200x630, PNG de paleta < 300 KB para que WhatsApp la admita): `node scripts/make-og.mjs`. Parte de `public/avatar/static.webp`, así que ejecútalo después de `avatar:bake` si este cambia.
- **Favicons** (`assets-src/face.svg` es la fuente, fondo transparente; `face-nav.webp`/`@2x`/`@3x` (menú, cara sola), `favicon.png` de 192 px, también apple-touch-icon, y `favicon.ico` de 16/32/48): `node scripts/make-favicon.mjs`.

## Antes de publicar

- [ ] Añadir `public/CarlosVidal_Backend_CV.pdf` (el botón de CV apunta a `/CarlosVidal_Backend_CV.pdf`).
- [ ] Rellenar los placeholders, que en producción se ocultan y solo se ven en `npm run dev`: "Sobre mí" (`sobre.texto`), los dos "Qué aprendí", "El problema" de Acelerik y la nota secreta del juego (`juego.notaSecreta`). "Sobre mí" no se publica hasta que tenga texto real.
- [ ] Comprobar cómo se despliega: el repositorio no incluye configuración de Vercel, Netlify ni CI. Confirma si `main` se despliega solo antes de fusionar `rediseno-portfolio`.
- [ ] `npm run check`, `npm test` y `npm run build && npm run test:e2e` en verde (el e2e falla si queda algún `[PLACEHOLDER` en `dist/`).

Reglas del proyecto en `CLAUDE.md`.
