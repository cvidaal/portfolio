import { describe, it, expect, vi, afterEach } from 'vitest';
import { createGame, type GameState } from '../../src/islands/game/engine';
import { ACHIEVEMENTS, evaluate, type Save } from '../../src/islands/game/achievements';
import { loadSave, persist } from '../../src/islands/game/storage';
import { SAVE_KEY, readCosmetics } from '../../src/lib/save-key';
import { t } from '../../src/i18n';

const base = (): Save => ({
  best: 0, unlocked: [], theme: 'rojo', shades: false, chain: false,
  progress: { maxCombo: 0, maxHooks: 0, maxScore: 0 },
});
const game = (o: Partial<GameState> = {}): GameState => ({ ...createGame({ seed: 1, guided: false }), ...o });

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
  });
  return m;
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('evaluate', () => {
  it('hola: primer acierto', () => {
    expect(evaluate(base(), game(), false).nuevos).toEqual([]);
    expect(evaluate(base(), game({ routed: 1 }), false).nuevos).toEqual(['hola']);
  });
  it('racha: combo >= 10 activa shades y no cambia el tema', () => {
    expect(evaluate(base(), game({ maxCombo: 9 }), false).nuevos).not.toContain('racha');
    const r = evaluate(base(), game({ maxCombo: 10, combo: 10, routed: 10 }), false);
    expect(r.nuevos).toContain('racha');
    expect(r.save.shades).toBe(true);
    expect(r.save.theme).toBe('rojo');
  });
  it('hooks: 5 webhooks en un turno activan chain', () => {
    expect(evaluate(base(), game({ hooks: 4 }), false).nuevos).not.toContain('hooks');
    const r = evaluate(base(), game({ hooks: 5 }), false);
    expect(r.nuevos).toContain('hooks');
    expect(r.save.chain).toBe(true);
  });
  it('mil: score >= 500', () => {
    expect(evaluate(base(), game({ score: 499 }), false).nuevos).not.toContain('mil');
    expect(evaluate(base(), game({ score: 500 }), false).nuevos).toContain('mil');
  });
  it('cero: solo al final, por tiempo, dlq 0 y routed >= 12', () => {
    const ok = game({ t: 0, over: true, dlq: 0, routed: 12 });
    expect(evaluate(base(), ok, true).nuevos).toContain('cero');
    expect(evaluate(base(), ok, false).nuevos).not.toContain('cero');
    expect(evaluate(base(), game({ t: 0, over: true, dlq: 0, routed: 11 }), true).nuevos).not.toContain('cero');
    expect(evaluate(base(), game({ t: 0, over: true, dlq: 1, routed: 20 }), true).nuevos).not.toContain('cero');
  });
  it('cero: no se concede si el turno acabó por 5 dead letters', () => {
    const dead = game({ t: 20, over: true, dlq: 5, routed: 20 });
    expect(evaluate(base(), dead, true).nuevos).not.toContain('cero');
    // un turno que no llegó a t<=0 no cuenta
    expect(evaluate(base(), game({ t: 10, over: true, dlq: 0, routed: 20 }), true).nuevos).not.toContain('cero');
  });
  it('secreto: solo con racha, hooks, cero y mil', () => {
    const three = { ...base(), unlocked: ['racha', 'hooks', 'cero'] as Save['unlocked'] };
    expect(evaluate(three, game({ score: 0 }), false).nuevos).not.toContain('secreto');
    const four = { ...base(), unlocked: ['racha', 'hooks', 'cero', 'mil'] as Save['unlocked'] };
    expect(evaluate(four, game(), false).nuevos).toEqual(['secreto']);
    // en la misma evaluación en que se completa el cuarto
    const r = evaluate({ ...base(), unlocked: ['racha', 'hooks', 'cero'] }, game({ score: 500 }), false);
    expect(r.nuevos).toEqual(expect.arrayContaining(['mil', 'secreto']));
  });
  it('no repite logros ya desbloqueados y es idempotente', () => {
    const g = game({ routed: 3 });
    const a = evaluate(base(), g, false);
    const b = evaluate(a.save, g, false);
    expect(b.nuevos).toEqual([]);
    expect(b.save.unlocked).toEqual(a.save.unlocked);
  });
  it('es pura: no muta entradas', () => {
    const s = base(); const g = game({ routed: 3, maxCombo: 10, score: 600 });
    const sj = JSON.stringify(s); const gj = JSON.stringify(g);
    evaluate(s, g, true);
    expect(JSON.stringify(s)).toBe(sj);
    expect(JSON.stringify(g)).toBe(gj);
  });
  it('progress guarda los máximos y best la mejor puntuación', () => {
    const s = { ...base(), best: 300, progress: { maxCombo: 7, maxHooks: 3, maxScore: 300 } };
    const lower = evaluate(s, game({ maxCombo: 4, hooks: 1, score: 100 }), false).save;
    expect(lower.progress).toEqual({ maxCombo: 7, maxHooks: 3, maxScore: 300 });
    expect(lower.best).toBe(300);
    const higher = evaluate(s, game({ maxCombo: 8, hooks: 4, score: 450 }), false).save;
    expect(higher.progress).toEqual({ maxCombo: 8, maxHooks: 4, maxScore: 450 });
    expect(higher.best).toBe(450);
  });
});

