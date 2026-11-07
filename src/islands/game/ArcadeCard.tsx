// Entrada al juego: "máquina arcade" bajo los CTA del hero (spec it2 §2).
// Toda la tarjeta es el botón #play-game (abre el tablero); la pegatina LOGROS es un botón hermano
// (no anidado) que abre el panel de logros sin abrir el juego.
import { t } from '../../i18n';
import type { MsgType } from './engine';
import { fmt, ruta } from './ui';

const MSGS: [MsgType, string][] = [['pago', 'sq'], ['reserva', 'circle'], ['aviso', 'tri']];

interface Props {
  /** Logros desbloqueados y total. */
  unlocked: number;
  total: number;
  /** Hidratado: hasta entonces la tarjeta ocupa su hueco pero no se ve ni se puede pulsar. */
  ready: boolean;
  onPlay: () => void;
  /** Recibe el disparador: al cerrar el panel, el foco vuelve a él. */
  onLogros: (trigger: HTMLElement) => void;
}

export default function ArcadeCard({ unlocked, total, ready, onPlay, onLogros }: Props) {
  return (
    <div className={`arcade mono${ready ? ' ready' : ''}`}>
      <div className="arcade-play">
        <span className="screen" aria-hidden="true">
          {MSGS.map(([type, shape]) => (
            <span key={type} className="m"><i className={`shape ${shape}`} />{fmt(t('juego.msg'), { ruta: ruta(type) })}</span>
          ))}
        </span>
        <span className="info">
          {/* El boton envuelve solo el titulo y se estira sobre la tarjeta: su nombre accesible (corto) contiene el texto visible. */}
          <button type="button" className="tt" id="play-game" aria-label={t('arcade.jugar')} onClick={onPlay}>{t('arcade.titulo')}</button>
          <span className="sub">{t('arcade.sub')}</span>
          <span className="start" aria-hidden="true">{t('arcade.start')}</span>
        </span>
      </div>
      <button type="button" className="chip" aria-haspopup="dialog" onClick={(e) => onLogros(e.currentTarget)}>
        {fmt(t('arcade.logros'), { n: unlocked, total })}
      </button>
      {/* Acceso evidente a los logros sin jugar: la pegatina sola pasaba desapercibida. */}
      <button type="button" className="ver-logros" aria-haspopup="dialog" onClick={(e) => onLogros(e.currentTarget)}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M4 2h8v3a4 4 0 0 1-8 0zM4 3H2v1a2 2 0 0 0 2 2M12 3h2v1a2 2 0 0 1-2 2M8 9v3M5.5 14h5" /></svg>
        {fmt(t('arcade.verLogros'), { n: unlocked, total })}
      </button>
    </div>
  );
}

