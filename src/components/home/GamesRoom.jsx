import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import AccountMenu from '@/components/layout/AccountMenu';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { GAMES, GAME_BY_TYPE } from '@/data/games';
import { CUPBOARD_SHELVES, DART, DARTBOARD_BULL, GAME_ACTIONS, PLANE, ROOM, ROOM_OBJECTS, TV_SCREEN } from '@/data/gamesRoom';
import { cn } from '@/lib/cn';

// The home page as a room (REDESIGN-PLAN.md, Phase 2). Every game is an object
// in it; tapping one pushes the camera in and a card rises with that game's
// choices. The cupboard opens onto shelves of board-game boxes.
//
// The room is one picture with a few things layered on top so they can move by
// themselves: the plane sways on its strings, a dart lands in the board now and
// then, and the TV flickers through the quiz's answer shapes. Each object has a
// small name label beside it and a soft pulsing halo saying it can be tapped
// (Ash, 2026-10-21); nothing bigger is drawn over the picture.

const pct = (n) => `${n}%`;
const box = ([l, t, w, h]) => ({ left: pct(l), top: pct(t), width: pct(w), height: pct(h) });

// The camera move that puts a box in view: scaled so it fills `fill` of the
// width (or 55% of the height), its middle a little above the stage's middle.
function cameraFor([l, t, w, h], stage, fill) {
  const W = stage.width;
  const H = stage.height;
  const bw = (w / 100) * W;
  const bh = (h / 100) * H;
  const k = Math.min((fill * W) / bw, (0.55 * H) / bh, 3.2);
  const cx = (l / 100) * W + bw / 2;
  const cy = (t / 100) * H + bh / 2;
  return { x: W / 2 - k * cx, y: H * 0.38 - k * cy, scale: k };
}

// Written out: Tailwind only generates classes it can see.
const BUTTON_TONES = {
  'travel-bingo': 'bg-game-bingo text-white [--toy-edge:hsl(var(--game-bingo-deep))]',
  quiz: 'bg-game-quiz text-white [--toy-edge:hsl(var(--game-quiz-deep))]',
  darts: 'bg-game-darts text-white [--toy-edge:hsl(var(--game-darts-deep))]',
  'scrabble-scorer': 'bg-game-scrabble text-white [--toy-edge:hsl(var(--game-scrabble-deep))]',
  'egypt-explorer': 'bg-game-egypt-deep text-white [--toy-edge:theme(colors.slate.900)]',
};

