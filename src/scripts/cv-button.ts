// Botones de CV ([data-cv]): al pulsar aparece un "GET /cv → 200 OK" efímero y, si el avatar está montado,
// guiña (el botón del hero ya lo hace por su cuenta). La descarga nunca se bloquea.
import { emit } from '../lib/bus';

const DURACION = 1400;

document.querySelectorAll<HTMLAnchorElement>('a[data-cv]').forEach((a) => {
  a.addEventListener('click', () => {
    a.querySelector('.cv-toast')?.remove();
    const toast = document.createElement('span');
    toast.className = a.dataset.cvToast === 'abajo' ? 'cv-toast abajo' : 'cv-toast';
    toast.setAttribute('aria-hidden', 'true');
    toast.textContent = a.dataset.ok ?? '';
    a.appendChild(toast);
    window.setTimeout(() => toast.remove(), DURACION);
    if (a.id !== 'cta-cv') emit('avatar:wink');
  });
});

export {};
