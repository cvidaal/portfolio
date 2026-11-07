import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/proyectos/es';
describe('colección proyectos', () => {
  const files = readdirSync(dir);
  it('tres proyectos', () => {
    expect(files.sort()).toEqual(['acelerik-booking.mdx', 'bendita-burger.md', 'bot-pedidos-whatsapp.mdx']);
  });
  it('bendita-burger sin caso, otros con caso', () => {
    expect(readFileSync(join(dir, 'bendita-burger.md'), 'utf8')).toMatch(/caso: false/);
    expect(readFileSync(join(dir, 'acelerik-booking.mdx'), 'utf8')).toMatch(/caso: true/);
  });
  it('sin menciones prohibidas', () => {
    for (const f of files) {
      const s = readFileSync(join(dir, f), 'utf8');
      expect(s).not.toMatch(/Claude|Full ?Stack/i);
    }
  });
});
