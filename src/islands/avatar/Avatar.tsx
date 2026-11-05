// Isla del avatar: ojos que siguen al ratón, parpadeo, gestos y guiño (sección 6 de la spec).
import { useEffect, useRef } from 'react';
import { emit, on, type Cosmetics } from '../../lib/bus';
import { readCosmetics } from '../../lib/save-key';
import { createCompositor, type AccessoryHook, type AvatarState, type EyeState, type Layers } from './compositor';
import { IDLE_POSES, K_LOOK, K_POSE, POSES, lookOffset, step, type Pose, type PoseName } from './poses';

interface Props {
  layers: Layers;
  /** Parpadeo y gestos automáticos. En móvil empieza en false y se activa con game:open. */
  auto: boolean;
  /** Gancho para pintar accesorios (Task 7). */
  accessories?: AccessoryHook;
}

const SIZE = 1254;
const SURPRISE_SPEED = 3.2; // px/ms
const clonePose = (p: Pose): Pose => ({ b: [{ ...p.b[0] }, { ...p.b[1] }], m: { ...p.m } });
const near = (a: number, b: number, eps: number) => Math.abs(a - b) < eps;
const poseNear = (a: Pose, b: Pose) =>
  a.b.every((x, i) => near(x.y, b.b[i].y, 0.01) && near(x.r, b.b[i].r, 0.0005)) &&
  near(a.m.s, b.m.s, 0.01) && near(a.m.o, b.m.o, 0.01) && near(a.m.a, b.m.a, 0.001) && near(a.m.w, b.m.w, 0.0005);

