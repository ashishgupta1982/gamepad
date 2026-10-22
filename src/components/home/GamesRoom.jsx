import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import AccountMenu from '@/components/layout/AccountMenu';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { GAMES, GAME_BY_TYPE } from '@/data/games';
import { CUPBOARD, DART, DARTBOARD_BULL, PLANE, ROOM, ROOM_OBJECTS, TV_SCREEN } from '@/data/gamesRoom';
import { cn } from '@/lib/cn';

// The home page as a room (REDESIGN-PLAN.md, Phase 2). Every game is an object
// in it; tapping one pushes the camera in and a card rises with that game's
// choices. The cupboard's doors swing open onto shelves of board-game boxes,
// and tapping a box goes straight into its game (Ash, 2026-10-21).
//
// The room is one picture with a few things layered on top so they can move by
// themselves: the plane sways on its strings, a dart lands in the board now and
// then, and the TV flickers through the quiz's answer shapes. Each object has a
// small name label (Ash, 2026-10-21). A pulsing halo was tried and taken off:
// it spoiled the picture, and the labels say enough.

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

export default function GamesRoom({ isGuest, onSignIn }) {
  const reduce = useReducedMotion();
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const router = useRouter();
  const [focus, setFocus] = useState(null); // null | an object id
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

  const inCupboard = focus === 'cupboard';
  const target = ROOM_OBJECTS.find((o) => o.id === focus);
  const camera = target && stage.width ? cameraFor(target.box, stage, inCupboard ? 0.95 : 0.8) : { x: 0, y: 0, scale: 1 };
  const game = focus && !inCupboard ? GAME_BY_TYPE[focus] : null;
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

        <AnimatePresence>
          {inCupboard && <Cupboard key="cupboard" onOpen={(g) => setTimeout(() => router.push(g.href), reduce ? 0 : 650)} reduce={reduce} />}
        </AnimatePresence>

        <AnimatePresence>
          {game && (
            <GameCard key={game.id} game={game} isGuest={isGuest} onSignIn={onSignIn} reduce={reduce} />
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

// Inside the cupboard: its doors swing open onto the shelves, and each game
// is a box on them. Tapping a box lifts it off the shelf, its lid comes up,
// and the game opens; there is no card in between.
function Cupboard({ onOpen, reduce }) {
  const [opening, setOpening] = useState(null);
  const open = (g) => {
    if (opening) return;
    play('pop');
    setOpening(g.id);
    onOpen(g);
  };
  return (
    <motion.div
      className="absolute left-[7%] top-[13%] z-10 aspect-[3/4] w-[86%] [perspective:900px]"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={reduce ? { duration: 0 } : { delay: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-[0_0_0_4px_rgba(255,255,255,0.6),0_24px_48px_-12px_rgba(0,0,0,0.6)]">
        <img src={CUPBOARD.src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      </div>

      {CUPBOARD.boxes.map(({ id, box: b }) => {
        const g = GAME_BY_TYPE[id];
        return g ? <GameBox key={id} game={g} style={box(b)} opening={opening === id} onOpen={() => open(g)} /> : null;
      })}

      <div
        className="pointer-events-none absolute -rotate-2 rounded-md bg-[#fffaf2] px-2 py-0.5 text-[11px] font-bold text-[#6b4420] shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
        style={{ left: pct(CUPBOARD.comingSoon[0]), top: pct(CUPBOARD.comingSoon[1]) }}
      >
        More games coming soon
      </div>

      {!reduce && <Doors />}
    </motion.div>
  );
}

// The closed doors over the arched opening, swinging out of the way once the
// camera has arrived, as the door sound plays. The picture's own open doors
// are behind them.
function Doors() {
  const [l, t, w, h] = CUPBOARD.doors;
  const door = 'pointer-events-none absolute border-[5px] border-[#d58c47] bg-gradient-to-b from-[#2b6f70] to-[#1d4f51] shadow-[inset_0_0_0_3px_#b8722f]';
  const swing = (deg) => ({
    initial: { rotateY: 0, opacity: 1 },
    animate: { rotateY: deg, opacity: 0 },
    transition: { rotateY: { delay: 0.55, duration: 0.6, ease: [0.3, 0, 0.2, 1] }, opacity: { delay: 1, duration: 0.2 } },
  });
  return (
    <>
      <motion.div
        className={door}
        style={{ left: pct(l), top: pct(t), width: pct(w / 2), height: pct(h), transformOrigin: 'left center', borderTopLeftRadius: '100% 28%' }}
        {...swing(-100)}
      >
        <span className="absolute right-1.5 top-1/2 h-3 w-3 rounded-full bg-[#f0b35e] shadow" />
      </motion.div>
      <motion.div
        className={door}
        style={{ left: pct(l + w / 2), top: pct(t), width: pct(w / 2), height: pct(h), transformOrigin: 'right center', borderTopRightRadius: '100% 28%' }}
        {...swing(100)}
      >
        <span className="absolute left-1.5 top-1/2 h-3 w-3 rounded-full bg-[#f0b35e] shadow" />
      </motion.div>
    </>
  );
}

// A board-game box standing on the shelf: the lid spells the game in letter
// tiles, with a sticker. Opening lifts the box, then its lid.
function GameBox({ game, style, opening, onOpen }) {
  const [first, ...rest] = game.name.split(' ');
  return (
    <motion.button
      type="button"
      aria-label={`Open ${game.name}`}
      onClick={onOpen}
      className="absolute origin-bottom"
      style={style}
      initial={{ rotate: -3 }}
      animate={opening ? { y: '-14%', scale: 1.08, rotate: 0 } : { rotate: -3 }}
      whileHover={opening ? undefined : { y: -6, rotate: -1 }}
      whileTap={opening ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      {/* The box itself; its inside shows once the lid comes up. */}
      <div className="absolute inset-0 rounded-lg bg-[#f3e2bf] shadow-[5px_5px_0_hsl(var(--game-scrabble-deep)),0_14px_20px_-8px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-[10%] grid grid-cols-4 gap-[6%] opacity-80">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="rounded-sm bg-[#f8eed8] shadow-[1px_1px_0_#b89a68]" />
          ))}
        </div>
      </div>
      {/* The lid. */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] rounded-lg bg-game-scrabble px-[6%] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.25)]"
        animate={opening ? { y: '-62%', rotate: -10 } : { y: 0, rotate: 0 }}
        transition={{ delay: opening ? 0.15 : 0, type: 'spring', stiffness: 260, damping: 16 }}
      >
        <span className="flex w-full justify-center gap-[2%]">
          {first.toUpperCase().split('').map((ch, i) => (
            <span
              key={i}
              className="flex aspect-square flex-1 items-center justify-center rounded-[3px] bg-[#f6e7c4] font-display text-[clamp(8px,2.6vw,14px)] font-extrabold leading-none text-[#3b2a16] shadow-[1px_1.5px_0_#a9875a]"
            >
              {ch}
            </span>
          ))}
        </span>
        <span className="font-display text-[clamp(14px,4.4vw,24px)] font-extrabold leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">{rest.join(' ')}</span>
        <span className="absolute -right-2 -top-2 flex h-9 w-9 rotate-12 flex-col items-center justify-center rounded-full bg-amber-300 text-[8px] font-extrabold leading-[1.05] text-amber-950 shadow-[1px_2px_0_rgba(0,0,0,0.25)]">
          <span className="text-[10px]">2–4</span>
          players
        </span>
      </motion.div>
    </motion.button>
  );
}

// The card that rises once the camera has arrived. The room is only the way
// in (Ash, 2026-10-21): carrying on, starting and joining are chosen inside
// each game, so the card has one button.
function GameCard({ game, isGuest, onSignIn, reduce }) {
  const name = game.cardName || game.name;
  return (
    <motion.div
      role="dialog"
      aria-label={name}
      className="absolute inset-x-3 bottom-3 z-30 rounded-3xl bg-[#fffaf2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[#241a45] shadow-[0_6px_0_rgba(0,0,0,0.18),0_20px_40px_-12px_rgba(0,0,0,0.5)]"
      initial={{ y: '130%' }}
      animate={{ y: 0 }}
      exit={{ y: '130%' }}
      transition={reduce ? { duration: 0 } : { delay: 0.45, type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden="true">{game.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-extrabold leading-tight">{name}</h2>
          <p className="mt-0.5 text-sm leading-snug text-[#6b6390]">{game.description}</p>
        </div>
      </div>

      <Link
        href={game.href}
        onClick={() => play('tap')}
        className={cn('toy mt-4 flex min-h-[54px] items-center justify-center rounded-2xl font-display text-xl font-extrabold', BUTTON_TONES[game.id])}
      >
        Open {name}
      </Link>

      {isGuest && (
        <button type="button" onClick={onSignIn} className="mt-3 w-full text-center text-sm font-semibold text-brand">
          Sign in to save your scores
        </button>
      )}
    </motion.div>
  );
}
