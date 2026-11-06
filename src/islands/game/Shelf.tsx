// Vitrina de logros (contenido del panel de logros): progreso, recompensas e interruptores de accesorios y temas.
import { t } from '../../i18n';
import { isPlaceholder, showPlaceholders } from '../../lib/placeholder';
import { ACHIEVEMENTS, type Save, type ThemeId } from './achievements';
import { fmt, progressText } from './ui';

interface Props {
  save: Save;
  /** Recibe una función sobre el guardado más reciente (no sobre esta prop, que puede ir por detrás de la partida). */
  onChange: (update: (s: Save) => Save) => void;
}

// En producción nunca se muestra un [PLACEHOLDER]: hasta que Carlos escriba la nota, un mensaje neutro.
const NOTA = showPlaceholders || !isPlaceholder(t('juego.notaSecreta')) ? t('juego.notaSecreta') : t('juego.notaPendiente');

export default function Shelf({ save, onChange }: Props) {
  const has = (id: string) => (save.unlocked as string[]).includes(id);
  const toggle = (label: string, pressed: boolean, fn: () => void) => (
    <button type="button" className="v-btn" aria-pressed={pressed} onClick={fn}>{label}</button>
  );
  const theme = (id: ThemeId, label: string) =>
    toggle(label, save.theme === id, () => onChange((s) => ({ ...s, theme: s.theme === id ? 'rojo' : id })));

  return (
    <>
      <p className="logros-intro">{t('vitrina.intro')}</p>
      <ul className="shelf">
        {ACHIEVEMENTS.map((a) => {
          const on = has(a.id);
          const progress = progressText(a.id, save);
          return (
            <li key={a.id} className={`badge${on ? ' on' : ''}`} data-ach={a.id}>
              <b>{a.id === 'secreto' && !on ? t('vitrina.oculto') : a.nombre}</b>
              <span>{a.desc}</span>
              {a.recompensa && <span className="rw">{fmt(t('vitrina.recompensa'), { r: a.recompensa })}</span>}
              {progress && <span className="pg">{progress}</span>}
              {on && a.id === 'racha' && toggle(t('vitrina.gafas'), save.shades, () => onChange((s) => ({ ...s, shades: !s.shades })))}
              {on && a.id === 'hooks' && toggle(t('vitrina.cadenas'), save.chain, () => onChange((s) => ({ ...s, chain: !s.chain })))}
              {on && a.id === 'cero' && theme('azul', t('vitrina.usarAzul'))}
              {on && a.id === 'mil' && theme('verde', t('vitrina.usarVerde'))}
              {on && a.id === 'secreto' && <p className="nota">{NOTA}</p>}
            </li>
          );
        })}
        <li className="badge on rec" data-ach="record">
          <b>{t('vitrina.record')}</b>
          <span>{fmt(t('vitrina.puntos'), { n: save.best })}</span>
          {save.theme !== 'rojo' && (
            <button type="button" className="v-btn" onClick={() => onChange((s) => ({ ...s, theme: 'rojo' }))}>{t('vitrina.volverRojo')}</button>
          )}
        </li>
      </ul>
    </>
  );
}
