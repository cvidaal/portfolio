// Genera public/og.png (1200x630): fondo #101012, avatar en tinta roja a la derecha, texto a la izquierda.
// Avatar provisional: duotono (luminancia -> tinta roja sobre crema). Tarea 5 lo sustituye por el avatar definitivo
// y se vuelve a ejecutar: `node scripts/make-og.mjs`.
// Nota: sharp renderiza el SVG con las fuentes del sistema (no ve las fuentes autoalojadas),
// por eso el texto usa una pila de respaldo (Arial Black / Arial / sans-serif).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'docs/superpowers/prototypes/avatar-ref.webp');
const OUT = join(root, 'public/og.png');
const W = 1200, H = 630, AV = 630;

const INK = [216, 38, 28];
const PAPER = [241, 237, 230];

// Duotono: oscuro -> tinta roja, claro -> papel.
const { data, info } = await sharp(SRC).resize(AV, AV).greyscale().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  const l = Math.min(1, Math.max(0, (data[i] - 90) / 140));
  for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(INK[c] + (PAPER[c] - INK[c]) * l);
  rgba[i * 4 + 3] = 255;
}
const avatar = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

const FONT = "'Arial Black', Arial, Helvetica, sans-serif";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="64" y="270" font-family="${FONT}" font-weight="900" font-size="104" letter-spacing="-4" fill="#F1EDE6">Carlos</text>
  <text x="64" y="372" font-family="${FONT}" font-weight="900" font-size="104" letter-spacing="-4" fill="none" stroke="#F1EDE6" stroke-width="2">Vidal</text>
  <rect x="64" y="410" width="440" height="44" fill="#E4251B"/>
  <text x="80" y="441" font-family="'Courier New', monospace" font-weight="700" font-size="24" fill="#101012">Backend Developer · Go</text>
</svg>`;

await sharp({ create: { width: W, height: H, channels: 4, background: '#101012' } })
  .composite([
    { input: avatar, left: W - AV, top: 0 },
    { input: Buffer.from(svg), left: 0, top: 0 },
  ])
  .png()
  .toFile(OUT);
console.log('og.png generado:', OUT);
