import type { GameState } from './engine';
import { t } from '../../i18n';
import type { es } from '../../i18n/es';

export type AchId = 'hola' | 'racha' | 'hooks' | 'cero' | 'mil' | 'secreto';
export type ThemeId = 'rojo' | 'azul' | 'verde';
export type Save = {
  best: number;
  unlocked: AchId[];
  theme: ThemeId;
  shades: boolean;
  chain: boolean;
  progress: { maxCombo: number; maxHooks: number; maxScore: number };
};

export const ACH_IDS: readonly AchId[] = ['hola', 'racha', 'hooks', 'cero', 'mil', 'secreto'];
export const THEME_IDS: readonly ThemeId[] = ['rojo', 'azul', 'verde'];

export const META_RACHA = 10;
export const META_HOOKS = 5;
export const META_MIL = 500;
export const CERO_MIN_ROUTED = 12;

type Key = keyof typeof es;
const key = (id: AchId, f: string) => `logros.${id}.${f}` as Key;
const HAS_REWARD: readonly AchId[] = ['racha', 'hooks', 'cero', 'mil', 'secreto'];
const METAS: Partial<Record<AchId, number>> = { racha: META_RACHA, hooks: META_HOOKS, mil: META_MIL };

export const ACHIEVEMENTS: { id: AchId; nombre: string; desc: string; recompensa?: string; meta?: number }[] =
  ACH_IDS.map((id) => ({
    id,
    nombre: t(key(id, 'nombre')),
    desc: t(key(id, 'desc')),
    ...(HAS_REWARD.includes(id) ? { recompensa: t(key(id, 'recompensa')) } : {}),
    ...(METAS[id] !== undefined ? { meta: METAS[id] } : {}),
  }));

const REQUIRED_FOR_SECRET: readonly AchId[] = ['racha', 'hooks', 'cero', 'mil'];

/** Evalúa los logros tras un cambio de estado. Pura: no muta `save` ni `game`. */
export function evaluate(save: Save, game: GameState, final: boolean): { save: Save; nuevos: AchId[] } {
  const next: Save = {
    ...save,
    unlocked: save.unlocked.slice(),
    progress: {
      maxCombo: Math.max(save.progress.maxCombo, game.maxCombo),
      maxHooks: Math.max(save.progress.maxHooks, game.hooks),
      maxScore: Math.max(save.progress.maxScore, game.score),
    },
    best: Math.max(save.best, game.score),
  };
  const nuevos: AchId[] = [];
  const grant = (id: AchId) => {
    if (next.unlocked.includes(id)) return;
    next.unlocked.push(id);
    nuevos.push(id);
  };

  if (game.routed >= 1) grant('hola');
  if (game.maxCombo >= META_RACHA) { grant('racha'); next.shades = true; }
  if (game.hooks >= META_HOOKS) { grant('hooks'); next.chain = true; }
  if (final && game.t <= 0 && game.dlq === 0 && game.routed >= CERO_MIN_ROUTED) grant('cero');
  if (game.score >= META_MIL) grant('mil');
  if (REQUIRED_FOR_SECRET.every((id) => next.unlocked.includes(id))) grant('secreto');

  return { save: next, nuevos };
}
