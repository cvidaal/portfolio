/** Marca en el índice lateral la sección del caso que se está leyendo. Mejora progresiva: sin JS el índice sigue siendo una lista de enlaces. */
export function initTocActive(root: ParentNode = document): void {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('nav.toc a[href^="#"]'));
  if (!links.length || typeof IntersectionObserver === 'undefined') return;
  const porId = new Map<string, HTMLAnchorElement>();
  for (const a of links) porId.set(decodeURIComponent(a.hash.slice(1)), a);
  const visibles = new Set<string>();

  const marcar = (id: string | undefined) => {
    for (const [k, a] of porId) {
      if (k === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };

  const orden = Array.from(porId.keys());
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) (e.isIntersecting ? visibles.add(e.target.id) : visibles.delete(e.target.id));
      // La primera sección visible (en orden de lectura) es la activa.
      const activa = orden.find((id) => visibles.has(id));
      if (activa) marcar(activa);
    },
    { rootMargin: '-20% 0px -60% 0px' },
  );
  for (const id of orden) {
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (el) io.observe(el);
  }
}

if (typeof document !== 'undefined') initTocActive();
