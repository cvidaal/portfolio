import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

test('el build de producción no contiene [PLACEHOLDER', () => {
  const files = htmlFiles('dist');
  expect(files.length).toBeGreaterThan(0);
  const offenders = files.filter((f) => readFileSync(f, 'utf8').includes('[PLACEHOLDER'));
  expect(offenders).toEqual([]);
});

test('los carteles de la home se numeran de forma consecutiva desde 01', () => {
  const html = readFileSync(join('dist', 'index.html'), 'utf8');
  const nums = [...html.matchAll(/class="lbl mono"[^>]*>\s*\/\/\s*(\d+)/g)].map((m) => m[1]);
  expect(nums.length).toBeGreaterThan(1);
  expect(nums).toEqual(nums.map((_, i) => String(i + 1).padStart(2, '0')));
});

test('og:image pesa menos de 300 KB (WhatsApp descarta las mayores)', () => {
  const html = readFileSync(join('dist', 'index.html'), 'utf8');
  const m = html.match(/property="og:image" content="https:\/\/www\.cvidal\.dev(\/[^"]+)"/);
  expect(m).not.toBeNull();
  expect(statSync(join('dist', m![1])).size).toBeLessThan(300 * 1024);
});
