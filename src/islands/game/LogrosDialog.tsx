// Panel de logros (spec it2 §2): diálogo modal nativo en la capa superior (el resto de la página queda
// inerte), foco atrapado, Escape cierra y el foco vuelve al disparador. Se monta en <body> porque el
// texto del hero (donde vive la tarjeta) se vuelve inert mientras se juega.
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../i18n';

interface Props {
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function LogrosDialog({ onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', ''); // navegadores sin <dialog> modal: al menos se ve
    }
    closeBtn.current?.focus();
    return () => { if (d.open) d.close(); };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'Escape') {
      // el Escape es solo del panel: ni el tablero (si está abierto debajo) ni el cancel nativo
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const inside = ref.current?.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  }

  return createPortal(
    <dialog
      ref={ref}
      className="logros mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logros-titulo"
      onKeyDown={onKeyDown}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClose={onClose /* cierre nativo que no pase por aquí: el estado se pone al día */}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="logros-in">
        <div className="logros-head">
          <h2 id="logros-titulo">{t('logros.panel.titulo')}</h2>
          <button type="button" className="v-btn logros-close" ref={closeBtn} onClick={onClose}>
            {t('logros.panel.cerrar')} <kbd aria-hidden="true">Esc</kbd>
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
