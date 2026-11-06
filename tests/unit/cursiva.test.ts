import { describe, expect, it } from 'vitest';
import { cursiva } from '../../src/lib/cursiva';

describe('cursiva', () => {
  it('separa los trozos entre asteriscos', () => {
    expect(cursiva('a *b* c')).toEqual([
      { texto: 'a ', em: false }, { texto: 'b', em: true }, { texto: ' c', em: false },
    ]);
  });
  it('sin asteriscos, un solo trozo', () => {
    expect(cursiva('hola')).toEqual([{ texto: 'hola', em: false }]);
  });
});
