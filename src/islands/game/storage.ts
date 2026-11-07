import { SAVE_KEY } from '../../lib/save-key';
import { ACH_IDS, THEME_IDS, type AchId, type Save, type ThemeId } from './achievements';

export function defaultSave(): Save {
  return {
    best: 0, unlocked: [], theme: 'rojo', shades: false, chain: false,
    progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 },
  };
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Lee y valida el guardado. Cada campo inválido vuelve a su valor por defecto; nunca lanza. */
export function loadSave(): Save {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const s: unknown = JSON.parse(raw);
    if (!isObj(s)) return d;
    const unlocked: AchId[] = [];
    if (Array.isArray(s.unlocked)) {
      for (const id of s.unlocked) {
        if (typeof id === 'string' && (ACH_IDS as readonly string[]).includes(id) && !unlocked.includes(id as AchId)) {
          unlocked.push(id as AchId);
        }
      }
    }
    const theme: ThemeId =
      typeof s.theme === 'string' && (THEME_IDS as readonly string[]).includes(s.theme) ? (s.theme as ThemeId) : d.theme;
    const p = isObj(s.progress) ? s.progress : {};
    return {
      best: num(s.best),
      unlocked,
      theme,
      shades: s.shades === true,
      chain: s.chain === true,
      progress: { maxCombo: num(p.maxCombo), maxHooks: num(p.maxHooks), maxScore: num(p.maxScore) },
    };
  } catch {
    return d;
  }
}

/** Guarda en localStorage (forma compatible con readCosmetics). Nunca lanza. */
export function persist(save: Save): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* almacenamiento bloqueado o lleno: se ignora */
  }
}
