import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { t } from '../../src/i18n';

const grid = '.contact .icons';

test.describe('contacto con iconos', () => {
  test('cuatro tarjetas con nombre accesible Email, LinkedIn, GitHub y CV', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`${grid} > *`)).toHaveCount(4);
    await expect(page.locator(grid).getByRole('button', { name: /^Email/ })).toBeVisible();
    await expect(page.locator(grid).getByRole('link', { name: /^LinkedIn/ })).toBeVisible();
    await expect(page.locator(grid).getByRole('link', { name: /^GitHub/ })).toBeVisible();
    await expect(page.locator(grid).getByRole('link', { name: /^CV/ })).toBeVisible();
  });

  test('LinkedIn y GitHub abren en pestaña nueva con noopener; CV apunta al PDF', async ({ page }) => {
    await page.goto('/');
    for (const [name, url] of [['LinkedIn', t('contacto.linkedin')], ['GitHub', t('contacto.github')]]) {
      const a = page.locator(grid).getByRole('link', { name: new RegExp(`^${name}`) });
      await expect(a).toHaveAttribute('href', url);
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    const cv = page.locator(grid).getByRole('link', { name: /^CV/ });
    await expect(cv).toHaveAttribute('href', '/CarlosVidal_Backend_CV.pdf');
    await expect(cv).toHaveAttribute('download', t('cv.descarga'));
  });

  test('los iconos de marca van incrustados en el HTML, sin peticiones externas', async ({ page, baseURL }) => {
    const ext: string[] = [];
    page.on('request', (r) => { if (new URL(r.url()).origin !== new URL(baseURL!).origin) ext.push(r.url()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    for (const name of ['LinkedIn', 'GitHub']) {
      const svg = page.locator(grid).getByRole('link', { name: new RegExp(`^${name}`) }).locator('svg');
      await expect(svg).toHaveCount(1);
      expect(await svg.locator('path').first().getAttribute('d')).toMatch(/^M.{100,}/);
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
    expect(ext).toEqual([]);
  });

  test('la tarjeta Email copia el email con feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const card = page.locator(grid).getByRole('button', { name: /^Email/ });
    await card.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(t('contacto.email'));
    await expect(card.locator('.copy-txt')).toHaveText(t('contacto.copiado'));
    await expect(page.locator('#copy-status')).toHaveText(t('contacto.copiado'));
  });

  test('a 320 px no desborda y cada objetivo mide al menos 44 px de alto', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const cards = page.locator(`${grid} > *`);
    for (let i = 0; i < 4; i++) {
      const b = await cards.nth(i).boundingBox();
      expect(b!.height).toBeGreaterThanOrEqual(44);
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(320);
    }
  });

  test('la terminal se mantiene y sin violaciones de axe', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.contact .term')).toContainText('POST /contacto');
    const r = await new AxeBuilder({ page }).include('.contact').analyze();
    expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });
});
