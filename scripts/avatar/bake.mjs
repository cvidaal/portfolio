// Precocina las capas del avatar (base, ojos/párpados, cejas, labios, static) a public/avatar/.
// Uso: `npm run avatar:bake`. Port fiel de la lógica del prototipo hero-avatar-y-juego.html.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { W, purpleness, luminance, ramp, floodBackground, components, dilate, hex, lerp } from './pixels.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(root, 'assets-src/avatar-ref.webp');
const OUT = join(root, 'public/avatar');
mkdirSync(OUT, { recursive: true });

const H = W, N = W * H;
const INK_HEX = '#D8261C', PAPER_HEX = '#F1EDE6', TINT_HEX = '#F0A193';
const ink = hex(INK_HEX), paper = hex(PAPER_HEX);
const FIG = [[0.6, '#C9301F'], [0.75, '#E0705F'], [0.80, TINT_HEX], [0.88, '#F4C8BC'], [0.95, PAPER_HEX]].map(([l, h]) => [l, hex(h)]);
const BGS = [[0.84, '#E4251B'], [0.90, '#5A1612'], [0.94, '#101012']].map(([l, h]) => [l, hex(h)]);

const EYES = [
  { ix: 501, iy: 517.5, top: 507, bot: 536, ex: 494, ey: 518, rx: 47, ry: 12.5, box: [435, 488, 552, 546] },
  { ix: 692.5, iy: 512.5, top: 503, bot: 532, ex: 690, ey: 514, rx: 48, ry: 12.5, box: [628, 483, 752, 541] },
];
const inIris = (e, x, y) => Math.hypot(x - e.ix, y - e.iy) < 24 && y >= e.top && y <= e.bot;

const { data: src, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== W || info.height !== H) throw new Error(`avatar-ref.webp debe ser ${W}x${H}`);
const L = new Float32Array(N), P = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
  L[i] = luminance(r, g, b);
  P[i] = purpleness(r, g, b);
}
const bg = floodBackground(L, P, W, H);

// Cejas y labios
const BROWS = [
  { m: dilate(components(P, [414, 430, 600, 500], 0.5)[0].px, P), cx: 485, cy: 470 },
  { m: dilate(components(P, [600, 425, 800, 500], 0.5)[0].px, P), cx: 697, cy: 465 },
];
const lipC = components(P, [495, 685, 710, 750], 0.55).filter((c) => c.px.length > 60).sort((a, b) => a.cy - b.cy);
const LIPS = [lipC[0], lipC[lipC.length - 1]].map((c) => ({ m: dilate(c.px, P), core: c.px }));
const upBot = {};
for (const i of LIPS[0].core) { const x = i % W, y = (i / W) | 0; if (!(x in upBot) || y > upBot[x]) upBot[x] = y; }

// Capas RGBA (tinta con alfa)
const mk = () => Buffer.alloc(N * 4);
const baseBuf = mk(), lidL = [mk(), mk()], browL = [mk(), mk()], lipL = [mk(), mk()];
const put = (layer, i, a) => { layer[i * 4] = ink[0]; layer[i * 4 + 1] = ink[1]; layer[i * 4 + 2] = ink[2]; layer[i * 4 + 3] = a; };
for (let i = 0; i < N; i++) {
  const x = i % W, y = (i / W) | 0;
  let f = lerp(bg[i] ? ramp(BGS, L[i]) : ramp(FIG, L[i]), ink, P[i]);
  const a = Math.min(255, P[i] * 400);
  let taken = false;
  for (let k = 0; k < 2 && !taken; k++) if (BROWS[k].m[i]) { put(browL[k], i, a); f = paper; taken = true; }
  for (let k = 0; k < 2 && !taken; k++) if (LIPS[k].m[i]) { put(lipL[k], i, a); f = paper; taken = true; }
  EYES.forEach((e, k) => {
    if (inIris(e, x, y)) f = paper;
    else if (!taken && x >= e.box[0] && x <= e.box[2] && y >= e.box[1] && y <= e.box[3] && P[i] > 0.15) put(lidL[k], i, Math.min(255, P[i] * 320));
  });
  baseBuf[i * 4] = Math.round(f[0]); baseBuf[i * 4 + 1] = Math.round(f[1]); baseBuf[i * 4 + 2] = Math.round(f[2]); baseBuf[i * 4 + 3] = 255;
}

