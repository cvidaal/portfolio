// Isla del juego "Pub/Sub Rush" (sección 7 de la spec): vitrina en su sitio y tablero en #game-slot.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../i18n';
import { emit, type PoseName } from '../../lib/bus';
import { MAXDLQ, createGame, route, tick, type GameState, type Incident, type MsgType } from './engine';
import { ACHIEVEMENTS, type AchId, type Save } from './achievements';
import { defaultSave, loadSave, persist } from './storage';
import { fmt, hintFor, isFirstGame, isTypingTarget, keyToService, settle, trackWorst, type Worst } from './ui';
import Board, { type Flash, type Float, type Toast } from './Board';
import PostMortem from './PostMortem';
import Shelf from './Shelf';
import './game.css';

const FLOAT_MS = 800;
const TOAST_MS = 2700;
const BANNER_SECS = 2.5; // el pico de tráfico dura un instante en el motor: el aviso se mantiene un poco

const pose = (name: PoseName, ms: number) => emit('avatar:pose', { name, ms });
const cosmeticsOf = (s: Save) => ({ shades: s.shades, chain: s.chain, theme: s.theme });

export default function Game() {
  const [save, setSave] = useState<Save>(defaultSave); // SSR y primer render: guardado vacío
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [flash, setFlash] = useState<Flash>({});
  const [result, setResult] = useState<{ record: boolean; best: number } | null>(null);
  const [round, setRound] = useState(0); // cambia en cada partida nueva: enfoca el tablero

  const saveRef = useRef(save);
  const gameRef = useRef<GameState | null>(null);
  const selRef = useRef<number | null>(null);
  const openRef = useRef(false);
  const guidedRef = useRef(false);
  const bestAtStart = useRef(0);
  const bannerRef = useRef<{ kind: Incident['kind']; service?: MsgType; untilT: number } | null>(null);
  const worstRef = useRef<Worst | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const uid = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  // --- guardado ---
  function commitSave(next: Save) {
    saveRef.current = next;
    setSave(next);
    persist(next); // antes de emitir: el avatar lee el guardado al montarse
  }
  // Siempre sobre saveRef: durante una partida lleva progreso que la vitrina aún no ha pintado.
  function changeFromShelf(update: (s: Save) => Save) {
    const next = update(saveRef.current);
    commitSave(next);
    emit('avatar:cosmetics', cosmeticsOf(next));
  }
  function announce(nuevos: AchId[]) {
    for (const id of nuevos) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) continue;
      const text = a.recompensa
        ? fmt(t('juego.logroRecompensa'), { nombre: a.nombre, recompensa: a.recompensa })
        : fmt(t('juego.logro'), { nombre: a.nombre });
      const toast = { id: ++uid.current, text };
      setToasts((ts) => [...ts, toast]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x !== toast)), TOAST_MS);
    }
  }
  function applySettle(g: GameState, final: boolean) {
    const r = settle(saveRef.current, g, final);
    if (final || r.nuevos.length) commitSave(r.save);
    else saveRef.current = r.save; // progreso en memoria; se guarda al terminar o salir
    if (r.cosmeticsChanged) emit('avatar:cosmetics', cosmeticsOf(r.save));
    announce(r.nuevos);
    return r.save;
  }

  // --- efectos visuales efímeros ---
  function addFloat(text: string, bad: boolean, at: Float['at']) {
    const f = { id: ++uid.current, text, bad, at };
    setFloats((fs) => [...fs, f]);
    setTimeout(() => setFloats((fs) => fs.filter((x) => x !== f)), FLOAT_MS);
  }
  function flashSvc(svc: MsgType, kind: 'ok' | 'ko') {
    setFlash((fl) => ({ ...fl, [svc]: { kind, n: (fl[svc]?.n ?? 0) + 1 } }));
  }

  // --- estado de la partida ---
  function apply(s: GameState, svc: MsgType | null) {
    gameRef.current = s;
    worstRef.current = trackWorst(worstRef.current, s);
    setGame(s);
    if (selRef.current !== null && !s.msgs.some((m) => m.id === selRef.current)) setSelected(null);
    let routedOk = false;
    for (const ev of s.events) {
      switch (ev.kind) {
        case 'ok':
          routedOk = true;
          if (svc) { addFloat(fmt(t('juego.ok'), { pts: ev.pts ?? 0 }), false, svc); flashSvc(svc, 'ok'); }
          break;
        case 'bad':
          addFloat(t('juego.bad'), true, svc ?? 'queue');
          if (svc) flashSvc(svc, 'ko');
          pose('think', 1000);
          break;
        case 'timeout':
          addFloat(t('juego.timeout'), true, 'queue');
          pose('think', 1000);
          break;
        case 'save': pose('surprised', 700); break;
        case 'combo5': pose('smile', 900); break;
        case 'combo10': pose('grin', 1200); break;
        case 'incident':
          if (s.incident) bannerRef.current = { kind: s.incident.kind, service: s.incident.service, untilT: s.t - BANNER_SECS };
          pose('think', 1000);
          break;
        case 'end': finish(s); break;
      }
    }
    if (routedOk && !s.over) applySettle(s, false);
  }

  function finish(s: GameState) {
    stopLoop();
    const next = applySettle(s, true);
    const record = s.score > bestAtStart.current;
    setResult({ record, best: next.best });
    if (record) emit('avatar:wink');
    else pose(s.dlq >= MAXDLQ ? 'think' : 'smile', 1500);
  }

  function setSelected(id: number | null) {
    selRef.current = id;
    setSel(id);
  }

  function doRoute(svc: MsgType) {
    const g = gameRef.current;
    if (!g || g.over) return;
    const id = selRef.current !== null && g.msgs.some((m) => m.id === selRef.current) ? selRef.current : undefined;
    setSelected(null);
    apply(route(g, svc, id), svc);
  }

  // --- bucle rAF: solo mientras la partida está viva y la pestaña visible ---
  function frame(now: number) {
    const g = gameRef.current;
    if (!g || g.over) { rafRef.current = 0; return; }
    const dt = Math.max(0, (now - lastRef.current) / 1000);
    lastRef.current = now;
    apply(tick(g, dt), null);
    rafRef.current = gameRef.current && !gameRef.current.over && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  function startLoop() {
    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
  }
  function stopLoop() {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }

  // --- abrir / cerrar ---
  const heroTxt = () => document.getElementById('hero-txt');
  function newGame() {
    const s = createGame({ seed: (Math.random() * 2 ** 32) >>> 0, guided: isFirstGame(saveRef.current) });
    guidedRef.current = s.guided;
    bestAtStart.current = saveRef.current.best;
    bannerRef.current = null;
    worstRef.current = trackWorst(null, s);
    gameRef.current = s;
    setGame(s);
    setSelected(null);
    setFloats([]);
    setFlash({});
    setResult(null);
    setRound((r) => r + 1);
    startLoop();
  }
  function openBoard() {
    if (!openRef.current) {
      openRef.current = true;
      document.documentElement.dataset.game = 'open'; // antes del evento: el avatar lo lee al montarse
      document.getElementById('hero')?.classList.add('playing');
      const txt = heroTxt();
      if (txt) { txt.inert = true; txt.setAttribute('aria-hidden', 'true'); }
      setOpen(true);
      emit('game:open');
    }
    newGame();
  }
  function closeBoard(restoreFocus: boolean) {
    if (!openRef.current) return;
    stopLoop();
    const g = gameRef.current;
    if (g && !g.over) commitSave(saveRef.current); // progreso de un turno a medias (y la vitrina al día)
    openRef.current = false;
    gameRef.current = null;
    setGame(null);
    setOpen(false);
    setToasts([]);
    delete document.documentElement.dataset.game;
    document.getElementById('hero')?.classList.remove('playing');
    const txt = heroTxt();
    if (txt) { txt.inert = false; txt.removeAttribute('aria-hidden'); }
    emit('game:close');
    if (restoreFocus) document.getElementById('play-game')?.focus();
  }

  // Últimas versiones de los manejadores para los listeners globales.
  const handlers = useRef({ openBoard, closeBoard, doRoute, startLoop, stopLoop });
  handlers.current = { openBoard, closeBoard, doRoute, startLoop, stopLoop };

  // Hidratado: cargar el guardado y mostrar el botón del hero.
  useEffect(() => {
    const s = loadSave();
    saveRef.current = s;
    setSave(s);
    setMounted(true);
    const play = document.getElementById('play-game');
    const onPlay = () => handlers.current.openBoard();
    if (play) { play.hidden = false; play.addEventListener('click', onPlay); }
    const onVis = () => {
      const g = gameRef.current;
      if (document.hidden) handlers.current.stopLoop();
      else if (openRef.current && g && !g.over) handlers.current.startLoop();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      play?.removeEventListener('click', onPlay);
      document.removeEventListener('visibilitychange', onVis);
      handlers.current.stopLoop();
    };
  }, []);

  // Teclado: solo con el tablero abierto, la partida viva y sin foco en un campo de texto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handlers.current.closeBoard(true); return; }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      const g = gameRef.current;
      if (!g || g.over) return;
      const svc = keyToService(g.order, e.key);
      if (!svc) return;
      e.preventDefault();
      handlers.current.doRoute(svc);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Partida nueva: el foco entra en el tablero.
  useEffect(() => {
    if (round > 0) boardRef.current?.focus();
  }, [round]);

  const slot = mounted ? document.getElementById('game-slot') : null;
  const b = bannerRef.current;
  const banner = game ? game.incident ?? (b && game.t > b.untilT ? b : null) : null;

  return (
    <>
      <Shelf save={save} onChange={changeFromShelf} />
      {open && game && slot && createPortal(
        <Board
          ref={boardRef}
          game={game}
          sel={sel}
          hint={hintFor(game, guidedRef.current, sel)}
          banner={banner}
          floats={floats}
          toasts={toasts}
          flash={flash}
          onSelect={(id) => setSelected(selRef.current === id ? null : id)}
          onRoute={doRoute}
          onClose={() => closeBoard(true)}
        >
          {game.over && result && (
            <PostMortem
              game={game}
              best={result.best}
              worst={worstRef.current}
              record={result.record}
              onAgain={newGame}
              onBack={() => closeBoard(true)}
              onLeave={() => closeBoard(false)}
            />
          )}
        </Board>,
        slot,
      )}
    </>
  );
}
