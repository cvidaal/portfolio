const btn = document.querySelector<HTMLButtonElement>('button.copy[data-email]');
const status = document.getElementById('copy-status');

btn?.addEventListener('click', async () => {
  const email = btn.dataset.email ?? '';
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = email;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const label = btn.querySelector('.copy-txt');
  const original = label?.textContent ?? '';
  const done = btn.dataset.copied ?? original;
  if (label) label.textContent = done;
  if (status) status.textContent = done;
  setTimeout(() => {
    if (label) label.textContent = original;
  }, 2000);
});
