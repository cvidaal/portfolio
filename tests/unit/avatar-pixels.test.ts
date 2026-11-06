import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { purpleness, luminance, ramp, floodBackground, largestComponent } from '../../scripts/avatar/pixels.mjs';

describe('pixels', () => {
  it('purpleness distingue línea y relleno', () => {
    expect(purpleness(59, 13, 165)).toBeGreaterThan(0.9);
    expect(purpleness(177, 223, 237)).toBe(0);
  });
  it('luminance del fondo es alta', () => {
    expect(luminance(242, 248, 253)).toBeGreaterThan(0.95);
    expect(luminance(0, 0, 0)).toBe(0);
  });
  it('ramp interpola y satura en los extremos', () => {
    const s = [[0, [0, 0, 0]], [1, [255, 255, 255]]];
    expect(ramp(s, 0.5)).toEqual([127.5, 127.5, 127.5]);
    expect(ramp(s, -1)).toEqual([0, 0, 0]);
    expect(ramp(s, 2)).toEqual([255, 255, 255]);
  });
  it('floodBackground no cruza un marco de línea', () => {
    const w = 5, h = 5;
    const L = new Float32Array(25).fill(1);
    const P = new Float32Array(25);
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (x === 1 || x === 3 || y === 1 || y === 3) P[y * w + x] = 1;
    const bg = floodBackground(L, P, w, h);
    expect(bg[0]).toBe(1);
    expect(bg[2 * w + 2]).toBe(0);
    expect(bg[1 * w + 1]).toBe(0);
  });
  it('largestComponent devuelve el componente mayor de la caja', () => {
    const w = 10;
    const P = new Float32Array(100);
    for (const i of [11, 12, 13]) P[i] = 1;
    P[55] = 1;
    const c = largestComponent(P, [0, 0, 10, 10], 0.5, w);
    expect([...c].sort((a, b) => a - b)).toEqual([11, 12, 13]);
    expect(largestComponent(P, [6, 6, 10, 10], 0.5, w)).toEqual([]);
  });
});

describe('public/avatar/layers.json', () => {
  const dir = join(process.cwd(), 'public/avatar');
  it('existe, parsea y todos los sprites existen', () => {
    const file = join(dir, 'layers.json');
    expect(existsSync(file)).toBe(true);
    const L = JSON.parse(readFileSync(file, 'utf8'));
    expect(L.size).toBe(1254);
    expect(L.eyes).toHaveLength(2);
    expect(L.brows).toHaveLength(2);
    const files = [L.base, L.static, L.eyes[0].lid.src, L.eyes[1].lid.src, L.brows[0].sprite.src, L.brows[1].sprite.src, L.lips.upper.src, L.lips.lower.src];
    for (const f of files) expect(existsSync(join(dir, f)), f).toBe(true);
    expect(L.lips.mcx).toBe(598);
    expect(Object.keys(L.lips.upBot).length).toBeGreaterThan(50);
  });
});
