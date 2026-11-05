import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MCX, MHALF, OPEN_HALF, dyUp, openAt, dyLo, mapX } from '../../src/islands/avatar/mouth';
import { POSES } from '../../src/islands/avatar/poses';

describe('mouth', () => {
  it('constantes coinciden con layers.json', () => {
    const layers = JSON.parse(readFileSync('public/avatar/layers.json', 'utf8'));
    expect(MCX).toBe(598);
    expect(MHALF).toBe(92);
    expect(OPEN_HALF).toBe(72);
    expect(layers.lips.mcx).toBe(MCX);
    expect(layers.lips.mhalf).toBe(MHALF);
  });

  it('dyUp: centro quieto, comisuras suben, mueca de un lado', () => {
    expect(dyUp(MCX, POSES.smile.m)).toBe(0);
    expect(dyUp(MCX + 92, POSES.smile.m)).toBeLessThan(0);
    expect(dyUp(MCX + 92, POSES.smile.m)).toBeCloseTo(-17);
    expect(dyUp(MCX - 92, POSES.smirkR.m)).toBe(0);
    expect(dyUp(MCX + 92, POSES.smirkR.m)).toBeCloseTo(-30);
    expect(dyUp(MCX + 92, POSES.smirkL.m)).toBe(0);
    // fuera del semiancho satura
    expect(dyUp(MCX + 500, POSES.smile.m)).toBeCloseTo(dyUp(MCX + 92, POSES.smile.m));
  });

  it('openAt: máxima en el centro, cero fuera de OPEN_HALF', () => {
    expect(openAt(MCX, POSES.grin.m)).toBe(POSES.grin.m.o);
    expect(openAt(MCX + OPEN_HALF, POSES.grin.m)).toBe(0);
    expect(openAt(MCX + 200, POSES.grin.m)).toBe(0);
    expect(openAt(MCX, POSES.surprised.m)).toBe(0);
  });

  it('dyLo sigue al labio superior al 55 % más la apertura', () => {
    const m = POSES.grin.m;
    expect(dyLo(MCX, m)).toBeCloseTo(14);
    expect(dyLo(MCX + 92, m)).toBeCloseTo(dyUp(MCX + 92, m) * 0.55);
  });

  it('mapX ensancha alrededor del centro', () => {
    expect(mapX(MCX, POSES.grin.m)).toBe(MCX);
    expect(mapX(MCX + 100, POSES.grin.m)).toBeCloseTo(MCX + 108);
  });
});
