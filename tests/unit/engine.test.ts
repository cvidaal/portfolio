import { describe, expect, test } from 'vitest';
import {
  createGame, tick, route, startIncident, ROUND, MAXQUEUE,
  type GameState, type Msg, type MsgType,
} from '../../src/islands/game/engine';
import { createRng } from '../../src/islands/game/rng';

const msg = (id: number, type: MsgType, over: Partial<Msg> = {}): Msg => ({
  id, type, hook: false, ttl: 6, left: 6, ...over,
});
const withMsgs = (msgs: Msg[], over: Partial<GameState> = {}): GameState => ({
  ...createGame({ seed: 7, guided: false }), msgs, ...over,
});

// Juega bien: cada paso enruta el mensaje más antiguo a su servicio (salvo si está caído).
function autoplay(s: GameState, secs: number, onStep?: (s: GameState) => void): GameState {
  for (let i = 0; i < Math.round(secs / 0.05) && !s.over; i++) {
    s = tick(s, 0.05);
    onStep?.(s);
    const m = s.msgs[0];
    if (m && !(s.incident?.kind === 'caido' && s.incident.service === m.type)) s = route(s, m.type);
  }
  return s;
}

describe('rng', () => {
  test('misma semilla, misma secuencia; semillas distintas divergen', () => {
    const a = createRng(42), b = createRng(42), c = createRng(43);
    const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()];
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('puntuación', () => {
  test('acierto suma y sube racha', () => {
    const s = route(withMsgs([msg(1, 'pago')]), 'pago');
    expect(s.score).toBe(10);
    expect(s.combo).toBe(1);
    expect(s.routed).toBe(1);
    expect(s.msgs).toHaveLength(0);
    expect(s.events).toEqual([{ kind: 'ok', pts: 10, msgId: 1 }]);
  });

  test('error va a dead letters y corta racha', () => {
    const s0 = withMsgs([msg(1, 'pago'), msg(2, 'aviso')], { combo: 3 });
    const s = route(s0, 'reserva');
    expect(s.dlq).toBe(1);
    expect(s.combo).toBe(0);
    expect(s.score).toBe(0);
    expect(s.msgs.map((m) => m.id)).toEqual([2]);
    expect(s.events).toEqual([{ kind: 'bad', msgId: 1 }]);
    expect(s0.dlq).toBe(0); // la entrada no se muta
    expect(s0.combo).toBe(3);
    expect(s0.msgs).toHaveLength(2);
  });

  test('multiplicador x2 tras 5 aciertos y tope x4', () => {
    let s = withMsgs([]);
    const pts: number[] = [];
    for (let i = 0; i < 17; i++) {
      s = { ...s, msgs: [msg(i + 1, 'pago')] };
      s = route(s, 'pago');
      pts.push(s.events[0].pts as number);
    }
    expect(pts.slice(0, 5)).toEqual([10, 10, 10, 10, 10]);
    expect(pts[5]).toBe(20);
    expect(pts[9]).toBe(20);
    expect(pts[10]).toBe(30);
    expect(pts[15]).toBe(40);
    expect(pts[16]).toBe(40); // tope x4
    expect(s.maxCombo).toBe(17);
  });

  test('webhook vale el doble', () => {
    const s = route(withMsgs([msg(1, 'aviso', { hook: true })]), 'aviso');
    expect(s.score).toBe(20);
    expect(s.hooks).toBe(1);
  });

  test('eventos de racha y de mensaje salvado', () => {
    let s = withMsgs([], { combo: 4 });
    s = route({ ...s, msgs: [msg(1, 'pago', { left: 1, ttl: 6 })] }, 'pago');
    expect(s.events.map((e) => e.kind)).toEqual(['ok', 'save', 'combo5']);
    s = route({ ...s, combo: 9, msgs: [msg(2, 'pago')] }, 'pago');
    expect(s.events.map((e) => e.kind)).toEqual(['ok', 'combo10']);
  });

  test('route con msgId elige ese mensaje; sin msgId, el más antiguo; sin mensajes, no-op', () => {
    const s0 = withMsgs([msg(1, 'pago'), msg(2, 'aviso')]);
    const a = route(s0, 'aviso', 2);
    expect(a.routed).toBe(1);
    expect(a.msgs.map((m) => m.id)).toEqual([1]);
    const b = route(s0, 'pago');
    expect(b.msgs.map((m) => m.id)).toEqual([2]);
    const empty = withMsgs([]);
    const e = route(empty, 'pago');
    expect(e).toEqual({ ...empty, events: [] });
    expect(route(s0, 'pago', 99)).toEqual({ ...s0, events: [] });
  });
});

describe('tiempo y fin de partida', () => {
  test('caducidad manda a dead letters con timeout', () => {
    const s0 = withMsgs([msg(1, 'pago', { left: 0.03, ttl: 6 })], { combo: 4, spawnIn: 99999 });
    const s = tick(s0, 0.05);
    expect(s.dlq).toBe(1);
    expect(s.combo).toBe(0);
    expect(s.msgs).toHaveLength(0);
    expect(s.events).toEqual([{ kind: 'timeout', msgId: 1 }]);
  });

  test('5 dead letters terminan la partida', () => {
    let s = withMsgs([]);
    for (let i = 0; i < 5; i++) {
      s = route({ ...s, msgs: [msg(i + 1, 'pago')] }, 'aviso');
    }
    expect(s.dlq).toBe(5);
    expect(s.over).toBe(true);
    expect(s.events.map((e) => e.kind)).toEqual(['bad', 'end']);
    expect(tick(s, 0.05)).toEqual({ ...s, events: [] });
    expect(route(s, 'pago')).toEqual({ ...s, events: [] });
  });

  test('45 s terminan la partida', () => {
    const s = autoplay(createGame({ seed: 3, guided: false }), ROUND + 1);
    expect(s.over).toBe(true);
    expect(s.t).toBe(0);
    expect(s.dlq).toBeLessThan(5);
    expect(s.routed).toBeGreaterThan(15);
  });

  test('la partida termina con evento end exactamente una vez', () => {
    let s = withMsgs([], { t: 0.04, spawnIn: 99999 });
    s = tick(s, 0.05);
    expect(s.over).toBe(true);
    expect(s.events).toEqual([{ kind: 'end' }]);
    expect(tick(s, 0.05).events).toEqual([]); // sin repetir el evento end
  });

  test('dt enorme se recorta: una pestaña oculta no vacía la cola', () => {
    let s = createGame({ seed: 1, guided: false });
    s = tick(s, 0.5);
    expect(s.t).toBeCloseTo(45 - 0.05, 2); // 0.5 se recorta a 0.05
    const before = s.msgs.length;
    s = tick(s, 30);
    expect(s.t).toBeCloseTo(45 - 0.05 - 0.05, 2);
    expect(s.dlq).toBe(0);
    expect(s.msgs.length).toBeGreaterThanOrEqual(before);
  });

  test('tick no muta el estado de entrada y es determinista por semilla', () => {
    const s0 = createGame({ seed: 5, guided: false });
    const snapshot = JSON.stringify(s0);
    const a = tick(s0, 0.05);
    expect(JSON.stringify(s0)).toBe(snapshot);
    expect(a).not.toBe(s0);
    const run = (seed: number) => autoplay(createGame({ seed, guided: false }), 20);
    expect(run(9)).toEqual(run(9));
    expect(run(9).msgs).not.toEqual(run(10).msgs);
  });

  test('events solo contiene los de la última llamada', () => {
    let s = route(withMsgs([msg(1, 'pago'), msg(2, 'pago')]), 'pago');
    expect(s.events).toHaveLength(1);
    s = tick(s, 0.05);
    expect(s.events).toEqual([]);
  });

  test('ritmo: aparecen mensajes y ttl baja con el tiempo', () => {
    const s0 = tick(createGame({ seed: 2, guided: false }), 0.05);
    expect(s0.msgs).toHaveLength(0); // primera aparición a los 300 ms
    let s = createGame({ seed: 2, guided: false });
    for (let i = 0; i < 8; i++) s = tick(s, 0.05);
    expect(s.msgs).toHaveLength(1);
    expect(s.msgs[0].ttl).toBeGreaterThan(6.4 * 0.7 - 0.01);
    expect(s.msgs[0].ttl).toBeLessThanOrEqual(6.5);
  });
});

describe('incidentes', () => {
  test('servicio caído rechaza mensajes', () => {
    const s0 = startIncident(withMsgs([]), 'caido');
    expect(s0.incident?.kind).toBe('caido');
    const svc = s0.incident?.service as MsgType;
    expect(svc).toBeDefined();
    expect(s0.events.map((e) => e.kind)).toEqual(['incident']);
    const s = route({ ...s0, msgs: [msg(1, svc)] }, svc);
    expect(s.dlq).toBe(1);
    expect(s.score).toBe(0);
    expect(s.events).toEqual([{ kind: 'bad', msgId: 1 }]);
    // otros servicios siguen funcionando
    const other = (['pago', 'reserva', 'aviso'] as MsgType[]).find((x) => x !== svc) as MsgType;
    const ok = route({ ...s0, msgs: [msg(2, other)] }, other);
    expect(ok.score).toBe(10);
  });

  test('el servicio caído se recupera pasados ~5 s', () => {
    let s = startIncident(withMsgs([], { spawnIn: 99999 }), 'caido');
    const svc = s.incident?.service as MsgType;
    for (let i = 0; i < 90; i++) s = tick(s, 0.05); // 4.5 s
    expect(s.incident?.kind).toBe('caido');
    for (let i = 0; i < 20; i++) s = tick(s, 0.05); // 5.5 s
    expect(s.incident).toBeNull();
    s = route({ ...s, msgs: [msg(1, svc)] }, svc);
    expect(s.score).toBe(10);
  });

  test('deploy cambia el orden de servicios', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s0 = createGame({ seed, guided: false });
      const s = startIncident(s0, 'deploy');
      expect(s.order).not.toEqual(s0.order);
      expect([...s.order].sort()).toEqual([...s0.order].sort());
      expect(s.incident?.kind).toBe('deploy');
    }
  });

  test('pico mete 5 mensajes de golpe y nunca supera la cola máxima', () => {
    const s = startIncident(withMsgs([]), 'pico');
    expect(s.msgs).toHaveLength(5);
    expect(new Set(s.msgs.map((m) => m.id)).size).toBe(5);
    const full = startIncident(withMsgs([msg(90, 'pago'), msg(91, 'pago'), msg(92, 'pago'), msg(93, 'pago'), msg(94, 'pago')]), 'pico');
    expect(full.msgs).toHaveLength(MAXQUEUE);
  });

  test('primer incidente tras ~15 s y después cada ~15 s, nunca antes', () => {
    const at: number[] = [];
    autoplay(createGame({ seed: 4, guided: false }), ROUND + 1, (s) => {
      if (s.events.some((e) => e.kind === 'incident')) at.push(ROUND - s.t);
    });
    expect(at.length).toBeGreaterThanOrEqual(1);
    expect(at[0]).toBeGreaterThanOrEqual(12.9);
    expect(at[0]).toBeLessThanOrEqual(17.1);
    if (at.length > 1) expect(at[1] - at[0]).toBeGreaterThanOrEqual(11.9);
  });

  test('modo guiado: 3 primeros mensajes con ttl 12 y sin incidentes', () => {
    let s = createGame({ seed: 8, guided: true });
    expect(s.guided).toBe(true);
    const seen: Msg[] = [];
    const kinds: string[] = [];
    for (let i = 0; i < 400 && seen.length < 4; i++) {
      s = tick(s, 0.05);
      for (const m of s.msgs) if (!seen.some((x) => x.id === m.id)) seen.push(m);
      for (const e of s.events) kinds.push(e.kind);
      if (seen.length === 3 && s.guided) throw new Error('guided debía terminar tras el tercer mensaje');
      if (seen.length < 4) {
        // sin mensajes irrelevantes: el jugador responde para que no caduquen
        if (s.msgs[0]) s = route(s, s.msgs[0].type);
      }
    }
    expect(seen.slice(0, 3).map((m) => m.ttl)).toEqual([12, 12, 12]);
    expect(seen.slice(0, 3).some((m) => m.hook)).toBe(false);
    expect(seen[3].ttl).toBeLessThan(12);
    expect(kinds).not.toContain('incident');
    expect(s.guided).toBe(false);
  });

  test('modo guiado: los mensajes llegan despacio', () => {
    let s = createGame({ seed: 8, guided: true });
    let first = -1, second = -1;
    for (let i = 0; i < 200; i++) {
      s = tick(s, 0.05);
      if (first < 0 && s.spawned >= 1) first = i;
      if (second < 0 && s.spawned >= 2) second = i;
    }
    expect((second - first) * 0.05).toBeGreaterThanOrEqual(2.9);
  });

  test('nunca más de 7 mensajes en cola', () => {
    let s = createGame({ seed: 11, guided: false });
    let max = 0;
    for (let i = 0; i < 20 * 20 && !s.over; i++) {
      s = tick(s, 0.05);
      max = Math.max(max, s.msgs.length);
      if (i % 40 === 0) s = route(s, s.msgs[0]?.type ?? 'pago'); // responde poco
      if (i === 300) s = startIncident(s, 'pico');
      max = Math.max(max, s.msgs.length);
    }
    expect(max).toBeLessThanOrEqual(MAXQUEUE);
    expect(max).toBeGreaterThanOrEqual(5);
  });
});

describe('llamadas sin efecto', () => {
  test('tras un ok, un route sin efecto devuelve events vacío', () => {
    const s = route(withMsgs([msg(1, 'pago')]), 'pago');
    expect(s.events).toHaveLength(1);
    const n = route(s, 'pago'); // cola vacía
    expect(n.events).toEqual([]);
    expect(n.score).toBe(s.score);
    expect(n.combo).toBe(s.combo);
    const u = route({ ...s, msgs: [msg(2, 'pago')] }, 'pago', 99); // msgId desconocido
    expect(u.events).toEqual([]);
    expect(u.msgs).toHaveLength(1);
  });
});