export default function GamesRoom({ active = {}, isGuest, onSignIn }) {
  const reduce = useReducedMotion();
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [focus, setFocus] = useState(null); // null | an object id | a game id inside the cupboard
  const pushed = useRef(false);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => setStage({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The phone's back button steps out of the room's zoom rather than leaving
  // the site: each zoom from the room is one history entry.
  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setFocus(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goTo = (id) => {
    play('whoosh');
    if (id === 'cupboard') setTimeout(() => play('door'), reduce ? 0 : 450);
    if (!pushed.current) {
      window.history.pushState({ gamesRoom: id }, '');
      pushed.current = true;
    }
    setFocus(id);
  };

  const back = () => {
    play('back');
    if (pushed.current) window.history.back();
    else setFocus(null);
  };

  useEffect(() => {
    if (!focus) return undefined;
    const onKey = (e) => e.key === 'Escape' && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // Empty shelf spaces are null in CUPBOARD_SHELVES, so a null focus (the
  // whole room) must never be looked up there: it matched, and the page opened
  // zoomed into the cupboard.
  const inCupboard = !!focus && (focus === 'cupboard' || CUPBOARD_SHELVES.flat().includes(focus));
  const cameraTarget = inCupboard ? 'cupboard' : focus;
  const target = ROOM_OBJECTS.find((o) => o.id === cameraTarget);
  const camera =
    target && stage.width ? cameraFor(target.box, stage, cameraTarget === 'cupboard' ? 0.95 : 0.8) : { x: 0, y: 0, scale: 1 };
  const game = focus && focus !== 'cupboard' ? GAME_BY_TYPE[focus] : null;
  const zoomed = !!focus;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#2a1f4d]">
      {/* Behind the stage on a wide screen: the same room, blurred, so there is
          no dead border around a portrait picture on a laptop. */}
      <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl" style={{ backgroundImage: `url(${ROOM.src})` }} />

      <div
        ref={stageRef}
        className="relative aspect-[9/16] h-[min(100dvh,calc(100vw*16/9))] overflow-hidden bg-[#f3c48e] shadow-2xl sm:rounded-[28px]"
      >
        <motion.div
          className="absolute inset-0 origin-top-left"
          initial={false}
          animate={camera}
          transition={reduce ? { duration: 0 } : { duration: 0.75, ease: [0.65, 0, 0.25, 1] }}
        >
          <img
            src={ROOM.src}
            width={ROOM.width}
            height={ROOM.height}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />

          <Plane reduce={reduce} />
          {!reduce && !zoomed && <Darts />}
          <TvScreen reduce={reduce} glyphPx={Math.max(10, stage.height * (TV_SCREEN[3] / 100) * 0.62)} />

          {ROOM_OBJECTS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => !zoomed && goTo(o.id)}
              aria-label={o.id === 'cupboard' ? 'The games cupboard: board games' : o.label}
              tabIndex={zoomed ? -1 : 0}
              className="group absolute rounded-3xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
              style={box(o.box)}
            >
              {/* The halo: a soft ring pulsing out from the object's middle. */}
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/25 transition-opacity duration-300',
                  zoomed ? 'opacity-0' : 'opacity-100',
                )}
              >
                {!reduce && !zoomed && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-white"
                    animate={{ scale: [1, 2.4], opacity: [0.9, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: o.delay }}
                  />
                )}
              </span>
              <span
                className={cn(
                  'pointer-events-none absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#241a45]/70 px-2 py-0.5 text-[10px] font-bold text-white transition-opacity duration-300',
                  zoomed ? 'opacity-0' : 'opacity-100',
                )}
              >
                {o.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* The ceiling: the name, sound and account, or the way back out. */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {zoomed ? (
            <button
              type="button"
              onClick={back}
              aria-label="Back to the room"
              className="toy flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#241a45] [--toy-edge:rgba(0,0,0,0.18)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#241a45]">
              Game<span className="text-brand">Pad</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/85 shadow-sm">
              <MuteButton />
            </span>
            <AccountMenu onSignIn={onSignIn} className="shadow-[0_3px_0_rgba(0,0,0,0.2)]" />
          </div>
        </div>

        <AnimatePresence>{inCupboard && <Shelves key="shelves" active={active} onPick={(id) => { play('tap'); setFocus(id); }} reduce={reduce} />}</AnimatePresence>

        <AnimatePresence>
          {game && (
            <GameCard key={game.id} game={game} active={active[game.id]} isGuest={isGuest} onSignIn={onSignIn} reduce={reduce} />
          )}
        </AnimatePresence>
      </div>

      {/* The same games as plain links, for screen readers and search engines:
          the room itself is a picture. */}
      <nav aria-label="Games" className="sr-only">
        <h1>GamePad: family games</h1>
        <ul>
          {GAMES.map((g) => (
            <li key={g.id}>
              <Link href={g.href}>{g.name}</Link>: {g.description}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// The plane and its strings, swinging gently from the two ceiling hooks.
function Plane({ reduce }) {
  const [l, t, w, h] = PLANE.box;
  const pivotX = (PLANE.hooks[0][0] + PLANE.hooks[1][0]) / 2;
  const pivotY = PLANE.hooks[0][1];
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ transformOrigin: `${pivotX}% ${pivotY}%` }}
      animate={reduce ? undefined : { rotate: [-1.4, 1.4] }}
      transition={{ duration: 3.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {PLANE.hooks.map(([hx, hy], i) => (
          <line key={i} x1={hx} y1={hy + 0.6} x2={PLANE.strings[i]} y2={t + 1.2} stroke="#efe6d6" strokeWidth="0.45" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2.5 }} />
        ))}
      </svg>
      <img src={PLANE.src} alt="" draggable={false} className="absolute" style={{ left: pct(l), top: pct(t), width: pct(w), height: pct(h) }} />
    </motion.div>
  );
}

// Now and then a dart flies in and lands near the bull, wobbles, and fades.
function Darts() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setN((x) => x + 1);
    }, 6500);
    return () => clearInterval(t);
  }, []);
  if (!n) return null;

  // The dart picture is 176×340 with its tip near the bottom-right corner.
  const w = DART.width;
  const h = w * (340 / 176) * (9 / 16);
  const jitter = ((n * 37) % 7) - 3; // a different spot each throw, without Math.random in render
  const tipX = DARTBOARD_BULL[0] + jitter * 0.6;
  const tipY = DARTBOARD_BULL[1] + (((n * 53) % 5) - 2) * 0.5;
  return (
    <motion.img
      key={n}
      src={DART.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ left: pct(tipX - w * 0.82), top: pct(tipY - h * 0.95), width: pct(w), height: pct(h), transformOrigin: '82% 95%' }}
      initial={{ x: '-260%', y: '-160%', opacity: 0, rotate: -12 }}
      animate={{ x: ['-260%', '0%', '0%', '0%', '0%'], y: ['-160%', '0%', '0%', '0%', '0%'], opacity: [0, 1, 1, 1, 0], rotate: [-12, 0, 6, 0, 0] }}
      transition={{ duration: 3.2, times: [0, 0.07, 0.12, 0.18, 1], ease: 'easeOut' }}
    />
  );
}

// The TV's screen, glowing and cycling through the quiz's four answer shapes.
const SHAPES = [
  { glyph: '▲', color: '#ef4444' },
  { glyph: '◆', color: '#3b82f6' },
  { glyph: '●', color: '#eab308' },
  { glyph: '■', color: '#22c55e' },
];
function TvScreen({ reduce, glyphPx }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % SHAPES.length), 1300);
    return () => clearInterval(t);
  }, [reduce]);
  const s = SHAPES[i];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute flex items-center justify-center overflow-hidden rounded-[18%] bg-[#1d2550]/90"
      style={box(TV_SCREEN)}
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_3px)]" />
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="font-bold leading-none"
          style={{ color: s.color, fontSize: glyphPx, textShadow: `0 0 12px ${s.color}` }}
        >
          {s.glyph}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Inside the cupboard: shelves of game boxes, drawn over the zoomed picture.
