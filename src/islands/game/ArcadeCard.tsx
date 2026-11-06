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
      <button type="button" className="arcade-play" id="play-game" onClick={onPlay}>
        <span className="screen" aria-hidden="true">
          {MSGS.map(([type, shape]) => (
            <span key={type} className="m"><i className={`shape ${shape}`} />{fmt(t('juego.msg'), { ruta: ruta(type) })}</span>
          ))}
        </span>
        <span className="info">
          <span className="tt">{t('arcade.titulo')}</span>
          <span className="sub">{t('arcade.sub')}</span>
          <span className="start">{t('arcade.start')}</span>
        </span>
      </button>
      <button type="button" className="chip" aria-haspopup="dialog" onClick={(e) => onLogros(e.currentTarget)}>
        {fmt(t('arcade.logros'), { n: unlocked, total })}
      </button>
    </div>
  );
}

