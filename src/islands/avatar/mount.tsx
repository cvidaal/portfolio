// Montaje diferido del avatar: este módulo (React + compositor) solo se descarga cuando hace falta.
import { createRoot } from 'react-dom/client';
import Avatar from './Avatar';
import '@fontsource/jetbrains-mono/800.css'; // chapa "200" de la cadena (solo declara la fuente; se descarga al usarla)
import { loadLayers } from './compositor';
import { drawAccessories } from './cosmetics';

export async function mountAvatar(slot: HTMLElement, opts: { auto: boolean }) {
  const layers = await loadLayers();
  const host = document.createElement('div');
  host.className = 'avatar-live';
  host.style.cssText = 'position:absolute;inset:0';
  slot.appendChild(host);
  createRoot(host).render(<Avatar layers={layers} auto={opts.auto} accessories={drawAccessories} />);
}
