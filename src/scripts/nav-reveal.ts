/** Muestra la barra fija al salir del hero y la oculta (con `inert`) mientras el hero está en pantalla.
 *  Mejora progresiva: el script inline de Nav.astro añade html.nav-hidden; si este módulo no llega, vuelve a mostrarse. */
export function initNavReveal(doc: Document = document): void {
  const hero = doc.getElementById('hero');
  const nav = doc.querySelector<HTMLElement>('header.nav');
  const root = doc.documentElement;
  if (!nav || !hero || typeof IntersectionObserver === 'undefined') {
    root.classList.remove('nav-hidden');
    nav?.removeAttribute('inert');
    return;
  }
  (window as unknown as { __navReveal?: boolean }).__navReveal = true;
  const set = (oculta: boolean) => {
    root.classList.toggle('nav-hidden', oculta);
    nav.toggleAttribute('inert', oculta);
  };
  // El margen superior descuenta la altura de la barra: aparece cuando el hero queda bajo ella.
  new IntersectionObserver((e) => set(e[e.length - 1].isIntersecting), { rootMargin: '-52px 0px 0px 0px' }).observe(hero);
}

if (typeof document !== 'undefined') initNavReveal();
