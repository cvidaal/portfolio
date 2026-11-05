const btn = document.querySelector<HTMLButtonElement>('button.copy[data-email]');
const status = document.getElementById('copy-status');

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

btn?.addEventListener('click', async () => {
  const ok = await copy(btn.dataset.email ?? '');
  const label = btn.querySelector('.copy-txt');
  const original = label?.textContent ?? '';
  if (ok) {
    const done = btn.dataset.copied ?? original;
    if (label) label.textContent = done;
    if (status) status.textContent = done;
    setTimeout(() => {
      if (label) label.textContent = original;
      if (status) status.textContent = '';
    }, 2000);
  } else if (status) {
    status.textContent = btn.dataset.error ?? '';
    status.classList.remove('sr-only');
    status.classList.add('copy-err');
  }
});
