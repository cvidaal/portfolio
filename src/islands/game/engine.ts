import { step } from './rng';
import {
  CAIDO_SECS, DEPLOY_SECS, INCIDENT_FIRST, PICO_BURST,
  nextIncidentDelay, pickKind, pickService, shuffleOrder,
} from './incidents';

export type MsgType = 'pago' | 'reserva' | 'aviso';
export type Msg = { id: number; type: MsgType; hook: boolean; ttl: number; left: number };
// `until` es el valor de GameState.t (segundos restantes) en el que termina el incidente.
export type Incident = { kind: 'pico' | 'caido' | 'deploy'; until: number; service?: MsgType };
export type GameEvent = {
  kind: 'ok' | 'bad' | 'timeout' | 'save' | 'combo5' | 'combo10' | 'incident' | 'end';
  pts?: number;
  msgId?: number;
};
export type GameState = {
  t: number; score: number; combo: number; maxCombo: number; dlq: number; routed: number; hooks: number;
  msgs: Msg[]; order: MsgType[]; incident: Incident | null; guided: boolean; over: boolean; events: GameEvent[];
  // Estado interno del motor (determinista; la UI no debe tocarlo)
  rng: number; spawnIn: number; nextId: number; spawned: number; nextIncidentAt: number;
};

export const ROUND = 45;
export const MAXDLQ = 5;
export const MAXQUEUE = 7;
export const MAXDT = 0.05;
export const GUIDED_COUNT = 3;
const GUIDED_TTL = 12;
const GUIDED_INTERVAL = 3000;
const TYPES: MsgType[] = ['pago', 'reserva', 'aviso'];

export const multiplier = (combo: number) => Math.min(4, 1 + Math.floor(combo / 5));

function rand(s: GameState): number {
  const [v, n] = step(s.rng);
  s.rng = n;
  return v;
}

export function createGame(opts: { seed: number; guided: boolean }): GameState {
  const s: GameState = {
    t: ROUND, score: 0, combo: 0, maxCombo: 0, dlq: 0, routed: 0, hooks: 0,
    msgs: [], order: ['pago', 'reserva', 'aviso'], incident: null,
    guided: opts.guided, over: false, events: [],
    rng: opts.seed >>> 0, spawnIn: 300, nextId: 1, spawned: 0, nextIncidentAt: INCIDENT_FIRST,
  };
  s.nextIncidentAt = INCIDENT_FIRST + (rand(s) * 2 - 1) * 2;
  return s;
}

// Copia de trabajo: nada de lo que recibe el llamador se muta.
function clone(s: GameState): GameState {
  return { ...s, msgs: s.msgs.slice(), order: s.order.slice(), events: [] };
}

function spawn(s: GameState): void {
  const guidedMsg = s.guided && s.spawned < GUIDED_COUNT;
  const p = 1 - s.t / ROUND;
  const hook = !guidedMsg && rand(s) < 0.13;
  const type = TYPES[Math.floor(rand(s) * 3)];
  const ttl = guidedMsg ? GUIDED_TTL : (6.5 - 3 * p) * (hook ? 0.7 : 1);
  s.msgs.push({ id: s.nextId++, type, hook, ttl, left: ttl });
  s.spawned++;
  if (s.guided && s.spawned >= GUIDED_COUNT) s.guided = false;
}

function toDlq(s: GameState, m: Msg, kind: 'bad' | 'timeout'): void {
  s.msgs = s.msgs.filter((x) => x.id !== m.id);
  s.dlq++;
  s.combo = 0;
  s.events.push({ kind, msgId: m.id });
}

function finishIfNeeded(s: GameState): void {
  if (!s.over && (s.t <= 0 || s.dlq >= MAXDLQ)) {
    s.t = Math.max(0, s.t);
    s.over = true;
    s.events.push({ kind: 'end' });
  }
}

function applyIncident(s: GameState, kind: Incident['kind']): void {
  if (kind === 'pico') {
    for (let i = 0; i < PICO_BURST && s.msgs.length < MAXQUEUE; i++) spawn(s);
    s.incident = { kind, until: s.t };
  } else if (kind === 'caido') {
    s.incident = { kind, until: s.t - CAIDO_SECS, service: pickService(rand(s)) };
  } else {
    s.order = shuffleOrder(s.order, () => rand(s));
    s.incident = { kind, until: s.t - DEPLOY_SECS };
  }
  s.events.push({ kind: 'incident' });
}

// Dispara un incidente concreto ahora (para pruebas y depuración); tick lo usa con el calendario normal.
export function startIncident(prev: GameState, kind: Incident['kind']): GameState {
  const s = clone(prev);
  applyIncident(s, kind);
  return s;
}

export function tick(prev: GameState, dtSec: number): GameState {
  if (prev.over) return { ...prev, events: [] };
  const dt = Math.max(0, Math.min(MAXDT, dtSec));
  const s = clone(prev);
  s.t -= dt;

  s.spawnIn -= dt * 1000;
  if (s.spawnIn <= 0 && s.msgs.length < MAXQUEUE) {
    const wasGuided = s.guided && s.spawned < GUIDED_COUNT;
    spawn(s);
    const p = 1 - s.t / ROUND;
    s.spawnIn = wasGuided ? GUIDED_INTERVAL : 1500 - 950 * p;
  }

  const alive: Msg[] = [];
  const expired: Msg[] = [];
  for (const m of s.msgs) {
    const left = m.left - dt;
    (left <= 0 ? expired : alive).push({ ...m, left });
  }
  s.msgs = alive;
  for (const m of expired) toDlq(s, m, 'timeout');

  if (s.incident && s.t <= s.incident.until) s.incident = null;

  const elapsed = ROUND - s.t;
  if (!s.guided && !s.incident && s.spawned >= GUIDED_COUNT && elapsed >= s.nextIncidentAt) {
    applyIncident(s, pickKind(rand(s)));
    s.nextIncidentAt = elapsed + nextIncidentDelay(rand(s));
  }

  finishIfNeeded(s);
  return s;
}

export function route(prev: GameState, service: MsgType, msgId?: number): GameState {
  if (prev.over || prev.msgs.length === 0) return { ...prev, events: [] };
  const m = msgId === undefined ? prev.msgs[0] : prev.msgs.find((x) => x.id === msgId);
  if (!m) return { ...prev, events: [] };
  const s = clone(prev);
  const down = s.incident?.kind === 'caido' && s.incident.service === service;
  if (down || m.type !== service) {
    toDlq(s, m, 'bad');
  } else {
    const pts = (m.hook ? 20 : 10) * multiplier(s.combo);
    s.score += pts;
    s.combo++;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.routed++;
    if (m.hook) s.hooks++;
    s.msgs = s.msgs.filter((x) => x.id !== m.id);
    s.events.push({ kind: 'ok', pts, msgId: m.id });
    if (m.left / m.ttl < 0.2) s.events.push({ kind: 'save', msgId: m.id });
    if (s.combo === 5) s.events.push({ kind: 'combo5' });
    if (s.combo === 10) s.events.push({ kind: 'combo10' });
  }
  finishIfNeeded(s);
  return s;
}
