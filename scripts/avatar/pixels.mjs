// Lógica de píxeles pura (sin sharp) portada del prototipo hero-avatar-y-juego.html.
export const W = 1254;

export const purpleness = (r, g, b) => Math.max(0, Math.min(1, (b - g - 40) / 90));
export const luminance = (r, g, b) => (r + g + b) / 765;

export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// stops: [[l, [r,g,b]], ...] ordenados por l.
export function ramp(stops, l) {
  if (l <= stops[0][0]) return stops[0][1];
  for (let k = 0; k < stops.length - 1; k++) {
    const [l0, c0] = stops[k], [l1, c1] = stops[k + 1];
    if (l <= l1) return lerp(c0, c1, (l - l0) / (l1 - l0));
  }
  return stops[stops.length - 1][1];
}

// Fondo = píxeles claros y no "línea" conectados con el borde de la imagen.
export function floodBackground(L, P, w, h) {
  const n = w * h, bg = new Uint8Array(n), stk = [];
  const pass = (i) => P[i] < 0.35 && L[i] > 0.85;
  for (let x = 0; x < w; x++) stk.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stk.push(y * w, y * w + w - 1);
  while (stk.length) {
    const i = stk.pop();
    if (bg[i] || !pass(i)) continue;
    bg[i] = 1;
    const x = i % w;
    if (x > 0) stk.push(i - 1);
    if (x < w - 1) stk.push(i + 1);
    if (i >= w) stk.push(i - w);
    if (i < n - w) stk.push(i + w);
  }
  return bg;
}

// Componentes 4-conexos con P > th dentro de box [x0,y0,x1,y1) (x1,y1 exclusivos), por tamaño descendente.
export function components(P, box, th, w = W) {
  const [x0, y0, x1, y1] = box;
  const seen = new Uint8Array(P.length), out = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = y * w + x;
    if (seen[i] || P[i] <= th) continue;
    const px = [i], st = [i];
    seen[i] = 1;
    while (st.length) {
      const j = st.pop();
      for (const k of [j - 1, j + 1, j - w, j + w]) {
        const kx = k % w, ky = (k / w) | 0;
        if (kx < x0 || kx >= x1 || ky < y0 || ky >= y1 || seen[k] || P[k] <= th) continue;
        seen[k] = 1; st.push(k); px.push(k);
      }
    }
    let sy = 0;
    for (const k of px) sy += (k / w) | 0;
    out.push({ px, cy: sy / px.length });
  }
  return out.sort((a, b) => b.px.length - a.px.length);
}

export function largestComponent(P, box, threshold, w = W) {
  const c = components(P, box, threshold, w);
  return c.length ? c[0].px : [];
}

// Dilata 3 px, pero solo sobre píxeles con algo de tinta (P > 0.06).
export function dilate(core, P, w = W) {
  const m = new Uint8Array(P.length);
  for (const i of core) {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const k = i + dy * w + dx;
      if (P[k] > 0.06) m[k] = 1;
    }
    m[i] = 1;
  }
  return m;
}
