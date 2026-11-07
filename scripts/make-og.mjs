// Genera public/og.png (1200x630): fondo #101012, avatar en tinta roja a la derecha, texto a la izquierda.
// Avatar: public/avatar/static.webp (ya recoloreado a tinta roja por scripts/avatar/bake.mjs).
// Nota: sharp renderiza el SVG con las fuentes del sistema (no ve las fuentes autoalojadas),
// por eso el texto usa una pila de respaldo (Arial Black / Arial / sans-serif).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'public/avatar/static.webp');
const OUT = join(root, 'public/og.png');
const W = 1200, H = 630, AV = 630;

const avatar = await sharp(SRC).resize(AV, AV).png().toBuffer();

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
  .png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 }) // paleta: < 300 KB para que WhatsApp no descarte la imagen
  .toFile(OUT);
console.log('og.png generado:', OUT);