describe('ACHIEVEMENTS', () => {
  it('seis logros con textos de i18n y metas', () => {
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual(['hola', 'racha', 'hooks', 'cero', 'mil', 'secreto']);
    const by = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
    expect(by.racha.meta).toBe(10);
    expect(by.hooks.meta).toBe(5);
    expect(by.mil.meta).toBe(500);
    expect(by.hola.nombre).toBe('Hola, mundo');
    expect(by.racha.nombre).toBe('En racha');
    expect(by.hooks.nombre).toBe('Webhook hunter');
    expect(by.cero.nombre).toBe('Cero fallos');
    expect(by.mil.nombre).toBe('Alta carga');
    expect(by.secreto.nombre).toBe('Lo has visto todo');
    expect(by.racha.recompensa).toMatch(/gafas/i);
    expect(by.hooks.recompensa).toMatch(/cadenas/i);
    expect(by.cero.recompensa).toMatch(/tinta azul/i);
    expect(by.mil.recompensa).toMatch(/verde terminal/i);
    expect(t('logros.racha.nombre')).toBe('En racha');
  });
  it('el secreto no revela la nota', () => {
    const s = ACHIEVEMENTS.find((a) => a.id === 'secreto')!;
    expect(`${s.nombre} ${s.desc} ${s.recompensa ?? ''}`).not.toMatch(/PLACEHOLDER/);
  });
});

describe('storage', () => {
  it('sin nada guardado devuelve los valores por defecto', () => {
    memStorage();
    expect(loadSave()).toEqual(base());
  });
  it('persist + loadSave hacen ida y vuelta', () => {
    memStorage();
    const s: Save = { best: 640, unlocked: ['hola', 'racha'], theme: 'verde', shades: true, chain: false,
      progress: { maxCombo: 12, maxHooks: 2, maxScore: 640 } };
    persist(s);
    expect(loadSave()).toEqual(s);
  });
  it('un Save escrito por persist lo lee readCosmetics', () => {
    const m = memStorage();
    persist({ ...base(), theme: 'azul', shades: true, chain: true });
    expect(m.has(SAVE_KEY)).toBe(true);
    expect(readCosmetics()).toEqual({ shades: true, chain: true, theme: 'azul' });
  });
  it('JSON roto o no objeto: valores por defecto', () => {
    for (const raw of ['{roto', 'null', '[1,2]', '42']) {
      memStorage({ [SAVE_KEY]: raw });
      expect(loadSave()).toEqual(base());
    }
  });
  it('valida cada campo y cae al valor por defecto solo en el inválido', () => {
    memStorage({ [SAVE_KEY]: JSON.stringify({
      best: -5, unlocked: ['hola', 'inventado', 'hola', 7, 'mil'], theme: 'toString', shades: 'si', chain: true,
      progress: { maxCombo: null, maxHooks: 'x', maxScore: 90 },
    }) });
    const s = loadSave();
    expect(s.best).toBe(0);
    expect(s.unlocked).toEqual(['hola', 'mil']);
    expect(s.theme).toBe('rojo');
    expect(s.shades).toBe(false);
    expect(s.chain).toBe(true);
    expect(s.progress).toEqual({ maxCombo: 0, maxHooks: 0, maxScore: 90 });
  });
  it('tema fuera de la lista (incl. propiedades heredadas) cae a rojo', () => {
    for (const th of ['__proto__', 'constructor', 'morado', 3, null]) {
      memStorage({ [SAVE_KEY]: JSON.stringify({ theme: th }) });
      expect(loadSave().theme).toBe('rojo');
    }
    memStorage({ [SAVE_KEY]: JSON.stringify({ theme: 'azul' }) });
    expect(loadSave().theme).toBe('azul');
  });
  it('localStorage que lanza no rompe nada', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    });
    const s = loadSave(); expect(s.unlocked).toEqual([]); expect(() => persist(s)).not.toThrow();
  });
  it('sin localStorage definido tampoco lanza', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadSave()).toEqual(base());
    expect(() => persist(base())).not.toThrow();
  });
});
