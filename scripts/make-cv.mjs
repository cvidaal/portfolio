// Genera public/CarlosVidal_Backend_CV.pdf desde assets-src/cv/cv.html (A4, una página).
// Para cambiar el CV: edita cv.html y ejecuta `npm run cv`.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const SALIDA = 'public/CarlosVidal_Backend_CV.pdf';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await page.goto(pathToFileURL(resolve('assets-src/cv/cv.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: SALIDA, format: 'A4', printBackground: true, preferCSSPageSize: true });
await page.screenshot({ path: 'assets-src/cv/preview.png', fullPage: true });
await browser.close();

const paginas = (readFileSync(SALIDA, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`${SALIDA} (${paginas} página/s)`);
if (paginas !== 1) {
  console.error('El CV ocupa más de una página: ajusta cv.html');
  process.exit(1);
}
