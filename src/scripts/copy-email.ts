export {};

const btn = document.querySelector<HTMLButtonElement>('button.copy[data-email]');
const status = document.getElementById('copy-status');
const label = btn?.querySelector('.copy-txt') ?? null;
// Etiqueta original, guardada una sola vez: un segundo clic durante los 2 s no debe capturar "Email copiado".
const original = label?.textContent ?? '';
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    let ta: HTMLTextAreaElement | undefined;
    try {
      ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      ta?.remove();
    }
  }
}

btn?.addEventListener('click', async () => {
  const ok = await copy(btn.dataset.email ?? '');
  clearTimeout(timer);
  if (ok) {
    const done = btn.dataset.copied ?? original;
    if (label) label.textContent = done;
    if (status) status.textContent = done;
    timer = setTimeout(() => {
      if (label) label.textContent = original;
      if (status) status.textContent = '';
    }, 2000);
  } else if (status) {
    status.textContent = btn.dataset.error ?? '';
    status.classList.remove('sr-only');
    status.classList.add('copy-err');
  }
});
