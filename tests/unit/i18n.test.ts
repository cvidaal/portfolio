import { describe, expect, it } from 'vitest';
import { es } from '../../src/i18n/es';
import { t, locale } from '../../src/i18n';
import { isPlaceholder } from '../../src/lib/placeholder';

describe('i18n', () => {
  it('textos clave literales', () => {
    expect(locale).toBe('es');
    expect(t('hero.rol')).toBe('Backend Developer · Go');
    expect(t('hero.estado')).toBe('Abierto a oportunidades · Backend / Go');
    expect(t('arcade.titulo')).toBe('PUB/SUB RUSH');
    expect(t('arcade.sub')).toBe('Haz mi trabajo durante 45 segundos. Si aguantas, desbloqueas cosas.');
    expect(t('arcade.start')).toBe('▶ PULSA START');
    expect(t('arcade.logros')).toBe('LOGROS {n}/{total}');
    expect(t('logros.panel.titulo')).toBe('Logros');
    expect(t('juego.verLogros')).toBe('Ver logros');
  });
  it('sin Full Stack, Claude ni IA como herramienta', () => {
    const all = Object.values(es).join(' ');
    expect(all).not.toMatch(/Full ?Stack/i);
    expect(all).not.toMatch(/Claude/i);
    expect(all).not.toMatch(/FullStack_CV/);
  });
  it('sin emojis', () => {
    // ▶ (botón del juego, literal de la spec) y © no son emojis de interfaz
    const sin = Object.values(es).join(' ').replace(/[▶©]/g, '');
    expect(sin).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it('CV y contacto', () => {
    expect(t('cv.href')).toBe('/CarlosVidal_Backend_CV.pdf');
    expect(t('contacto.email')).toBe('carlosvidal.developer@gmail.com');
    expect(t('contacto.linkedin')).toBe('https://www.linkedin.com/in/carlosvidaldev/');
    expect(t('contacto.github')).toBe('https://github.com/cvidaal');
  });
  it('no queda ningún placeholder en los textos', () => {
    const ph = Object.entries(es).filter(([, v]) => isPlaceholder(v)).map(([k]) => k);
    expect(ph).toEqual([]);
  });
  it('stack mostrado', () => {
    expect(t('stack.items').split('|')).toEqual(
      ['Go', 'APIs REST', 'Webhooks', 'GCP Pub/Sub', 'Docker', 'Testing', 'PostgreSQL']);
  });
});

describe('i18n: textos de accesibilidad y errores', () => {
  it('claves de salto y fallo de copia', () => {
    expect(t('nav.saltar')).toBe('Saltar al contenido');
    expect(t('contacto.copiarError')).toMatch(/No se pudo copiar/);
  });
});
