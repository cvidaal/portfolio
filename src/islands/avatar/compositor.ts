// Compositor del avatar: compone los sprites precocinados (Task 5) en un canvas 1254×1254.
// Orden: base → iris recortados + párpados (o ojo cerrado) → boca por columnas de 2 px → cejas → accesorios.
import type { Cosmetics } from '../../lib/bus';
import { MCX, OPEN_HALF, dyUp, openAt, dyLo, mapX } from './mouth';
import type { MouthParams, Pose } from './poses';

export const INK = '#D8261C', PAPER = '#F1EDE6', TINT = '#F0A193';

export interface Sprite { src: string; x: number; y: number; w: number; h: number }
export interface EyeJson { ix: number; iy: number; ex: number; ey: number; rx: number; ry: number; top: number; bot: number; lid: Sprite }
export interface BrowJson { cx: number; cy: number; sprite: Sprite }
export interface LayersJson {
  size: number;
  base: string;
  static: string;
  eyes: [EyeJson, EyeJson];
  brows: [BrowJson, BrowJson];
  lips: { upper: Sprite; lower: Sprite; mcx: number; mhalf: number; upBot: Record<string, number> };
}
export interface Layers {
  json: LayersJson;
  base: HTMLImageElement;
  lids: [HTMLImageElement, HTMLImageElement];
  brows: [HTMLImageElement, HTMLImageElement];
  lipUpper: HTMLImageElement;
  lipLower: HTMLImageElement;
}

/** 0 abierto, 1 parpadeo, 2 guiño. */
export type EyeState = 0 | 1 | 2;
export interface AvatarState {
  look: { x: number; y: number };
  closed: [EyeState, EyeState];
  pose: Pose;
  cosmetics: Cosmetics | null;
}
/** Gancho de accesorios (gafas y cadenas: Task 7). Se llama al final, encima de todo lo demás. */
export type AccessoryHook = (ctx: CanvasRenderingContext2D, layers: Layers, state: AvatarState) => void;

async function loadImg(url: string) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}

/** Carga layers.json y sus sprites (las rutas del JSON son nombres de fichero relativos a dir). */
export async function loadLayers(dir = '/avatar/'): Promise<Layers> {
  const res = await fetch(`${dir}layers.json`);
  if (!res.ok) throw new Error(`layers.json ${res.status}`);
  const json = (await res.json()) as LayersJson;
  const files = [
    json.base,
    json.eyes[0].lid.src, json.eyes[1].lid.src,
    json.brows[0].sprite.src, json.brows[1].sprite.src,
    json.lips.upper.src, json.lips.lower.src,
  ];
  const [base, lid0, lid1, brow0, brow1, lipUpper, lipLower] = await Promise.all(files.map((f) => loadImg(dir + f)));
  return { json, base, lids: [lid0, lid1], brows: [brow0, brow1], lipUpper, lipLower };
}

