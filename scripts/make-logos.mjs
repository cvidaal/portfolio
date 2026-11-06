// Genera los logos de experiencia (src/assets/logos/*.png, 192×192, fondo transparente)
// a partir de los originales que aportó Carlos en assets-src/logos/.
// - Top Doctors: logo a color sobre blanco → se quita el blanco.
// - Ulandu y Aeternum: marca blanca sobre fondo oscuro → se recorta solo la marca y se pinta en tinta oscura
//   para que se lea sobre el hueco color papel.
// Uso: node scripts/make-logos.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'assets-src/logos';
const OUT = 'src/assets/logos';
const SIZE = 192;
const PAD = 0.12; // margen alrededor de la marca, en fracción del lado
const TINTA = [16, 16, 18]; // #101012

await mkdir(OUT, { recursive: true });

async function raw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// Caja de los píxeles con alfa > umbral dentro de una región [x0, y0, x1, y1).
function bbox(alpha, w, [x0, y0, x1, y1], th = 40) {
  let minX = x1, minY = y1, maxX = -1, maxY = -1;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (alpha[y * w + x] > th) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) throw new Error('no se encontró la marca en la región');
  return { minX, minY, maxX, maxY };
}

async function guardar(rgba, w, h, box, nombre) {
  const bw = box.maxX - box.minX + 1, bh = box.maxY - box.minY + 1;
  const lado = Math.round(Math.max(bw, bh) * (1 + 2 * PAD));
  const recorte = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: box.minX, top: box.minY, width: bw, height: bh })
    .png().toBuffer();
  // sharp aplica resize antes que composite: se compone en un paso y se escala en otro.
  const lienzo = await sharp({ create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: recorte, left: Math.round((lado - bw) / 2), top: Math.round((lado - bh) / 2) }])
    .png().toBuffer();
  await sharp(lienzo)
    .resize(SIZE, SIZE)
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${OUT}/${nombre}.png`);
  console.log(`${OUT}/${nombre}.png`);
}

// Marca blanca sobre fondo oscuro → alfa según el brillo, color tinta.
async function marcaBlanca(file, region, nombre) {
  const { data, w, h } = await raw(file);
  const out = Buffer.alloc(w * h * 4), alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const l = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
    const a = Math.max(0, Math.min(255, Math.round((l - 70) * 255 / (235 - 70)))) * (data[i * 4 + 3] / 255);
    alpha[i] = a;
    out[i * 4] = TINTA[0]; out[i * 4 + 1] = TINTA[1]; out[i * 4 + 2] = TINTA[2]; out[i * 4 + 3] = a;
  }
  await guardar(out, w, h, bbox(alpha, w, region), nombre);
}

// Logo a color sobre blanco → el blanco pasa a transparente.
async function sobreBlanco(file, nombre) {
  const { data, w, h } = await raw(file);
  const out = Buffer.from(data), alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const min = Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    const a = Math.max(0, Math.min(255, Math.round((255 - min) * 255 / 40)));
    alpha[i] = a; out[i * 4 + 3] = a;
  }
  await guardar(out, w, h, bbox(alpha, w, [0, 0, w, h]), nombre);
}

await sobreBlanco(`${SRC}/topdoctors-src.png`, 'topdoctors');
// Ulandu: solo el símbolo circular (a la izquierda del texto "ulandu").
await marcaBlanca(`${SRC}/ulandu-src.webp`, [600, 60, 815, 270], 'ulandu');
// Aeternum: solo la criatura (a la izquierda del texto "AETERNUM Game Studios").
await marcaBlanca(`${SRC}/aeternum-src.png`, [50, 0, 118, 107], 'aeternum');
