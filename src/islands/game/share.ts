// Compartir el resultado: Web Share API si existe; si no, copiar texto + enlace.
import { t } from '../../i18n';
import { fmt } from './ui';

export const shareUrl = (): string => t('juego.url');
export type ShareResult = 'shared' | 'cancelled' | 'copied' | 'failed';

export const shareText = (score: number): string => fmt(t('juego.compartirTexto'), { n: score });
export const copyText = (score: number): string => fmt(t('juego.compartirCopia'), { texto: shareText(score), url: shareUrl() });

async function copy(text: string, nav: Navigator, doc: Document | null): Promise<boolean> {
  try {
    if (!nav.clipboard) throw new Error('sin portapapeles');
    await nav.clipboard.writeText(text);
    return true;
  } catch {
    if (!doc) return false;
    try {
      const ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      doc.body.appendChild(ta);
      ta.select();
      const ok = doc.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareScore(
  score: number,
  nav: Navigator = navigator,
  doc: Document | null = typeof document === 'undefined' ? null : document,
): Promise<ShareResult> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ text: shareText(score), url: shareUrl() });
      return 'shared';
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
      // otro fallo (p. ej. sin permiso): se intenta copiar
    }
  }
  return (await copy(copyText(score), nav, doc)) ? 'copied' : 'failed';
}
