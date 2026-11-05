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

/** Aplica el tema en :root. `--acc` es el nombre de la spec; `--accent`/`--accent-hi` son los tokens que usa el sitio. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const t = THEMES[theme] ?? THEMES.rojo;
  root.style.setProperty('--acc', t.acc);
  root.style.setProperty('--accent', t.acc);
  root.style.setProperty('--accent-hi', t.hi);
  root.style.setProperty('--avatar-filter', t.filter || 'none');
}
