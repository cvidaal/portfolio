import { describe, expect, it } from 'vitest';
import { isPlaceholder, showPlaceholders } from '../../src/lib/placeholder';

describe('placeholder', () => {
  it('detecta placeholders', () => {
    expect(isPlaceholder('[PLACEHOLDER: texto de Carlos]')).toBe(true);
    expect(isPlaceholder('[PLACEHOLDER texto de Carlos]')).toBe(true);
    expect(isPlaceholder('Go, PostgreSQL')).toBe(false);
  });
  it('showPlaceholders es booleano', () => {
    expect(typeof showPlaceholders).toBe('boolean');
  });
});
