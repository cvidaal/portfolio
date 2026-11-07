import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES } from '../../src/lib/theme';

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const token = (name: string) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '';

describe('contraste del texto sobre el acento en los tres temas', () => {
  for (const [name, th] of Object.entries(THEMES)) {
    it(`${name}: texto pequeño (--on-accent) sobre el acento >= 4.5:1`, () => {
      expect(token('on-accent')).not.toBe('');
      expect(ratio(token('on-accent'), th.acc)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: texto grande (--bg) sobre el acento >= 3:1`, () => {
      expect(ratio(token('bg'), th.acc)).toBeGreaterThanOrEqual(3);
    });
  }
});