export default function Avatar({ layers, auto, accessories }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const comp = createCompositor(canvas, layers, { accessories });
    const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => mqReduce.matches;
    const eyes = layers.json.eyes;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
    };
    const offs: Array<() => void> = [];
    function listen<E extends Event>(t: EventTarget, type: string, fn: (e: E) => void, o?: AddEventListenerOptions) {
      const l = fn as EventListener;
      t.addEventListener(type, l, o);
      offs.push(() => t.removeEventListener(type, l, o));
    }

    let autoOn = auto;
    let look = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    let lookPoint: { x: number; y: number } | null = null;
    let lastMouse: { x: number; y: number; t: number } | null = null;
    const closed: [EyeState, EyeState] = [0, 0];
    let cur = clonePose(POSES.neutral), tgt = POSES.neutral, tgtName: PoseName = 'neutral';
    let until = 0, hoverCta = false;
    let cosmetics: Cosmetics | null = readCosmetics();
    let lastKey = '', raf = 0, running = false, painted = false;

    // --- mirada: el centro de los ojos se mide en cada cálculo (cambia con resize y scroll) ---
    function lookAtScreen(sx: number, sy: number) {
      const r = canvas!.getBoundingClientRect(), s = r.width / SIZE;
      const fx = r.left + ((eyes[0].ix + eyes[1].ix) / 2) * s;
      const fy = r.top + ((eyes[0].iy + eyes[1].iy) / 2) * s;
      return lookOffset(sx - fx, sy - fy);
    }
    function retarget() {
      const p = lookPoint ?? lastMouse;
      target = p ? lookAtScreen(p.x, p.y) : { x: 0, y: 0 };
      wake();
    }

    // --- poses y gestos ---
    function setPose(name: PoseName) { tgt = POSES[name]; tgtName = name; }
    function applyPose(name: PoseName, ms: number) {
      if (!Object.hasOwn(POSES, name) || hoverCta) return; // la risa del hover manda mientras dure
      setPose(name);
      until = performance.now() + ms;
      later(wake, ms + 20);
      wake();
    }
    function wink() {
      const k = Math.random() < 0.5 ? 0 : 1;
      hoverCta = false;
      applyPose(k ? 'winkR' : 'winkL', 1300);
      closed[k] = 2;
      wake();
      later(() => { if (closed[k] === 2) closed[k] = 0; wake(); }, 1000);
    }
    function blink() {
      if (autoOn && !reduce() && !document.hidden && !closed[0] && !closed[1]) {
        closed[0] = closed[1] = 1;
        wake();
        later(() => { if (closed[0] === 1) closed[0] = 0; if (closed[1] === 1) closed[1] = 0; wake(); }, 120);
      }
      later(blink, 2800 + Math.random() * 3600);
    }
    function idle() {
      if (autoOn && !reduce() && !document.hidden && !hoverCta && performance.now() > until) {
        emit('avatar:pose', { name: IDLE_POSES[Math.floor(Math.random() * IDLE_POSES.length)], ms: 1200 + Math.random() * 700 });
      }
      later(idle, 3200 + Math.random() * 2800);
    }

    // --- bucle rAF: solo corre mientras algo cambia; se duerme al converger y con la pestaña oculta ---
    function wake() {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function frame(now: number) {
      if (!hoverCta && now >= until && tgtName !== 'neutral') setPose('neutral');
      const kl = reduce() ? 1 : K_LOOK, kp = reduce() ? 1 : K_POSE;
      look = { x: look.x + (target.x - look.x) * kl, y: look.y + (target.y - look.y) * kl };
      if (near(look.x, target.x, 0.002) && near(look.y, target.y, 0.002)) look = { ...target };
      cur = step(cur, tgt, kp);
      const poseDone = poseNear(cur, tgt);
      if (poseDone) cur = clonePose(tgt);
      const key = [look.x, look.y, cur.b[0].y, cur.b[0].r, cur.b[1].y, cur.b[1].r, cur.m.s, cur.m.o, cur.m.a, cur.m.w]
        .map((v) => v.toFixed(3)).join() + closed.join() + JSON.stringify(cosmetics);
      if (key !== lastKey) {
        const state: AvatarState = { look, closed: [closed[0], closed[1]], pose: cur, cosmetics };
        comp.draw(state);
        lastKey = key;
        canvas!.dataset.look = `${look.x.toFixed(2)},${look.y.toFixed(2)}`;
        canvas!.dataset.closed = closed.join();
        if (!painted) {
          // primer frame pintado: el canvas tapa la <img> estática (misma caja, sin salto de layout)
          painted = true;
          canvas!.dataset.ready = '1';
          canvas!.style.opacity = '1';
        }
      }
      canvas!.dataset.pose = tgtName;
      const settled = poseDone && look.x === target.x && look.y === target.y;
      if (settled || document.hidden) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    // --- entradas ---
    listen<MouseEvent>(document, 'mousemove', (e) => {
      const now = performance.now();
      if (lastMouse && !reduce() && !hoverCta) {
        const v = Math.hypot(e.clientX - lastMouse.x, e.clientY - lastMouse.y) / Math.max(1, now - lastMouse.t);
        if (v > SURPRISE_SPEED && !(tgtName === 'surprised' && now < until)) emit('avatar:pose', { name: 'surprised', ms: 700 });
      }
      lastMouse = { x: e.clientX, y: e.clientY, t: now };
      if (!lookPoint) { target = lookAtScreen(e.clientX, e.clientY); wake(); }
    }, { passive: true });
    // el ratón sale de la página: los ojos vuelven al centro
    listen<MouseEvent>(window, 'mouseout', (e) => { if (!e.relatedTarget) { lastMouse = null; retarget(); } });
    listen(window, 'resize', retarget, { passive: true });
    listen(window, 'scroll', () => { if (lastMouse || lookPoint) retarget(); }, { passive: true });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); running = false; } else wake();
    });

    const cta = document.getElementById('cta-proyectos');
    if (cta) {
      listen(cta, 'mouseenter', () => { hoverCta = true; setPose('grin'); wake(); });
      listen(cta, 'mouseleave', () => { hoverCta = false; until = 0; wake(); });
    }
    // Guiño: sin preventDefault, la descarga del CV sigue su curso normal.
    const cv = document.getElementById('cta-cv');
    if (cv) listen(cv, 'click', () => emit('avatar:wink'), { passive: true });
    listen(canvas, 'click', () => emit('avatar:wink'));

    offs.push(
      on('avatar:pose', (d) => { if (d) applyPose(d.name, d.ms); }),
      on('avatar:wink', wink),
      on('avatar:look', (p) => { lookPoint = p; retarget(); }),
      on('avatar:cosmetics', (c) => { cosmetics = c; wake(); }),
      on('game:open', () => { autoOn = true; }),
    );

    later(blink, 1500);
    later(idle, 2200);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      offs.forEach((off) => off());
    };
  }, [layers, auto, accessories]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', opacity: 0, cursor: 'pointer' }}
    />
  );
}
