import { describe, it, expect } from 'vitest';
import { POSES, step, lookOffset, LOOK_SAT } from '../../src/islands/avatar/poses';

describe('poses', () => {
  it('lookOffset: centro y saturación a 260 px', () => {
    expect(LOOK_SAT).toBe(260);
    expect(lookOffset(0, 0)).toEqual({ x: 0, y: 0 });
    expect(lookOffset(1000, 0).x).toBeCloseTo(1);
    expect(lookOffset(-1000, 0).x).toBeCloseTo(-1);
    expect(lookOffset(130, 0).x).toBeCloseTo(0.5);
    const d = lookOffset(300, 400);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(d.x).toBeCloseTo(0.6);
    expect(d.y).toBeCloseTo(0.8);
  });

  it('valores finales del prototipo v7', () => {
    expect(POSES.surprised.m).toEqual({ s: 5, o: 0, a: 0, w: 1.02 });
    expect(POSES.surprised.m.o).toBe(0);
    expect(POSES.smile.m.s).toBe(17);
    expect(POSES.grin.m).toEqual({ s: 18, o: 14, a: 0, w: 1.08 });
    expect(POSES.smirkL.m).toMatchObject({ s: 15, a: -1 });
    expect(POSES.smirkR.m).toMatchObject({ s: 15, a: 1 });
    expect(POSES.winkL.m.s).toBe(16);
    expect(POSES.winkR.m.s).toBe(16);
    expect(POSES.neutral).toEqual({ b: [{ y: 0, r: 0 }, { y: 0, r: 0 }], m: { s: 0, o: 0, a: 0, w: 1 } });
    // ninguna pose abre la boca salvo la risa
    for (const [name, p] of Object.entries(POSES)) if (name !== 'grin') expect(p.m.o).toBe(0);
  });

  it('step interpola exponencialmente sin mutar y k=1 salta', () => {
    const cur = POSES.neutral;
    const half = step(cur, POSES.grin, 0.5);
    expect(half.m.s).toBeCloseTo(9);
    expect(half.m.w).toBeCloseTo(1.04);
    expect(half.b[0].y).toBeCloseTo(-5);
    expect(cur.m.s).toBe(0);
    expect(step(cur, POSES.grin, 1)).toEqual(POSES.grin);
    expect(step(POSES.grin, POSES.grin, 0.12)).toEqual(POSES.grin);
  });
});
