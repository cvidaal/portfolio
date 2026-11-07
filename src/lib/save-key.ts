// Clave de guardado del juego (la Task 9 la importa de aquí) y lectura tolerante de cosméticos.
import type { Cosmetics, Theme } from './bus';

export const SAVE_KEY = 'pubsub-rush:v1';
const THEMES: readonly Theme[] = ['rojo', 'azul', 'verde'];

/** Cosméticos guardados ({ shades, chain, theme } en la raíz del Save) o null ante cualquier fallo. */
export function readCosmetics(): Cosmetics | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return null;
    if (typeof s.shades !== 'boolean' || typeof s.chain !== 'boolean' || !THEMES.includes(s.theme)) return null;
    return { shades: s.shades, chain: s.chain, theme: s.theme };
  } catch {
    return null;
  }
}

/** ¿Hay algo guardado que obligue a pintar el avatar compuesto en vez de la imagen estática? */
export function needsCompositor(c: Cosmetics | null): boolean {
  return !!c && (c.shades || c.chain || c.theme !== 'rojo');
}
