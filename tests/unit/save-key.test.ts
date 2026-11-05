import { describe, it, expect, vi, afterEach } from 'vitest';
import { SAVE_KEY, readCosmetics } from '../../src/lib/save-key';

function stubStorage(value: string | null, throws = false) {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => { if (throws) throw new Error('blocked'); return k === SAVE_KEY ? value : null; },
  });
}
afterEach(() => { vi.unstubAllGlobals(); });

describe('save-key', () => {
  it('clave versionada', () => { expect(SAVE_KEY).toBe('pubsub-rush:v1'); });

  it('lee los cosméticos del Save del juego (forma de la Task 9)', () => {
    stubStorage(JSON.stringify({ best: 120, unlocked: ['racha'], theme: 'azul', shades: true, chain: false, progress: {} }));
    expect(readCosmetics()).toEqual({ shades: true, chain: false, theme: 'azul' });
  });

  it('null ante ausencia, JSON roto, forma inválida o storage bloqueado', () => {
    stubStorage(null); expect(readCosmetics()).toBeNull();
    stubStorage('{roto'); expect(readCosmetics()).toBeNull();
    stubStorage('null'); expect(readCosmetics()).toBeNull();
    stubStorage(JSON.stringify({ shades: 'si', chain: false, theme: 'rojo' })); expect(readCosmetics()).toBeNull();
    stubStorage(JSON.stringify({ shades: true, chain: false, theme: 'morado' })); expect(readCosmetics()).toBeNull();
    stubStorage('', true); expect(readCosmetics()).toBeNull();
    vi.unstubAllGlobals(); vi.stubGlobal('localStorage', undefined); expect(readCosmetics()).toBeNull();
  });
});
