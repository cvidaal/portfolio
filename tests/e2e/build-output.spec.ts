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
