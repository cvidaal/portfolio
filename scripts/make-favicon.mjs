// Genera, desde assets-src/face.webp (cabeza en tinta roja con alfa), todo lo que lleva la cara:
//   public/face-nav.webp  96x96, cabeza entera sobre papel #F1EDE6 (circulo del menu, 2x de un circulo de 40 px)
//   public/favicon.png    192 px (tambien apple-touch-icon), cabeza entera sobre papel
//   public/favicon.ico    16/32/48 px (PNG embebidos); recorte mas cerrado a la cara (sin el exceso de pelo)
//     para que a 16 px se reconozca en vez de ser una mancha roja.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'assets-src/face.webp');
const PAPEL = { r: 0xf1, g: 0xed, b: 0xe6, alpha: 1 };

// Recortes cuadrados sobre la imagen de 1254 px: {left, top, size}.
const CABEZA = { left: 150, top: 20, size: 1000 }; // cabeza entera con margen
const CARA = { left: 250, top: 330, size: 780 }; // desde la frente: ojos, nariz y bigote ocupan el icono

const render = (crop, size, { round = false } = {}) => {
  let img = sharp(src).extract({ left: crop.left, top: crop.top, width: crop.size, height: crop.size })
    .flatten({ background: PAPEL }).resize(size, size, { kernel: 'lanczos3' });
  if (round) {
    const r = size / 2;
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`);
    img = img.composite([{ input: mask, blend: 'dest-in' }]);
  }
  return img;
};

await render(CABEZA, 96).webp({ quality: 90 }).toFile(join(root, 'public/face-nav.webp'));
writeFileSync(join(root, 'public/favicon.png'), await render(CABEZA, 192).png({ compressionLevel: 9 }).toBuffer());

// ICO: cabecera (6 B) + directorio (16 B por imagen) + PNG embebidos (validos desde Vista).
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((s) => render(CARA, s).png({ compressionLevel: 9 }).toBuffer()));
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
  // Vista ampliada (x16 / x8, vecino mas cercano) de los frames del ico para revisarlos a ojo.
  const out = process.argv[process.argv.indexOf('--preview') + 1];
  const big = await Promise.all(sizes.slice(0, 2).map((s, i) => sharp(frames[i]).resize(s * (s === 16 ? 16 : 12), null, { kernel: 'nearest' }).png().toBuffer()));
  await sharp({ create: { width: 256 + 384 + 60, height: 400, channels: 3, background: '#222' } })
    .composite([{ input: big[0], left: 20, top: 20 }, { input: big[1], left: 296, top: 20 }]).png().toFile(out);
}
console.log('favicons generados');