function Shelves({ active, onPick, reduce }) {
  return (
    <motion.div
      className="absolute inset-x-[8%] bottom-[31%] top-[16%] z-10 grid grid-rows-2 gap-3 rounded-3xl bg-[#8a5a2b] p-3 shadow-[inset_0_0_0_8px_#6b4420,0_20px_40px_-10px_rgba(0,0,0,0.5)]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={reduce ? { duration: 0 } : { delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
    >
      {CUPBOARD_SHELVES.map((row, r) => (
        <div key={r} className="flex items-end gap-2 rounded border-b-[10px] border-[#5a3818] px-1.5 pb-2">
          {row.map((id, c) => {
            const g = id && GAME_BY_TYPE[id];
            if (!g) {
              return (
                <div key={c} className="flex h-[78%] flex-1 items-end rounded-lg bg-[repeating-linear-gradient(135deg,#c9b79d_0_8px,#bba98e_8px_16px)] p-2 text-xs font-bold text-[#5a4a35]">
                  Room for another game
                </div>
              );
            }
            return (
              <motion.button
                key={c}
                type="button"
                onClick={() => onPick(id)}
                whileHover={{ y: -6, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className={cn('flex h-[88%] flex-1 flex-col justify-between rounded-lg p-2.5 text-left shadow-[4px_4px_0_rgba(0,0,0,0.3)]', BUTTON_TONES[id])}
              >
                <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
                <span>
                  <span className="block font-display text-lg font-extrabold leading-tight">{g.name}</span>
                  {active[id] && <span className="text-xs font-bold opacity-90">Game in progress</span>}
                </span>
              </motion.button>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}

// The card that rises once the camera has arrived.
function GameCard({ game, active, isGuest, onSignIn, reduce }) {
  const actions = (GAME_ACTIONS[game.id] || [{ label: 'Play', href: game.href, primary: true }]).filter((a) => a.when !== 'active' || active);
  const [main, ...rest] = actions;
  return (
    <motion.div
      role="dialog"
      aria-label={game.name}
      className="absolute inset-x-3 bottom-3 z-30 rounded-3xl bg-[#fffaf2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[#241a45] shadow-[0_6px_0_rgba(0,0,0,0.18),0_20px_40px_-12px_rgba(0,0,0,0.5)]"
      initial={{ y: '130%' }}
      animate={{ y: 0 }}
      exit={{ y: '130%' }}
      transition={reduce ? { duration: 0 } : { delay: 0.45, type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden="true">{game.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-extrabold leading-tight">{game.name}</h2>
          <p className="mt-0.5 text-sm leading-snug text-[#6b6390]">{game.description}</p>
          {active?.detail && <p className="mt-1 text-sm font-bold text-[#241a45]">{active.detail}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {main && (
          <Link
            href={main.href}
            onClick={() => play('tap')}
            className={cn('toy flex min-h-[54px] items-center justify-center rounded-2xl font-display text-xl font-extrabold', BUTTON_TONES[game.id])}
          >
            {main.label}
          </Link>
        )}
        {rest.length > 0 && (
        <div className="flex gap-2.5">
          {rest.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              onClick={() => play('tap')}
              className="toy flex min-h-touch flex-1 items-center justify-center rounded-2xl bg-white px-3 text-center font-bold text-[#241a45] ring-2 ring-inset ring-[#ece6ff] [--toy-edge:#d9d2f2]"
            >
              {a.label}
            </Link>
          ))}
        </div>
        )}
      </div>

      {isGuest && (
        <button type="button" onClick={onSignIn} className="mt-3 w-full text-center text-sm font-semibold text-brand">
          Sign in to save your scores
        </button>
      )}
    </motion.div>
  );
}
