import type { MsgType, Incident } from './engine';

export const INCIDENT_FIRST = 15; // s de juego hasta el primero
export const INCIDENT_EVERY = 15; // s entre incidentes
export const INCIDENT_JITTER = 3; // +- s
export const CAIDO_SECS = 5;
export const DEPLOY_SECS = 3;
export const PICO_BURST = 5;

export const KINDS: Incident['kind'][] = ['pico', 'caido', 'deploy'];
export const SERVICES: MsgType[] = ['pago', 'reserva', 'aviso'];

export function pickKind(r: number): Incident['kind'] {
  return KINDS[Math.min(KINDS.length - 1, Math.floor(r * KINDS.length))];
}

export function pickService(r: number): MsgType {
  return SERVICES[Math.min(SERVICES.length - 1, Math.floor(r * SERVICES.length))];
}

// Fisher-Yates determinista; garantiza un orden distinto al original.
export function shuffleOrder(order: MsgType[], rand: () => number): MsgType[] {
  const out = order.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.every((v, i) => v === order[i])) out.push(out.shift() as MsgType);
  return out;
}

export function nextIncidentDelay(r: number): number {
  return INCIDENT_EVERY + (r * 2 - 1) * INCIDENT_JITTER;
}
