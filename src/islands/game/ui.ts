// Ayudas puras de la interfaz del juego (sin DOM ni React): se prueban con vitest.
import { t } from '../../i18n';
import { GUIDED_COUNT, type GameState, type MsgType } from './engine';
import { META_HOOKS, META_MIL, META_RACHA, evaluate, type AchId, type Save } from './achievements';

/** Sustituye {clave} por su valor. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export const ruta = (type: MsgType): string => t(`juego.ruta.${type}`);

/** Tecla '1'..'3' → servicio en esa posición visible (el deploy cambia el orden). */
export function keyToService(order: readonly MsgType[], key: string): MsgType | null {
  const i = ['1', '2', '3'].indexOf(key);
  return i >= 0 && i < order.length ? order[i] : null;
}

/** Primera partida: nunca se ha puntuado ni desbloqueado nada. */
export const isFirstGame = (save: Save): boolean => save.best === 0 && save.unlocked.length === 0;

/** Pista de la partida guiada para el mensaje que se va a enrutar (seleccionado o el más antiguo). */
export function hintFor(s: GameState, guided: boolean, selId?: number | null): string | null {
  if (!guided || s.over) return null;
  const m = s.msgs.find((x) => x.id === selId) ?? s.msgs[0];
  if (!m || m.id > GUIDED_COUNT) return null;
  return fmt(t('juego.pista'), { ruta: ruta(m.type), tecla: s.order.indexOf(m.type) + 1 });
}

/** ¿El foco está en un sitio donde las teclas escriben? */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || typeof el !== 'object') return false;
  const e = el as { tagName?: string; isContentEditable?: boolean };
  return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT' || e.isContentEditable === true;
}

const PROGRESS: Partial<Record<AchId, { key: 'vitrina.progreso.racha' | 'vitrina.progreso.hooks' | 'vitrina.progreso.mil'; meta: number; val: (s: Save) => number }>> = {
  racha: { key: 'vitrina.progreso.racha', meta: META_RACHA, val: (s) => s.progress.maxCombo },
  hooks: { key: 'vitrina.progreso.hooks', meta: META_HOOKS, val: (s) => s.progress.maxHooks },
  mil: { key: 'vitrina.progreso.mil', meta: META_MIL, val: (s) => s.progress.maxScore },
};

/** "racha máx.: 7/10" (con tope en la meta) o null si el logro no tiene progreso. */
export function progressText(id: AchId, save: Save): string | null {
  const p = PROGRESS[id];
  if (!p) return null;
  return fmt(t(p.key), { n: Math.min(p.meta, Math.floor(p.val(save))), meta: p.meta });
}

/**
 * Evalúa logros y los aplica al guardado.
 * - El récord solo cambia al final de un turno (abandonar a medias no cuenta).
 * - Gafas/cadenas se ponen solas al desbloquearse; después manda el interruptor de la vitrina.
 */
export function settle(prev: Save, game: GameState, final: boolean): { save: Save; nuevos: AchId[]; cosmeticsChanged: boolean } {
  const { save, nuevos } = evaluate(prev, game, final);
  const next: Save = {
    ...save,
    best: final ? save.best : prev.best,
    shades: nuevos.includes('racha') ? true : prev.shades,
    chain: nuevos.includes('hooks') ? true : prev.chain,
  };
  return { save: next, nuevos, cosmeticsChanged: next.shades !== prev.shades || next.chain !== prev.chain };
}
