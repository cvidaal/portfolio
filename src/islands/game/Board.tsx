// Tablero: HUD, incidente, pista, cola de mensajes, servicios, flotantes y toasts de logro.
import { forwardRef, type ReactNode } from 'react';
import { t } from '../../i18n';
import { MAXDLQ, multiplier, type GameState, type Incident, type MsgType } from './engine';
import { fmt, ruta } from './ui';

export type Float = { id: number; text: string; bad: boolean; at: MsgType | 'queue' };
export type Toast = { id: number; text: string };
export type Flash = Partial<Record<MsgType, { kind: 'ok' | 'ko'; n: number }>>;

const SHAPE: Record<MsgType, string> = { pago: 'sq', reserva: 'circle', aviso: 'tri' };

interface Props {
  game: GameState;
  sel: number | null;
  hint: string | null;
  banner: Pick<Incident, 'kind' | 'service'> | null;
  floats: Float[];
  toasts: Toast[];
  flash: Flash;
  onSelect: (id: number) => void;
  onRoute: (svc: MsgType) => void;
  onClose: () => void;
  children?: ReactNode; // post-mortem
}

const Floats = ({ floats, at }: { floats: Float[]; at: Float['at'] }) => (
  <>
    {floats.filter((f) => f.at === at).map((f) => (
      <span key={f.id} className={`float${f.bad ? ' bad' : ''}`} aria-hidden="true">{f.text}</span>
    ))}
  </>
);

function bannerText(b: NonNullable<Props['banner']>): string {
  if (b.kind === 'caido') return fmt(t('juego.incidente.caido'), { ruta: b.service ? ruta(b.service) : '' });
  return t(b.kind === 'pico' ? 'juego.incidente.pico' : 'juego.incidente.deploy');
}

const Board = forwardRef<HTMLDivElement, Props>(function Board(
  { game: g, sel, hint, banner, floats, toasts, flash, onSelect, onRoute, onClose, children }, ref,
) {
  const down = g.incident?.kind === 'caido' ? g.incident.service : undefined;
  const deploying = g.incident?.kind === 'deploy';
  return (
    <div className="game-board mono" role="region" aria-label={t('juego.region')} tabIndex={-1} ref={ref}>
      {/* con el post-mortem abierto, lo de detrás no se ve, no se lee y no recibe el foco */}
      <div className="gb-body" {...(g.over ? { inert: '', 'aria-hidden': true } : {})}>
      <div className="gb-top">
        <span className="gb-title">{t('juego.titulo')}</span>
        <button type="button" className="gb-close" onClick={onClose}>
          {t('juego.salir')} <kbd aria-hidden="true">Esc</kbd>
        </button>
      </div>
      <div className="hud">
        <span>{t('juego.hud.score')} <b data-hud="score">{g.score}</b></span>
        <span>x<b data-hud="mult">{multiplier(g.combo)}</b> · {t('juego.hud.racha')} <b data-hud="combo">{g.combo}</b></span>
        <span className="dlq">{t('juego.hud.dlq')} <b data-hud="dlq">{Math.min(g.dlq, MAXDLQ)}/{MAXDLQ}</b></span>
        <span><b data-hud="time">{Math.ceil(g.t)}</b>{t('juego.hud.tiempo')}</span>
      </div>
      <div className="gb-alerts" aria-live="polite">
        {banner && <p className="game-incident" data-kind={banner.kind}>{bannerText(banner)}</p>}
        {hint && <p className="game-hint">{hint}</p>}
      </div>
      <div className="gb-main">
        <div className="gb-col gb-q">
          <h3>{t('juego.cola')}</h3>
          <div className="queue">
            {g.msgs.map((m) => {
              const f = Math.max(0, m.left / m.ttl);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`msg${m.hook ? ' hook' : ''}${sel === m.id ? ' sel' : ''}`}
                  data-type={m.type}
                  data-id={m.id}
                  aria-pressed={sel === m.id}
                  onClick={() => onSelect(m.id)}
                >
                  <span className={`shape ${SHAPE[m.type]}`} aria-hidden="true" />
                  {fmt(t('juego.msg'), { ruta: ruta(m.type) })}
                  {m.hook && <span className="tag">{t('juego.webhook')}</span>}
                  <span className={`ttl${f < 0.3 ? ' low' : ''}`} style={{ width: `${f * 100}%` }} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <Floats floats={floats} at="queue" />
        </div>
        <div className="gb-col gb-s">
          <h3>{t('juego.servicios')}</h3>
          <div className={`svcs${deploying ? ' deploying' : ''}`}>
            {g.order.map((type, i) => {
              const fl = flash[type];
              const isDown = down === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`svc${isDown ? ' down' : ''}${fl ? ` ${fl.kind}${fl.n % 2}` : ''}`}
                  data-type={type}
                  aria-keyshortcuts={String(i + 1)}
                  onClick={() => onRoute(type)}
                >
                  <span className="svc-label">
                    <span className={`shape ${SHAPE[type]}`} aria-hidden="true" />
                    <span className="svc-name">{ruta(type)}</span>
                  </span>
                  {isDown && <span className="svc-down">{t('juego.caido')}</span>}
                  <kbd className="k" aria-hidden="true">{i + 1}</kbd>
                  <Floats floats={floats} at={type} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="help">{t('juego.ayuda')}</p>
      </div>
      {children}
      <div className="toasts" role="status">
        {toasts.map((x) => <p key={x.id} className="toast">{x.text}</p>)}
      </div>
    </div>
  );
});

export default Board;
