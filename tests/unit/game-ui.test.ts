import { describe, expect, it, vi } from 'vitest';
import { createGame, tick } from '../../src/islands/game/engine';
import { defaultSave } from '../../src/islands/game/storage';
import { fmt, hintFor, isFirstGame, isTypingTarget, keyToService, progressText } from '../../src/islands/game/ui';
import { shareUrl, shareScore, shareText } from '../../src/islands/game/share';

describe('ui del juego', () => {
  it('fmt sustituye variables', () => {
    expect(fmt('a {x} b {y} {x}', { x: 1, y: 'z' })).toBe('a 1 b z 1');
  });

  it('teclas 1/2/3 siguen el orden visible de los servicios', () => {
    expect(keyToService(['pago', 'reserva', 'aviso'], '1')).toBe('pago');
    expect(keyToService(['aviso', 'pago', 'reserva'], '1')).toBe('aviso');
    expect(keyToService(['aviso', 'pago', 'reserva'], '3')).toBe('reserva');
    expect(keyToService(['pago', 'reserva', 'aviso'], '4')).toBeNull();
    expect(keyToService(['pago', 'reserva', 'aviso'], 'a')).toBeNull();
  });

  it('primera partida: sin récord ni logros', () => {
    expect(isFirstGame(defaultSave())).toBe(true);
    expect(isFirstGame({ ...defaultSave(), best: 10 })).toBe(false);
    expect(isFirstGame({ ...defaultSave(), unlocked: ['hola'] })).toBe(false);
  });

  it('pista solo para los 3 mensajes guiados, con ruta y tecla según el orden', () => {
    let s = createGame({ seed: 7, guided: true });
    expect(hintFor(s, true)).toBeNull(); // cola vacía
    while (s.msgs.length === 0) s = tick(s, 0.05);
    const m = s.msgs[0];
    const ruta = { pago: '/pagos', reserva: '/reservas', aviso: '/avisos' }[m.type];
    const tecla = s.order.indexOf(m.type) + 1;
    expect(hintFor(s, true)).toBe(`este va a ${ruta}, pulsa ${tecla}`);
    expect(hintFor(s, false)).toBeNull(); // partida no guiada
    expect(hintFor({ ...s, msgs: [{ ...m, id: 4 }] }, true)).toBeNull(); // ya no es guiado
    expect(hintFor({ ...s, over: true }, true)).toBeNull();
  });

  it('el foco en campos de texto no cuenta como juego', () => {
    const el = (tag: string, extra: Record<string, unknown> = {}) => ({ tagName: tag, isContentEditable: false, ...extra }) as unknown as EventTarget;
    expect(isTypingTarget(el('INPUT'))).toBe(true);
    expect(isTypingTarget(el('TEXTAREA'))).toBe(true);
    expect(isTypingTarget(el('SELECT'))).toBe(true);
    expect(isTypingTarget(el('DIV', { isContentEditable: true }))).toBe(true);
    expect(isTypingTarget(el('BUTTON'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it('progreso visible con tope en la meta', () => {
    const save = { ...defaultSave(), progress: { maxCombo: 7, maxHooks: 9, maxScore: 120 } };
    expect(progressText('racha', save)).toBe('racha máx.: 7/10');
    expect(progressText('hooks', save)).toBe('webhooks: 5/5');
    expect(progressText('mil', save)).toBe('puntos: 120/500');
    expect(progressText('hola', save)).toBeNull();
  });
});

describe('compartir', () => {
  const text = 'He sobrevivido a un turno de guardia de Carlos: 120 pts';

  it('texto y URL', () => {
    expect(shareText(120)).toBe(text);
    expect(shareUrl()).toBe('https://www.cvidal.dev');
  });

  it('usa navigator.share si existe', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await shareScore(120, { share, clipboard: { writeText } } as unknown as Navigator)).toBe('shared');
    expect(share).toHaveBeenCalledWith({ text, url: 'https://www.cvidal.dev' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('cancelar el diálogo de compartir no copia nada', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
    const writeText = vi.fn();
    expect(await shareScore(1, { share, clipboard: { writeText } } as unknown as Navigator)).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('sin Web Share copia texto + enlace', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareScore(120, { clipboard: { writeText } } as unknown as Navigator)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(`${text} — https://www.cvidal.dev`);
  });

  it('si falla el portapapeles devuelve failed', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    expect(await shareScore(120, { clipboard: { writeText } } as unknown as Navigator, null)).toBe('failed');
    expect(await shareScore(120, {} as Navigator, null)).toBe('failed');
  });
});

describe('settle: logros sobre el guardado', () => {
  const game = (o: object) => ({ ...createGame({ seed: 1, guided: false }), ...o });

  it('durante la partida desbloquea pero no toca el récord', async () => {
    const { settle } = await import('../../src/islands/game/ui');
    const r = settle({ ...defaultSave(), best: 50 }, game({ routed: 1, score: 80 }), false);
    expect(r.nuevos).toEqual(['hola']);
    expect(r.save.best).toBe(50);
    expect(r.save.progress.maxScore).toBe(80);
    const f = settle({ ...defaultSave(), best: 50 }, game({ routed: 1, score: 80, t: 0, over: true }), true);
    expect(f.save.best).toBe(80);
  });

  it('las gafas se ponen al desbloquear, pero respeta si el jugador se las quitó', async () => {
    const { settle } = await import('../../src/islands/game/ui');
    const first = settle(defaultSave(), game({ routed: 10, maxCombo: 10 }), false);
    expect(first.nuevos).toContain('racha');
    expect(first.save.shades).toBe(true);
    expect(first.cosmeticsChanged).toBe(true);
    const off = { ...first.save, shades: false };
    const again = settle(off, game({ routed: 12, maxCombo: 12 }), true);
    expect(again.save.shades).toBe(false);
    expect(again.cosmeticsChanged).toBe(false);
  });
});

describe('peor momento', () => {
  it('guarda la cola más larga y el segundo en que pasó', async () => {
    const { trackWorst } = await import('../../src/islands/game/ui');
    const g = createGame({ seed: 3, guided: false });
    const msg = (id: number) => ({ id, type: 'pago' as const, hook: false, ttl: 5, left: 5 });
    let w = trackWorst(null, g);
    expect(w).toEqual({ queue: 0, at: 0 });
    w = trackWorst(w, { ...g, t: 40.2, msgs: [msg(1), msg(2)] });
    expect(w).toEqual({ queue: 2, at: 4 });
    w = trackWorst(w, { ...g, t: 30, msgs: [msg(3), msg(4)] }); // empate: se queda el primero
    expect(w).toEqual({ queue: 2, at: 4 });
    w = trackWorst(w, { ...g, t: 12.7, msgs: [msg(5), msg(6), msg(7)] });
    expect(w).toEqual({ queue: 3, at: 32 });
    w = trackWorst(w, { ...g, t: 5, msgs: [] });
    expect(w).toEqual({ queue: 3, at: 32 });
  });

  it('texto del post-mortem', async () => {
    const { worstText } = await import('../../src/islands/game/ui');
    expect(worstText({ queue: 6, at: 31 })).toBe('6 en cola a los 31 s');
    expect(worstText({ queue: 1, at: 0 })).toBe('1 en cola a los 0 s');
  });
});
