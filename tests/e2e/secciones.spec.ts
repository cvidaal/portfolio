import { test, expect } from '@playwright/test';

test.describe('carteles contenidos', () => {
  test('en escritorio el cartel cabe en el ancho del contenido y su título mide <= 64 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const contenido = await page.locator('#experiencia .exp').boundingBox();
    const carteles = page.locator('.poster');
    expect(await carteles.count()).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < (await carteles.count()); i++) {
      const caja = (await carteles.nth(i).boundingBox())!;
      expect(caja.width, `cartel ${i}`).toBeLessThanOrEqual(contenido!.width + 1);
      expect(caja.width, `cartel ${i} no a sangre`).toBeLessThan(1440);
      const fs = await carteles.nth(i).locator('h2').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      expect(fs, `título ${i}`).toBeLessThanOrEqual(64);
      expect(caja.height, `altura ${i}`).toBeLessThanOrEqual(130);
    }
  });
});

test.describe('experiencia', () => {
  test('tres empresas en orden, con puesto y fechas literales', async ({ page }) => {
    await page.goto('/');
    const jobs = page.locator('#experiencia article.job');
    await expect(jobs).toHaveCount(3);
    await expect(jobs.locator('h3')).toHaveText(['Top Doctors', 'Ulandu', 'Aeternum Game Studios']);
    const t0 = jobs.nth(0), t1 = jobs.nth(1), t2 = jobs.nth(2);
    await expect(t0).toContainText('Integration Developer');
    await expect(t0).toContainText('mar. 2026 – actualidad');
    await expect(t0).toContainText('Remoto');
    await expect(t0).toContainText('Conecto la plataforma con aseguradoras, hospitales y software clínico en Go: más de 10 integraciones con APIs de terceros.');
    await expect(t0).toContainText('pipeline de ingesta del catálogo público de medicamentos del NHS');
    await expect(t1).toContainText('Desarrollador Mobile (Flutter)');
    await expect(t1).toContainText('Prácticas');
    await expect(t1).toContainText('mar. – jun. 2025');
    await expect(t1).toContainText('Escáner de códigos de barras y reservas para clubes de pádel');
    await expect(t1.getByRole('link', { name: 'Ver el proyecto' })).toHaveAttribute('href', '#proyectos');
    await expect(t2).toContainText('Level Designer');
    await expect(t2).toContainText('may. 2020 – jul. 2022');
    await expect(t2).toContainText('Aeterna Noctis');
    await expect(t2).toContainText('Diseño técnico de más de 35 niveles en Unity');
    await expect(t0.locator('.tags li')).toHaveText(['Go', 'APIs REST', 'Webhooks', 'GCP Pub/Sub', 'Docker', 'SQL']);
    await expect(t1.locator('.tags li')).toHaveText(['Flutter', 'Stripe', 'Firebase', 'APIs REST']);
    await expect(t2.locator('.tags li')).toHaveText(['Unity', 'Level design']);
  });

  test('cada tarjeta muestra el logo de su empresa, sin imágenes rotas', async ({ page }) => {
    await page.goto('/');
    const logos = page.locator('#experiencia .job .logo');
    const imgs = page.locator('#experiencia .job .logo img');
    await expect(imgs).toHaveCount(3);
    for (const img of await imgs.all()) {
      await img.scrollIntoViewIfNeeded();
      expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    const caja = (await logos.first().boundingBox())!;
    expect(Math.round(caja.width)).toBe(64);
    expect(Math.round(caja.height)).toBe(64);
  });
});

test.describe('sobre mí', () => {
  test('es visible con el titular, el texto y los cuatro datos rápidos', async ({ page }) => {
    await page.goto('/');
    const s = page.locator('section#sobre-mi');
    await expect(s).toHaveCount(1);
    await expect(s.locator('h3')).toHaveText('De crear mundos virtuales a construir sistemas reales.');
    await expect(s).toContainText('Pasé más de dos años diseñando niveles de Aeterna Noctis.');
    await expect(s).toContainText('Del diseño de niveles me traje la manía por el detalle.');
    await expect(s).toContainText('prueban la herramienta nueva el mismo día que sale');
    await expect(s).toContainText('Acelerik Booking');
    await expect(s.locator('dl dt')).toHaveText(['ubicación:', 'stack:', 'antes:', 'fuera del código:']);
    await expect(s.locator('dl dd')).toHaveText([
      'Madrid · Remoto',
      'Go · Pub/Sub · Docker · PostgreSQL',
      'level design de videojuegos',
      'trasteando con lo último en tecnología e IA',
    ]);
    await expect(s).not.toContainText('PLACEHOLDER');
  });

  test('sin JS también se lee', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('section#sobre-mi h3')).toBeVisible();
    await ctx.close();
  });
});
