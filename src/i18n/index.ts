import { es } from './es';
import { en } from './en';

export type Lang = 'es' | 'en';
export type Clave = keyof typeof es;

const DICCIONARIOS: Record<Lang, Record<Clave, string>> = { es, en };

// Idioma actual. En build, cada página lo fija con setLang() antes de pintar sus componentes
// (Astro construye las páginas de una en una). En el navegador sale del <html lang>.
let actual: Lang = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';

export const locale = (): Lang => actual;

export function setLang(lang: Lang): void {
  actual = lang;
}

export function t(key: Clave): string {
  return DICCIONARIOS[actual][key];
}

/** Ruta del sitio en el idioma actual: '/proyectos/x' → '/en/proyectos/x' en inglés. */
export function ruta(path: string, lang: Lang = actual): string {
  if (lang === 'es') return path;
  return path === '/' ? '/en/' : `/en${path.startsWith('/') ? path : `/${path}`}`;
}

/** La misma página en el otro idioma (para el selector ES/EN y los hreflang). */
export function rutaSinIdioma(pathname: string): string {
  const sin = pathname.replace(/^\/en(?=\/|$)/, '');
  return sin === '' ? '/' : sin;
}
