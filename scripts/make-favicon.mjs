// Genera, desde assets-src/face.svg (vector de Carlos, 1254x1254, fondo transparente), todo lo que lleva la cara.
// Todo con fondo TRANSPARENTE: sin circulo, sin borde y sin papel. El SVG (4,5 MB) nunca se sirve al navegador.
//   public/face-nav.webp, face-nav@2x.webp, face-nav@3x.webp   cabeza sola, 40 / 80 / 120 px de alto (srcset del menu)
//   public/favicon.png    192 px (tambien apple-touch-icon), recorte ajustado a la cabeza
//   public/favicon.ico    16/32/48 px (PNG embebidos)
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIN_FONDO = { r: 0, g: 0, b: 0, alpha: 0 };

// Se rasteriza una vez a 1254 px (densidad 72) y de ahi salen todos los tamanos.
const base = await sharp(join(root, 'assets-src/face.svg'), { density: 72 }).png().toBuffer();

// Recortes sobre la imagen de 1254 px (la cabeza ocupa x 186-1061, y 36-1108).
const CABEZA = { left: 178, top: 28, width: 895, height: 1088 }; // cabeza entera, margen minimo (para el menu)
const CUADRADO = { left: 76, top: 28, width: 1096, height: 1096 }; // la misma cabeza, centrada en un cuadrado

// Recorte ajustado a la cara (menos pelo) para los frames pequenos: a 16 px la cabeza entera se vuelve un borron.
const CARA = { left: 236, top: 330, width: 780, height: 780 };

const render = (crop, w, h) =>
  sharp(base).extract(crop).resize(w, h, { fit: 'contain', background: SIN_FONDO, kernel: 'lanczos3' });

// Menu: ~40 px de alto (1x / 2x / 3x). Ancho = 40 * 895/1088 = 32,9 -> 33 px a 1x.
for (const [suf, alto] of [['', 40], ['@2x', 80], ['@3x', 120]]) {
  await render(CABEZA, Math.round((alto * CABEZA.width) / CABEZA.height), alto)
    .webp({ quality: 92, alphaQuality: 100 }).toFile(join(root, `public/face-nav${suf}.webp`));
}

writeFileSync(join(root, 'public/favicon.png'), await render(CUADRADO, 192, 192).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer());

// ICO: cabecera (6 B) + directorio (16 B por imagen) + PNG embebidos (validos desde Vista).
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((s) => render(s <= 32 ? CARA : CUADRADO, s, s).png({ compressionLevel: 9 }).toBuffer()));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  head.writeUInt8(s, o); head.writeUInt8(s, o + 1); // ancho, alto
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); // planos, bpp
  head.writeUInt32LE(frames[i].length, o + 8); head.writeUInt32LE(offset, o + 12);
  offset += frames[i].length;
});
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([head, ...frames]));

if (process.argv.includes('--preview')) {
  // Vista ampliada (vecino mas cercano) de los frames 16 y 32 sobre fondo de pestana claro y oscuro.
  const out = process.argv[process.argv.indexOf('--preview') + 1];
  const big = await Promise.all([0, 1].map((i) => sharp(frames[i]).resize(sizes[i] * (i ? 8 : 16), null, { kernel: 'nearest' }).png().toBuffer()));
  const W = 2 * 572;
  const mitad = (bg, x) => ({ input: { create: { width: W / 2, height: 300, channels: 3, background: bg } }, left: x, top: 0 });
  await sharp({ create: { width: W, height: 300, channels: 3, background: '#fff' } })
    .composite([mitad('#f1f1f1', 0), mitad('#202124', W / 2),
      { input: big[0], left: 20, top: 20 }, { input: big[1], left: 20 + 256 + 20, top: 20 },
      { input: big[0], left: W / 2 + 20, top: 20 }, { input: big[1], left: W / 2 + 20 + 256 + 20, top: 20 }]).png().toFile(out);
}
console.log('favicons generados');
