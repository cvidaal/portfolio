import { es } from './es';

export const locale = 'es' as const;

export function t(key: keyof typeof es): string {
  return es[key];
}
