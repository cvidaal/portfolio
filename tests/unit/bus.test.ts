import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.stubGlobal('window', new EventTarget()); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('bus', () => {
  it('emit entrega el detail como CustomEvent en window y on devuelve unsubscribe', async () => {
    const { emit, on } = await import('../../src/lib/bus');
    const seen: unknown[] = [];
    const off = on('avatar:pose', (d) => seen.push(d));
    const raw: string[] = [];
    window.addEventListener('avatar:pose', (e) => raw.push((e as CustomEvent).type));
    emit('avatar:pose', { name: 'grin', ms: 900 });
    expect(seen).toEqual([{ name: 'grin', ms: 900 }]);
    expect(raw).toEqual(['avatar:pose']);
    off();
    emit('avatar:pose', { name: 'smile', ms: 100 });
    expect(seen).toHaveLength(1);
  });

  it('eventos sin detail y look null', async () => {
    const { emit, on } = await import('../../src/lib/bus');
    let winks = 0; let opened = 0; const looks: unknown[] = [];
    on('avatar:wink', () => winks++);
    on('game:open', () => opened++);
    on('avatar:look', (d) => looks.push(d));
    emit('avatar:wink'); emit('game:open');
    emit('avatar:look', { x: 10, y: 20 }); emit('avatar:look', null);
    expect(winks).toBe(1);
    expect(opened).toBe(1);
    expect(looks).toEqual([{ x: 10, y: 20 }, null]);
  });
});
