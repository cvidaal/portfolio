// PRNG sembrado (mulberry32). `step` es puro: devuelve el valor y el nuevo estado,
// para que el motor guarde el estado dentro de GameState sin mutar nada.
export function step(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

export function createRng(seed: number): () => number {
  let st = seed >>> 0;
  return () => {
    const [v, n] = step(st);
    st = n;
    return v;
  };
}
