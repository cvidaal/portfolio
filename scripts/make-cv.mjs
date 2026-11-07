// Genera los CV en PDF (A4, una página) desde assets-src/cv/: cv.html (es) y cv-en.html (en).
// Para cambiar el CV: edita el HTML y ejecuta `npm run cv`.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const CVS = [
  { html: 'assets-src/cv/cv.html', pdf: 'public/CarlosVidal_Backend_CV.pdf', preview: 'assets-src/cv/preview.png' },
  { html: 'assets-src/cv/cv-en.html', pdf: 'public/CarlosVidal_Backend_CV_EN.pdf', preview: 'assets-src/cv/preview-en.png' },
];

const browser = await chromium.launch();
let fallo = false;
for (const cv of CVS) {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto(pathToFileURL(resolve(cv.html)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: cv.pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.screenshot({ path: cv.preview, fullPage: true });
  await page.close();
  const paginas = (readFileSync(cv.pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`${cv.pdf} (${paginas} página/s)`);
  if (paginas !== 1) { console.error(`${cv.html} ocupa más de una página: ajústalo`); fallo = true; }
}
await browser.close();
if (fallo) process.exit(1);
