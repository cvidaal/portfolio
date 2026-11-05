// Poses del avatar (cejas + boca) con los valores finales del prototipo v7.
import type { PoseName } from '../../lib/bus';

export type { PoseName };
export interface Brow { y: number; r: number }
export interface MouthParams { s: number; o: number; a: number; w: number }
export interface Pose { b: [Brow, Brow]; m: MouthParams }

const B0: Brow = { y: 0, r: 0 };
export const POSES: Record<PoseName, Pose> = {
  neutral:   { b: [B0, B0], m: { s: 0, o: 0, a: 0, w: 1 } },
  smile:     { b: [{ y: -5, r: -0.02 }, { y: -5, r: 0.02 }], m: { s: 17, o: 0, a: 0, w: 1.05 } },
  grin:      { b: [{ y: -10, r: -0.03 }, { y: -10, r: 0.03 }], m: { s: 18, o: 14, a: 0, w: 1.08 } },
  smirkL:    { b: [{ y: -12, r: -0.06 }, { y: 2, r: 0.02 }], m: { s: 15, o: 0, a: -1, w: 1 } },
  smirkR:    { b: [{ y: 2, r: -0.02 }, { y: -12, r: 0.06 }], m: { s: 15, o: 0, a: 1, w: 1 } },
  surprised: { b: [{ y: -16, r: -0.05 }, { y: -16, r: 0.05 }], m: { s: 5, o: 0, a: 0, w: 1.02 } },
  think:     { b: [{ y: 4, r: 0.07 }, { y: 4, r: -0.07 }], m: { s: -3, o: 0, a: 0.7, w: 0.9 } },
  winkL:     { b: [{ y: 6, r: 0.06 }, { y: -10, r: 0.04 }], m: { s: 16, o: 0, a: -1, w: 1.03 } },
  winkR:     { b: [{ y: -10, r: -0.04 }, { y: 6, r: -0.06 }], m: { s: 16, o: 0, a: 1, w: 1.03 } },
};

export const IDLE_POSES: readonly PoseName[] = ['smile', 'smirkL', 'smirkR', 'think', 'grin', 'smile'];
/** Factores de suavizado por frame (1 = salto directo). */
export const K_LOOK = 0.12;
export const K_POSE = 0.16;
/** Distancia en px de pantalla a la que la mirada satura. */
export const LOOK_SAT = 260;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Interpolación exponencial de cur hacia target (k=1 salta). No muta. */
export function step(cur: Pose, target: Pose, k: number): Pose {
  return {
    b: [0, 1].map((i) => ({ y: lerp(cur.b[i].y, target.b[i].y, k), r: lerp(cur.b[i].r, target.b[i].r, k) })) as [Brow, Brow],
    m: { s: lerp(cur.m.s, target.m.s, k), o: lerp(cur.m.o, target.m.o, k), a: lerp(cur.m.a, target.m.a, k), w: lerp(cur.m.w, target.m.w, k) },
  };
}

/** Desplazamiento de mirada normalizado (|v| ≤ 1) para un vector de pantalla, saturado a LOOK_SAT px. */
export function lookOffset(dx: number, dy: number): { x: number; y: number } {
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / LOOK_SAT);
  return { x: (dx / d) * k + 0, y: (dy / d) * k + 0 };
}
