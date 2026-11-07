// Terminal de contacto: "POST /contacto" se escribe letra a letra al entrar en pantalla y después
// aparece la respuesta (200 OK + JSON). Solo si el <head> activó html.js-reveal (hay IntersectionObserver
// y no se pide movimiento reducido); si no, el bloque se ve completo desde el principio.
const MS_POR_LETRA = 45;

const term = document.querySelector<HTMLElement>('.term');
const cmd = term?.querySelector<HTMLElement>('.cmd');

if (term && cmd && document.documentElement.classList.contains('js-reveal')) {
  const texto = cmd.textContent ?? '';
  cmd.textContent = '';
  term.classList.add('typing');
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');
  cmd.after(caret);

  const escribir = () => {
    let i = 0;
    const paso = () => {
      cmd.textContent = texto.slice(0, ++i);
      if (i < texto.length) window.setTimeout(paso, MS_POR_LETRA);
      else window.setTimeout(() => { caret.remove(); term.classList.remove('typing'); term.classList.add('done'); }, 250);
    };
    window.setTimeout(paso, 300);
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); escribir(); }
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(term);
}

export {};
