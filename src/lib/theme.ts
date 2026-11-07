// Temas del sitio: re-tiñen el acento de toda la página y el filtro del avatar.
// Solo datos y DOM mínimo: lo importan el <head> (antes de pintar), Hero y el compositor.
import type { Theme } from './bus';

export interface ThemeDef {
  /** Acento grande (carteles, bloques). */
  acc: string;
  /** Variante para texto pequeño: >= 4.5:1 sobre #101012 (fondo) y #17171A (tarjeta). */
  hi: string;
  /** Filtro CSS del avatar ('' = sin filtro). */
  filter: string;
}

// Contrastes sobre #101012 / #17171A: rojo hi 5.03 / 4.74; azul hi 6.00 / 5.65; verde 10.65 / 10.03.
export const THEMES: Record<Theme, ThemeDef> = {
  rojo: { acc: '#E4251B', hi: '#F04336', filter: '' },
  azul: { acc: '#2F6BFF', hi: '#5A8CFF', filter: 'hue-rotate(215deg) saturate(1.1)' },
  verde: { acc: '#3DDC84', hi: '#3DDC84', filter: 'hue-rotate(125deg) saturate(.9)' },
};

/** Definición del tema; claves heredadas ("constructor", "__proto__"...) o desconocidas caen a rojo. */
export function themeDef(theme: unknown): ThemeDef {
  return typeof theme === 'string' && Object.prototype.hasOwnProperty.call(THEMES, theme) ? THEMES[theme as Theme] : THEMES.rojo;
}

/** Aplica el tema en :root. `--acc` es el nombre de la spec; `--accent`/`--accent-hi` son los tokens que usa el sitio. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const t = themeDef(theme);
  root.style.setProperty('--acc', t.acc);
  root.style.setProperty('--accent', t.acc);
  root.style.setProperty('--accent-hi', t.hi);
  root.style.setProperty('--avatar-filter', t.filter || 'none');
  tintFavicon(t.filter);
}

/** El icono de la pestaña sigue al tema: se repinta favicon.png con el mismo filtro que el avatar. */
export function tintFavicon(filter: string): void {
  if (typeof document === 'undefined') return;
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
  if (!links.length) return;
  for (const l of links) { if (!l.dataset.original) l.dataset.original = l.href; }
  if (!filter) { for (const l of links) l.href = l.dataset.original!; return; }
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.filter = filter;
      ctx.drawImage(img, 0, 0, 64, 64);
      const url = c.toDataURL('image/png');
      for (const l of links) l.href = url;
    } catch { /* sin canvas: se queda el icono original */ }
  };
  img.src = '/favicon.png';
}