const raw = { raw: { width: W, height: H, channels: 4 } };
const webp = { quality: 85, alphaQuality: 100 };

// Recorta una capa a la caja de sus píxeles con alfa > 0 y la guarda.
async function sprite(buf, name) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < N; i++) {
    if (!buf[i * 4 + 3]) continue;
    const x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error(`capa vacía: ${name}`);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  await sharp(buf, raw).extract({ left: x0, top: y0, width: w, height: h }).webp(webp).toFile(join(OUT, name));
  return { src: name, x: x0, y: y0, w, h };
}

await sharp(baseBuf, raw).webp(webp).toFile(join(OUT, 'base.webp'));
const lids = await Promise.all(lidL.map((b, k) => sprite(b, `lid-${k}.webp`)));
const brows = await Promise.all(browL.map((b, k) => sprite(b, `brow-${k}.webp`)));
const lipUpper = await sprite(lipL[0], 'lip-upper.webp');
const lipLower = await sprite(lipL[1], 'lip-lower.webp');

// static.webp: base + iris centrados (recortados a la elipse del ojo) + párpados + labios + cejas.
const irisSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${EYES.map((e, k) =>
  `<clipPath id="c${k}"><ellipse cx="${e.ex}" cy="${e.ey}" rx="${e.rx}" ry="${e.ry}"/></clipPath>`).join('')}</defs>${EYES.map((e, k) =>
  `<g clip-path="url(#c${k})"><circle cx="${e.ix}" cy="${e.iy}" r="20" fill="${TINT_HEX}" stroke="${INK_HEX}" stroke-width="3"/>` +
  `<circle cx="${e.ix}" cy="${e.iy}" r="9" fill="${INK_HEX}"/><circle cx="${e.ix - 6}" cy="${e.iy - 6}" r="4" fill="${PAPER_HEX}"/></g>`).join('')}</svg>`;
// Orden del prototipo: iris + párpado por ojo, labios, cejas.
const crop = async (buf, s) => ({
  input: await sharp(buf, raw).extract({ left: s.x, top: s.y, width: s.w, height: s.h }).png().toBuffer(),
  left: s.x,
  top: s.y,
});
const comp = [{ input: Buffer.from(irisSvg), left: 0, top: 0 }];
const order = [[lidL[0], lids[0]], [lidL[1], lids[1]], [lipL[0], lipUpper], [lipL[1], lipLower], [browL[0], brows[0]], [browL[1], brows[1]]];
for (const [b, s] of order) comp.push(await crop(b, s));
await sharp(baseBuf, raw).composite(comp).webp(webp).toFile(join(OUT, 'static.webp'));

const layers = {
  size: W,
  base: 'base.webp',
  static: 'static.webp',
  // top/bot (extra respecto al tipo del brief): banda vertical donde el prototipo limpia el iris; útil para recortarlo.
  eyes: EYES.map((e, k) => ({ ix: e.ix, iy: e.iy, ex: e.ex, ey: e.ey, rx: e.rx, ry: e.ry, top: e.top, bot: e.bot, lid: lids[k] })),
  brows: BROWS.map((b, k) => ({ cx: b.cx, cy: b.cy, sprite: brows[k] })),
  lips: { upper: lipUpper, lower: lipLower, mcx: 598, mhalf: 92, upBot },
};
writeFileSync(join(OUT, 'layers.json'), JSON.stringify(layers));
console.log('avatar precocinado en', OUT);