export function createCompositor(canvas: HTMLCanvasElement, layers: Layers, opts: { accessories?: AccessoryHook } = {}) {
  const maybe = canvas.getContext('2d');
  if (!maybe) throw new Error('canvas 2d no disponible');
  const ctx: CanvasRenderingContext2D = maybe;
  const { json } = layers;
  const upBot: Record<number, number> = {};
  for (const [k, v] of Object.entries(json.lips.upBot)) upBot[Number(k)] = v;
  const slitX = Object.keys(upBot).map(Number).filter((x) => Math.abs(x - MCX) < OPEN_HALF).sort((a, b) => a - b);

  function drawEye(k: 0 | 1, state: AvatarState) {
    const e = json.eyes[k];
    const c = state.closed[k];
    if (c) {
      ctx.beginPath(); ctx.ellipse(e.ex, e.ey - 2, e.rx + 6, e.ry + 9, 0, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
      ctx.beginPath(); ctx.lineCap = 'round';
      if (c === 2) {
        ctx.moveTo(e.ex - e.rx + 4, e.ey + 5); ctx.quadraticCurveTo(e.ex, e.ey - 12, e.ex + e.rx - 4, e.ey + 5); ctx.lineWidth = 7;
      } else {
        ctx.moveTo(e.ex - e.rx + 4, e.ey + 1); ctx.quadraticCurveTo(e.ex, e.ey + 9, e.ex + e.rx - 4, e.ey + 1); ctx.lineWidth = 5;
      }
      ctx.strokeStyle = INK; ctx.stroke();
      if (c === 2) {
        // pestaña: cola hacia fuera en el extremo exterior del ojo guiñado
        const sx = k === 0 ? e.ex - e.rx + 4 : e.ex + e.rx - 4, d = k === 0 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(sx, e.ey + 5); ctx.lineTo(sx + d * 10, e.ey + 1); ctx.lineWidth = 4; ctx.stroke();
      }
      return;
    }
    ctx.save();
    ctx.beginPath(); ctx.ellipse(e.ex, e.ey, e.rx, e.ry, 0, 0, Math.PI * 2); ctx.clip();
    const cx = e.ix + state.look.x * 14, cy = e.iy + state.look.y * 4;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fillStyle = TINT; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 6, cy - 6, 4, 0, Math.PI * 2); ctx.fillStyle = PAPER; ctx.fill();
    ctx.restore();
    ctx.drawImage(layers.lids[k], e.lid.x, e.lid.y);
  }

  /** Labio en rodajas de 2 px: cada columna se desplaza dy(x) y se ensancha con mapX. */
  function drawLip(img: HTMLImageElement, s: Sprite, dy: (x: number, m: MouthParams) => number, m: MouthParams) {
    for (let sx = 0; sx < s.w; sx += 2) {
      const x = s.x + sx, sw = Math.min(2, s.w - sx);
      ctx.drawImage(img, sx, 0, sw, s.h, mapX(x, m), s.y + dy(x, m), sw * m.w + 0.6, s.h);
    }
  }

  function drawMouth(m: MouthParams) {
    if (m.o > 1.2 && slitX.length) {
      const top = (x: number) => upBot[x] + dyUp(x, m) - 2;
      const bot = (x: number) => top(x) + openAt(x, m);
      const path = () => {
        ctx.beginPath();
        slitX.forEach((x, j) => (j ? ctx.lineTo(mapX(x, m), top(x)) : ctx.moveTo(mapX(x, m), top(x))));
        for (let j = slitX.length - 1; j >= 0; j--) ctx.lineTo(mapX(slitX[j], m), bot(slitX[j]));
        ctx.closePath();
      };
      path(); ctx.fillStyle = INK; ctx.fill();
      // dientes: franja de papel bajo el labio superior
      ctx.save(); path(); ctx.clip(); ctx.beginPath();
      slitX.forEach((x, j) => {
        const X = mapX(x, m), Y = top(x) + Math.min(8, openAt(x, m) * 0.5);
        if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      });
      for (let j = slitX.length - 1; j >= 0; j--) ctx.lineTo(mapX(slitX[j], m), top(slitX[j]) - 2);
      ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.restore();
      // borde inferior de la boca abierta
      ctx.beginPath();
      slitX.forEach((x, j) => (j ? ctx.lineTo(mapX(x, m), bot(x)) : ctx.moveTo(mapX(x, m), bot(x))));
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    }
    drawLip(layers.lipUpper, json.lips.upper, dyUp, m);
    drawLip(layers.lipLower, json.lips.lower, dyLo, m);
  }

  function draw(state: AvatarState) {
    ctx.drawImage(layers.base, 0, 0);
    drawEye(0, state);
    drawEye(1, state);
    drawMouth(state.pose.m);
    json.brows.forEach((b, k) => {
      const br = state.pose.b[k];
      ctx.save();
      ctx.translate(b.cx, b.cy + br.y); ctx.rotate(br.r); ctx.translate(-b.cx, -b.cy);
      ctx.drawImage(layers.brows[k], b.sprite.x, b.sprite.y);
      ctx.restore();
    });
    // Accesorios (Task 7): gafas y cadenas se pintan aquí, encima de todo.
    opts.accessories?.(ctx, layers, state);
  }

  return { draw };
}
