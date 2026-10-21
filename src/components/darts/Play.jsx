import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Keyboard, Undo2 } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { buzz, celebrate } from '@/components/arcade/feedback';
import { callVisit, say } from '@/components/arcade/caller';
import { useBanner } from '@/components/arcade/Banner';
import NumericKeypad from '@/components/game/NumericKeypad';
import { Avatar } from '@/components/quiz-show/ui';
import { GAME_MODES } from '@/data/dartsConstants';
import { BULL } from '@/lib/darts/board';
import { checkoutRoute, routeDarts } from '@/lib/darts/checkout';
import { CLOCK, CRICKET, endTurn, enterTotal, replay, throwDart, undo } from '@/lib/darts/rules';
import { cn } from '@/lib/cn';
import Dartboard from './Dartboard';
import GameOver from './GameOver';
import { BOARDS } from './Scoreboards';
import { RulesSheet } from './Setup';
import { DartSlot, SHOW_FONT, TopBar } from './ui';

// A game in play: the scores, whose throw it is with their three darts, and
// the board to tap. Every move goes through lib/darts/rules.js and comes back
// as a new match, which the page saves.

export default function Play({ match, onChange, onExit, onAgain, onNew }) {
  const s = useMemo(() => replay(match), [match]);
  const banner = useBanner();
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(0);
  const [rules, setRules] = useState(false);

  const mode = GAME_MODES.find((m) => m.id === match.mode);
  const p = s.turn.player;
  const cur = match.players[p];
  const name = (i) => match.players[i]?.name;
  const dartsLeft = 3 - s.turn.darts.length;

  const showFlash = (big, sub, tone = 'score') => {
    const id = Date.now();
    setFlash({ id, big, sub, tone });
    setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 1200);
  };

  // What the room hears and sees when a dart lands.
  const react = (after, kind, last) => {
    const ev = after.events;
    const has = (t) => ev.some((e) => e.type === t);
    if (kind === 'dart') play(last?.n ? 'thunk' : 'tap');
    for (const e of ev) {
      switch (e.type) {
        case 'bust':
          play('wrong');
          buzz([80, 40, 80]);
          setShake((k) => k + 1);
          say('Bust!');
          showFlash('BUST', name(e.player), 'bust');
          break;
        case 'in':
          banner.show({ title: 'Game on!', text: `${name(e.player)} is in` });
          break;
        case 'leg':
          play('line');
          celebrate('small');
          say('Game shot!');
          banner.show({ title: 'GAME SHOT!', text: `${name(e.player)} takes the leg`, tone: 'win', big: true, hold: 2600 });
          break;
        case 'match':
          play('win');
          celebrate('big');
          say(match.mode === 'x01' ? 'Game shot, and the match!' : `${name(e.player)} wins!`);
          break;
        case 'closed':
        case 'advance':
          play('correct');
          break;
        case 'killer':
          play('line');
          say('Killer!');
          banner.show({ title: `${name(e.player)} is a KILLER!`, tone: 'win', big: true });
          break;
        case 'life':
          play('wrong');
          buzz(60);
          break;
        case 'out':
          say(`${name(e.player)} is out!`);
          banner.show({ title: `${name(e.player)} is out!`, tone: 'rival' });
          break;
        case 'visit':
          if (e.bust || has('checkout') || has('match')) break;
          if (match.mode === 'x01') {
            callVisit(e.total);
            if (e.total === 180) {
              play('win');
              celebrate('big');
              buzz([60, 40, 60, 40, 200]);
              banner.show({ title: 'ONE HUNDRED AND EIGHTY!', tone: 'win', big: true, hold: 3000 });
            } else if (e.total >= 100) play('line');
            showFlash(e.total, name(e.player));
          } else if (match.mode !== 'killer' && e.total > 0) {
            showFlash(`+${e.total}`, name(e.player));
          }
          break;
        default:
      }
    }
  };

  const act = (next, kind) => {
    if (next === match) {
      if (kind === 'undo' || kind === 'dart') play('error');
      return;
    }
    onChange(next);
    if (kind === 'undo') {
      play('unstamp');
      setFlash(null);
      return;
    }
    react(replay(next), kind, next.log[next.log.length - 1]);
  };

  const hit = (dart) => act(throwDart(match, dart), 'dart');

  // ── What the board shows for this game ──
  let route = null;
  let boardProps = {};
  let hint = '';
  let quick = [];
  if (match.mode === 'x01') {
    const left = s.remaining[p];
    if (!s.isIn[p]) hint = 'Hit a double to start scoring';
    else {
      route = checkoutRoute(left, dartsLeft, match.settings.doubleOut);
      hint = s.turn.darts.length ? `${s.turn.scored} so far · ${left} left` : `${left} to go`;
    }
    boardProps = { glow: routeDarts(route).map((d, k) => ({ ...d, strong: k === 0 })) };
  } else if (match.mode === 'cricket') {
    const shut = (n) => s.marks.every((row) => row[CRICKET.indexOf(n)] >= 3);
    boardProps = { dim: (n) => !CRICKET.includes(n) || shut(n) };
    const open = CRICKET.filter((n, t) => s.marks[p][t] < 3).map((n) => (n === BULL ? 'Bull' : n));
    hint = s.turn.scored ? `+${s.turn.scored} this visit` : open.length ? `Still to close: ${open.join(' ')}` : 'All closed: score to win';
  } else if (match.mode === 'around-the-clock') {
    const target = CLOCK[s.target[p]];
    boardProps = {
      dim: (n) => n !== target,
      glow: target === BULL ? [{ n: BULL, m: 1, strong: true }, { n: BULL, m: 2, strong: true }] : [{ n: target, m: 0, strong: true }],
    };
    hint = `Aim for ${target === BULL ? 'the bull' : target}`;
    quick = [{ text: `Hit ${target === BULL ? 'Bull' : target}`, dart: { n: target, m: 1 } }];
  } else if (match.mode === 'killer') {
    const mine = s.numbers[p];
    const others = match.players.map((_, i) => i).filter((i) => i !== p && s.alive[i]);
    boardProps = {
      tags: match.players.map((pl, i) => (s.alive[i] ? { n: s.numbers[i], color: pl.color } : null)).filter(Boolean),
      glow: s.killer[p] ? others.map((i) => ({ n: s.numbers[i], m: 2, strong: true })) : [{ n: mine, m: 2, strong: true }],
    };
    hint = s.killer[p] ? 'Hunt! Hit their doubles' : `Hit double ${mine} to become a killer`;
    quick = s.killer[p]
      ? others.map((i) => ({ text: `D${s.numbers[i]} ${name(i)}`, dart: { n: s.numbers[i], m: 2 }, color: match.players[i].color }))
      : [{ text: `Hit D${mine}`, dart: { n: mine, m: 2 }, color: cur.color }];
  }

  const Board = BOARDS[match.mode];
  const title =
    match.mode === 'x01'
      ? `${match.settings.start}${match.settings.legs > 1 ? ` · Leg ${s.leg}` : ''} · Round ${s.round}`
      : `${mode?.name} · Round ${s.round}`;

  // The typed total, for X01.
  const n = parseInt(typed, 10) || 0;
  const remaining = match.mode === 'x01' ? s.remaining[p] : 0;
  const wouldBust = typed !== '' && (n > remaining || (match.settings.doubleOut && remaining - n === 1));
  const isOut = typed !== '' && n === remaining;
  const submitTyped = () => {
    if (typed === '') return;
    act(enterTotal(match, n), 'total');
    setTyped('');
    setTyping(false);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-2.5 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <TopBar
        onBack={onExit}
        backLabel="Leave the game (it is saved)"
        right={
          <button type="button" onClick={() => setRules(true)} aria-label="How to play" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/85 text-[#16302f]">
            <Info className="h-5 w-5" aria-hidden="true" />
          </button>
        }
      >
        {title}
      </TopBar>

      <Board match={match} s={s} />

      {/* Whose throw, and their three darts. */}
      <div className="rounded-2xl bg-black/40 p-2.5 ring-1 ring-white/15">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar player={cur} size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl leading-tight" style={SHOW_FONT}>{cur.name}</div>
            <div className="truncate text-xs font-semibold text-white/80">{hint}</div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {[0, 1, 2].map((k) => (
              <DartSlot key={k} dart={s.turn.darts[k]} active={k === s.turn.darts.length} />
            ))}
          </div>
        </div>
        {route && (
          <div className="mt-2 flex items-center justify-center gap-1.5" aria-label={`Checkout: ${route.join(', ')}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-amber-200">Out</span>
            {route.map((r, k) => (
              <span key={k} className={cn('rounded-lg px-2 py-0.5 text-lg', k === 0 ? 'bg-amber-300 text-amber-950' : 'bg-white/15')} style={SHOW_FONT}>
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The board, or the keypad for a typed total. */}
      <div className="relative">
        {typing ? (
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white/95 p-3 text-[#16302f]">
            <div className={cn('rounded-2xl py-2 text-center', wouldBust ? 'bg-rose-100 text-rose-600' : isOut ? 'bg-emerald-100 text-emerald-700' : 'bg-[#eef3f2]')}>
              <div className="text-5xl leading-none tnum" style={SHOW_FONT}>{typed || '0'}</div>
              <div className="mt-1 text-sm font-semibold">{wouldBust ? 'That would be a bust' : isOut ? 'Checkout!' : `${cur.name}'s three darts`}</div>
            </div>
            <NumericKeypad
              className="mt-3"
              value={typed}
              onChange={setTyped}
              max={180}
              maxLength={3}
              onSubmit={submitTyped}
              submitLabel={wouldBust ? 'Bust' : isOut ? 'Check out' : 'Score it'}
              extraKey={
                <button type="button" onClick={() => setTyping(false)} className="press flex min-h-[56px] items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground">
                  Board
                </button>
              }
            />
          </div>
        ) : (
          <motion.div
            key={shake}
            animate={shake ? { x: [0, -14, 14, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full"
            style={{ maxWidth: 'min(100%, 54dvh)' }}
          >
            <Dartboard onHit={s.finished ? undefined : hit} darts={s.turn.darts.filter((d) => d.n != null)} font={SHOW_FONT} {...boardProps} />
          </motion.div>
        )}

        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.id}
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            >
              <span
                className={cn('rounded-3xl px-6 py-2 text-7xl leading-none tnum shadow-2xl', flash.tone === 'bust' ? 'bg-rose-600 text-white' : 'bg-amber-300 text-amber-950')}
                style={SHOW_FONT}
              >
                {flash.big}
              </span>
              {flash.sub && <span className="mt-2 rounded-full bg-black/60 px-3 py-0.5 text-lg" style={SHOW_FONT}>{flash.sub}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The old one-tap buttons, kept: Around the Clock's Hit, Killer's doubles. */}
      {quick.length > 0 && !typing && (
        <div className="flex flex-wrap justify-center gap-2">
          {quick.map((q) => (
            <button
              key={q.text}
              type="button"
              onClick={() => hit(q.dart)}
              className="toy min-h-[48px] rounded-2xl bg-emerald-500 px-4 text-xl text-white [--toy-edge:theme(colors.emerald.800)]"
              style={{ ...SHOW_FONT, ...(q.color ? { background: q.color, '--toy-edge': 'rgba(0,0,0,0.35)' } : {}) }}
            >
              {q.text}
            </button>
          ))}
        </div>
      )}

      {!typing && (
        <div className="grid grid-cols-3 gap-2">
          <Action onClick={() => hit({ n: 0, m: 0 })} className="bg-white/90 text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]">
            Miss
          </Action>
          <Action onClick={() => act(undo(match), 'undo')} disabled={!match.log.length} className="bg-white/90 text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]">
            <Undo2 className="h-5 w-5" aria-hidden="true" /> Undo
          </Action>
          {match.mode === 'x01' && s.turn.darts.length === 0 ? (
            <Action
              onClick={() => {
                play('tap');
                setTyping(true);
              }}
              className="bg-sky-400 text-sky-950 [--toy-edge:theme(colors.sky.700)]"
            >
              <Keyboard className="h-5 w-5" aria-hidden="true" /> Type
            </Action>
          ) : (
            <Action onClick={() => act(endTurn(match), 'end')} className="bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]">
              Next ›
            </Action>
          )}
        </div>
      )}

      <RulesSheet mode={rules ? mode : null} onClose={() => setRules(false)} />

      {s.finished && (
        <GameOver match={match} s={s} onUndo={() => act(undo(match), 'undo')} onAgain={onAgain} onNew={onNew} onDone={onExit} />
      )}
    </div>
  );
}

function Action({ className, children, ...props }) {
  return (
    <button type="button" className={cn('toy flex min-h-[54px] items-center justify-center gap-1.5 rounded-2xl text-xl disabled:opacity-40', className)} style={SHOW_FONT} {...props}>
      {children}
    </button>
  );
}
