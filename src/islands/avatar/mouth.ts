// Deformación de la boca por columnas (fórmulas del prototipo). MCX/MHALF coinciden con layers.json.
import type { MouthParams } from './poses';

export const MCX = 598, MHALF = 92, OPEN_HALF = 72;

const uOf = (x: number) => Math.max(-1, Math.min(1, (x - MCX) / MHALF));

/** Desplazamiento vertical del labio superior en la columna x (negativo = sube). */
export function dyUp(x: number, m: MouthParams): number {
  const u = uOf(x);
  // 0 - … evita -0 en el centro y en el lado quieto de la mueca.
  return 0 - m.s * u * u * (1 + m.a * Math.sign(x - MCX));
}

/** Apertura de la boca en la columna x: máxima en el centro, 0 fuera de OPEN_HALF. */
export function openAt(x: number, m: MouthParams): number {
  const v = (x - MCX) / OPEN_HALF;
  return m.o * Math.max(0, 1 - v * v);
}

/** El labio inferior sigue al superior al 55 % y baja con la apertura. */
export function dyLo(x: number, m: MouthParams): number {
  return dyUp(x, m) * 0.55 + openAt(x, m);
}

/** Ensanchamiento horizontal alrededor del centro de la boca. */
export function mapX(x: number, m: MouthParams): number {
  return MCX + (x - MCX) * m.w;
}
