// Pantalla de fin en estilo terminal: resumen, compartir, puente al contenido y botones.
import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { MAXDLQ, type GameState } from './engine';
import { copyText, shareScore } from './share';
import { fmt, worstText, type Worst } from './ui';

interface Props {
  game: GameState;
  best: number;
  /** Peor momento del turno (cola más larga). */
  worst: Worst | null;
  record: boolean;
  onAgain: () => void;
  onBack: () => void;
  /** Abre el panel de logros (el foco vuelve a este botón al cerrarlo). */
  onLogros: (trigger: HTMLElement) => void;
  /** Al seguir un enlace del puente: cerrar el tablero sin robar el foco. */
  onLeave: () => void;
}

export default function PostMortem({ game: g, best, worst, record, onAgain, onBack, onLogros, onLeave }: Props) {
  const again = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<{ text: string; bad: boolean } | null>(null);
  useEffect(() => { again.current?.focus(); }, []);

  async function share() {
    const r = await shareScore(g.score);
    if (r === 'shared') setStatus({ text: t('juego.compartido'), bad: false });
    else if (r === 'copied') setStatus({ text: t('juego.copiado'), bad: false });
    else if (r === 'failed') setStatus({ text: fmt(t('juego.copiarError'), { texto: copyText(g.score) }), bad: true });
    else setStatus(null);
  }

  const rows: [string, string, string][] = [
    ['routed', t('juego.fin.entregados'), String(g.routed)],
    ['dlq', t('juego.fin.dlq'), `${Math.min(g.dlq, MAXDLQ)}/${MAXDLQ}`],
    ['combo', t('juego.fin.racha'), String(g.maxCombo)],
    ['puntos', t('juego.fin.puntos'), String(g.score)],
    ['best', t('juego.fin.record'), String(best)],
  ];
  if (worst && worst.queue > 0) rows.splice(3, 0, ['peor', t('juego.fin.peor'), worstText(worst)]);

  return (
    <section className="postmortem" aria-labelledby="pm-title">
      <p className="pm-head" id="pm-title">{t(g.dlq >= MAXDLQ ? 'juego.fin.caida' : 'juego.fin.titulo')}</p>
      <p className="pm-big" id="pm-score" data-pm="score">{fmt(t('juego.fin.pts'), { n: g.score })}</p>
      <dl className="pm-log">
        {rows.map(([k, label, v]) => (
          <div key={k}><dt>{label}</dt><dd data-pm={k}>{v}</dd></div>
        ))}
      </dl>
      {record && <p className="pm-record">{t('juego.fin.nuevoRecord')}</p>}
      <div className="pm-share">
        <button type="button" className="pm-btn b2" onClick={share}>{t('juego.compartir')}</button>
        <span className={`pm-status${status?.bad ? ' bad' : ''}`} role="status">{status?.text ?? ''}</span>
      </div>
      <p className="pm-bridge">
        {t('juego.fin.puente')}{' '}
        <a href="#experiencia" onClick={onLeave}>{t('juego.fin.verExperiencia')}</a>
        {' · '}
        <a href="#proyectos" onClick={onLeave}>{t('juego.fin.verProyectos')}</a>
      </p>
      <div className="pm-row">
        <button type="button" className="pm-btn b1" ref={again} onClick={onAgain} aria-describedby="pm-title pm-score">{t('juego.otra')}</button>
        <button type="button" className="pm-btn b2" onClick={onBack}>{t('juego.volver')}</button>
        <button type="button" className="pm-btn b2" aria-haspopup="dialog" onClick={(e) => onLogros(e.currentTarget)}>{t('juego.verLogros')}</button>
      </div>
    </section>
  );
}
