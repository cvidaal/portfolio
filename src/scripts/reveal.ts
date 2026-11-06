// Aparición de los .reveal al entrar en pantalla (opacidad + 16 px, una sola vez).
// El <head> solo añade html.js-reveal si hay IntersectionObserver y no se pide movimiento reducido;
// sin esa clase el CSS no oculta nada y este script no hace nada.
const root = document.documentElement;
const STAGGER_MS = 70;
const MAX_STAGGER = 4;

if (root.classList.contains('js-reveal')) {
  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        // los que entran a la vez (una fila de tarjetas) salen escalonados
        el.style.setProperty('--reveal-delay', `${Math.min(n++, MAX_STAGGER) * STAGGER_MS}ms`);
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  (window as Window & { __reveal?: boolean }).__reveal = true;
}
