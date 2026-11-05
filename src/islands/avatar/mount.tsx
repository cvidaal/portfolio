// Montaje diferido del avatar: este módulo (React + compositor) solo se descarga cuando hace falta.
import { createRoot } from 'react-dom/client';
import Avatar from './Avatar';
import { loadLayers } from './compositor';

export async function mountAvatar(slot: HTMLElement, opts: { auto: boolean }) {
  const layers = await loadLayers();
  const host = document.createElement('div');
  host.className = 'avatar-live';
  host.style.cssText = 'position:absolute;inset:0';
  slot.appendChild(host);
  createRoot(host).render(<Avatar layers={layers} auto={opts.auto} />);
}
