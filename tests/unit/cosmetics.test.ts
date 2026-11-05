import { describe, it, expect } from 'vitest';
import { THEMES, applyTheme } from '../../src/lib/theme';
import { drawShades, drawChains } from '../../src/islands/avatar/cosmetics';
import type { Layers } from '../../src/islands/avatar/compositor';

const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Contexto 2D falso que registra las llamadas. */
function fakeCtx() {
  const calls: Array<[string, unknown[]]> = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy({}, {
    get: (_t, k: string) => (k in state ? state[k] : (...a: unknown[]) => { calls.push([k, a]); }),
    set: (_t, k: string, v) => { state[k] = v; calls.push([`set:${k}`, [v]]); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('temas', () => {
  it('valores de la spec', () => {
    expect(THEMES.rojo).toMatchObject({ acc: '#E4251B', filter: '' });
    expect(THEMES.azul).toMatchObject({ acc: '#2F6BFF', filter: 'hue-rotate(215deg) saturate(1.1)' });
    expect(THEMES.verde).toMatchObject({ acc: '#3DDC84', filter: 'hue-rotate(125deg) saturate(.9)' });
  });
  it('la variante de texto pequeño mantiene >= 4.5:1 sobre fondo y tarjeta', () => {
    for (const t of Object.values(THEMES)) {
      expect(contrast(t.hi, '#101012')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.hi, '#17171A')).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('applyTheme fija las variables y el filtro', () => {
    const props: Record<string, string> = {};
    const root = { style: { setProperty: (k: string, v: string) => { props[k] = v; } } } as unknown as HTMLElement;
    applyTheme('azul', root);
    expect(props['--acc']).toBe('#2F6BFF');
    expect(props['--accent']).toBe('#2F6BFF');
    expect(props['--accent-hi']).toBe(THEMES.azul.hi);
    expect(props['--avatar-filter']).toBe('hue-rotate(215deg) saturate(1.1)');
    applyTheme('rojo', root);
    expect(props['--avatar-filter']).toBe('none');
    expect(props['--acc']).toBe('#E4251B');
  });
});

describe('accesorios', () => {
  const layers = {} as Layers;
  it('gafas: dos cristales #141416, reflejos y puente', () => {
    const { ctx, calls } = fakeCtx();
    drawShades(ctx, layers);
    expect(calls.filter(([k, a]) => k === 'set:fillStyle' && a[0] === '#141416')).toHaveLength(2);
    expect(calls.filter(([k]) => k === 'clip').length).toBeGreaterThanOrEqual(2);
    expect(calls.some(([k, a]) => k === 'quadraticCurveTo' && a[0] === 592 && a[1] === 480)).toBe(true); // puente
    expect(calls.some(([k, a]) => k === 'set:lineWidth' && a[0] === 15)).toBe(true); // barra superior
    expect(calls.filter(([k]) => k === 'save').length).toBe(calls.filter(([k]) => k === 'restore').length);
  });
  it('cadenas: 35 y 25 eslabones, chapa 200', () => {
    const { ctx, calls } = fakeCtx();
    drawChains(ctx);
    const links = (rx: number, ry: number) => calls.filter(([k, a]) => k === 'ellipse' && a[2] === rx && a[3] === ry).length;
    expect(links(9, 5)).toBe(35);
    expect(links(13, 8)).toBe(25);
    expect(calls.find(([k]) => k === 'fillText')?.[1][0]).toBe('200');
    expect(calls.filter(([k]) => k === 'save').length).toBe(calls.filter(([k]) => k === 'restore').length);
  });
});
