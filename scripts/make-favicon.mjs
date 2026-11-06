// Genera los favicons desde public/favicon.svg (marca "CV" papel #F1EDE6 sobre acento #E4251B):
//   public/favicon.png (192 px, tambien apple-touch-icon) y public/favicon.ico (PNG de 16/32/48 embebidos).
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/favicon.svg'));
const png = (size) => sharp(svg, { density: 512 }).resize(size, size).png({ compressionLevel: 9, palette: true }).toBuffer();

writeFileSync(join(root, 'public/favicon.png'), await png(192));

// ICO: cabecera (6 B) + directorio (16 B por imagen) + PNG embebidos (validos desde Vista).
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(png));
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
console.log('favicons generados');
