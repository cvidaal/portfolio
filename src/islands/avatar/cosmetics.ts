// Accesorios del avatar (gafas wayfarer y cadenas), portados del prototipo v3 del juego.
// Coordenadas en el espacio 1254×1254 del canvas. Se pintan encima de las cejas: cadenas y luego gafas.
import type { AccessoryHook, Layers } from './compositor';
import { INK, PAPER, TINT } from './compositor';

export { THEMES, applyTheme } from '../../lib/theme';

type Pt = [number, number];
type Quad = [Pt, Pt, Pt, Pt];

const LENS: [Quad, Quad] = [
  [[430, 490], [560, 486], [550, 552], [446, 556]],
  [[624, 484], [756, 488], [742, 552], [636, 548]],
];
const LENS_FILL = '#141416';

function lensPath(ctx: CanvasRenderingContext2D, q: Quad) {
  ctx.beginPath();
  ctx.moveTo(q[0][0], q[0][1]);
  ctx.lineTo(q[1][0], q[1][1]);
  ctx.quadraticCurveTo(q[1][0] + 2, q[2][1] - 6, q[2][0], q[2][1]);
  ctx.quadraticCurveTo((q[2][0] + q[3][0]) / 2, q[2][1] + 10, q[3][0], q[3][1]);
  ctx.quadraticCurveTo(q[0][0] - 4, q[3][1] - 14, q[0][0], q[0][1]);
  ctx.closePath();
}

/** Trama diagonal (líneas x + y = 10k, grosor 2.2) en la franja inferior del cristal; equivale al patrón de 10 px del prototipo. */
function hatchBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let c = Math.ceil((x + y) / 10) * 10; c <= x + w + y + h + 10; c += 10) {
    ctx.moveTo(x - 4, c - x + 4);
    ctx.lineTo(x + w + 4, c - x - w - 4);
  }
  ctx.stroke();
  ctx.restore();
}

/** Gafas tipo wayfarer: montura gruesa, cristal con trama y reflejos diagonales, puente y patillas. */
export function drawShades(ctx: CanvasRenderingContext2D, _layers?: Layers): void {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // patillas hacia las orejas
  ctx.beginPath();
  ctx.moveTo(432, 494); ctx.lineTo(392, 500);
  ctx.moveTo(754, 492); ctx.lineTo(808, 496);
  ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
  for (const q of LENS) {
    lensPath(ctx, q); ctx.fillStyle = LENS_FILL; ctx.fill();
    const top = Math.min(q[0][1], q[1][1]);
    ctx.save();
    lensPath(ctx, q); ctx.clip();
    hatchBand(ctx, q[0][0] - 10, top + 34, 150, 40);
    // reflejos diagonales
    ctx.strokeStyle = PAPER;
    ctx.beginPath(); ctx.moveTo(q[0][0] + 18, top + 50); ctx.lineTo(q[0][0] + 50, top + 4); ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q[0][0] + 40, top + 54); ctx.lineTo(q[0][0] + 66, top + 16); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    lensPath(ctx, q); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
    // barra superior gruesa
    ctx.beginPath(); ctx.moveTo(q[0][0] - 4, q[0][1] + 2); ctx.lineTo(q[1][0] + 4, q[1][1] + 2); ctx.lineWidth = 15; ctx.stroke();
  }
  // puente
  ctx.beginPath(); ctx.moveTo(560, 494); ctx.quadraticCurveTo(592, 480, 624, 492); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

const bez = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function chain(ctx: CanvasRenderingContext2D, p0: Pt, p1: Pt, p2: Pt, n: number, rx: number, ry: number, lw: number) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = bez(p0, p1, p2, t), [x2, y2] = bez(p0, p1, p2, Math.min(1, t + 0.01));
    const ang = Math.atan2(y2 - y, x2 - x) + (i % 2 ? 0.55 : -0.55);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = TINT; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-rx * 0.25, -ry * 0.2, rx * 0.35, ry * 0.25, 0, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
    ctx.restore();
  }
}

/** Cadena fina y larga con chapa "200", y otra gruesa pegada al cuello. */
export function drawChains(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  chain(ctx, [500, 930], [628, 1075], [786, 940], 34, 9, 5, 1.8);
  // chapa colgante
  ctx.save(); ctx.translate(628, 1010); ctx.rotate(-0.06);
  ctx.beginPath(); ctx.roundRect(-34, 4, 68, 40, 12); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '800 22px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('200', 0, 25);
  ctx.restore();
  chain(ctx, [512, 915], [626, 1030], [772, 925], 24, 13, 8, 3);
  ctx.restore();
}

/** Gancho para el compositor: cadenas y luego gafas, según los cosméticos del estado. */
export const drawAccessories: AccessoryHook = (ctx, layers, state) => {
  const c = state.cosmetics;
  if (!c) return;
  if (c.chain) drawChains(ctx);
  if (c.shades) drawShades(ctx, layers);
};

/** Carga JetBrains Mono 800 (la chapa "200"); resuelve true si está lista. Tolerante a fallos. */
export async function loadChainFont(): Promise<boolean> {
  try {
    await document.fonts.load('800 22px "JetBrains Mono"');
    return document.fonts.check('800 22px "JetBrains Mono"');
  } catch {
    return false;
  }
}
