import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Delete, Flag, Undo2 } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { buzz, celebrate } from '@/components/arcade/feedback';
import { useBanner } from '@/components/arcade/Banner';
import { Avatar } from '@/components/quiz-show/ui';
import { BIG_TURN, BINGO, MAX_SCORE, addTurn, finish, pass, reopen, replay, undo } from '@/lib/scrabble/rules';
import { cn } from '@/lib/cn';
import GameOver from './GameOver';
import WordCheck from './WordCheck';
import { handoffOn, setHandoff } from './store';
import { CountUp, SHOW_FONT, Sheet, TopBar, letterValue } from './ui';

// A game in play: the scoreboard, whose go it is, and a keypad of tiles for
// the turn's score. Every move goes through lib/scrabble/rules.js and comes
// back as a new match, which the page saves. Turns cannot be edited, only
// undone from the last, which is what keeps every score on the right turn.

// Each digit key's corner number is the Scrabble value of the first letter of
// its name: ZERO's Z is worth 10, FOUR's F is worth 4.
const DIGIT_NAMES = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const KEY_TILE = 'toy relative flex h-[52px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#fbefd2] to-[#ecd7a6] text-3xl text-[#3b2414] [--toy-edge:#b08a4f]';

export default function Play({ match, onChange, onExit, onAgain, onNew }) {
  const s = useMemo(() => replay(match), [match]);
  const banner = useBanner();
  const [typed, setTyped] = useState('');
  const [bingo, setBingo] = useState(false);
  const [word, setWord] = useState('');
  const [handoff, setHandoffCard] = useState(null);
  const [history, setHistory] = useState(null);
  const [checking, setChecking] = useState(false);

  const p = s.current;
  const cur = match.players[p];
  const name = (i) => match.players[i]?.name;
  const total = (parseInt(typed, 10) || 0) + (bingo ? BINGO : 0);
  const canScore = !s.finished && (typed !== '' || bingo) && total <= MAX_SCORE;

  const clearEntry = () => {
    setTyped('');
    setBingo(false);
    setWord('');
  };

  // What the table hears and sees after a turn.
  const react = (before, after, turn) => {
    const who = name(turn.p);
    if (turn.pass) play('whoosh');
    else if (turn.bingo) {
      play('win');
      celebrate('big', [cur.color, '#fbefd2', '#f59e0b']);
      buzz([60, 40, 60, 40, 200]);
      banner.show({ title: 'BINGO!', text: `${who} used all seven tiles: ${turn.score}`, tone: 'win', big: true, hold: 2800 });
    } else if (turn.score >= BIG_TURN) {
      play('line');
      celebrate('small');
      buzz([40, 30, 80]);
      banner.show({ title: `${turn.score}!`, text: `What a turn, ${who}`, tone: 'win', big: true });
    } else {
      play('stamp');
      buzz(20);
    }
    if (before.top > 0 && before.leader !== turn.p && after.leader === turn.p) {
      play('sting');
      banner.show({ title: 'OVERTAKE!', text: `${who} takes the lead`, tone: 'rival', big: true });
    }
    if (handoffOn()) setHandoffCard({ id: Date.now(), from: turn.p, to: after.current, score: turn.score, pass: !!turn.pass, word: turn.word });
  };

  const commit = (next) => {
    if (next === match) {
      play('error');
      return;
    }
    onChange(next);
    clearEntry();
    const after = replay(next);
    react(s, after, after.last);
  };

  const score = () => canScore && commit(addTurn(match, { score: total, word, bingo }));
  const doPass = () => commit(pass(match));
  const doUndo = () => {
    const next = undo(match);
    if (next === match) {
      play('error');
      return;
    }
    onChange(next);
    clearEntry();
    setHandoffCard(null);
    play('unstamp');
  };

  const press = useCallback(
    (key) => {
      if (key === 'del') {
        play('back');
        setTyped((t) => t.slice(0, -1));
        return;
      }
      if (key === 'bingo') {
        play(bingo ? 'unstamp' : 'pop');
        setBingo(!bingo);
        return;
      }
      play('tap');
      setTyped((t) => (t === '0' ? key : t.length >= 3 ? t : t + key));
    },
    [bingo],
  );

  // A keyboard works too, for a laptop on the table.
  useEffect(() => {
    if (s.finished) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [role="dialog"]')) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter' && canScore) score();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const endGame = () => {
    if (!window.confirm(match.log.length ? 'End the game and see who won?' : 'Nobody has scored yet. End the game anyway?')) return;
    play('win');
    celebrate('big');
    onChange(finish(match));
  };

  const last = s.last;
  const ranked = s.standings.map((r) => r.index);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-2.5 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <TopBar
        onBack={onExit}
        backLabel="Leave the game (it is saved)"
        right={
          <>
            <button type="button" onClick={() => setChecking(true)} aria-label="Is that a word?" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbf0d6] text-[#3b2414]">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={endGame} aria-label="End the game" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbf0d6] text-[#3b2414]">
              <Flag className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        }
      >
        Round {s.round}
      </TopBar>

      {/* The scores, best first, so a player who overtakes moves up. Tap for their turns. */}
      <div className="grid grid-cols-2 gap-2">
        {ranked.map((i) => {
          const pl = match.players[i];
          const mine = s.turns[i];
          const lastTurn = mine[mine.length - 1];
          const active = i === p && !s.finished;
          return (
            <motion.button
              key={pl.id}
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              type="button"
              onClick={() => setHistory(i)}
              aria-label={`${pl.name}: ${s.totals[i]}. Show their turns`}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-2xl p-2 text-left',
                active ? 'bg-[#fbf0d6] text-[#3b2414] ring-4 ring-amber-300' : 'bg-black/45 text-white ring-1 ring-white/15',
              )}
            >
              <span className="relative shrink-0">
                <Avatar player={pl} size={36} />
                {s.leader === i && (
                  <span className="absolute -right-1.5 -top-2.5 text-lg" aria-hidden="true">
                    👑
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg leading-tight" style={SHOW_FONT}>{pl.name}</span>
                <span className="block truncate text-xs font-semibold opacity-75">
                  {lastTurn ? (lastTurn.pass ? 'passed' : `last +${lastTurn.score}`) : 'no turns yet'}
                </span>
              </span>
              <span className="shrink-0 text-3xl leading-none tnum" style={SHOW_FONT}>
                <CountUp value={s.totals[i]} />
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Whose go it is, and the score so far. */}
      <div className="rounded-3xl bg-black/45 p-3 ring-1 ring-white/15">
        <div className="flex min-w-0 items-center gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={cur.id} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <Avatar player={cur} size={48} />
            </motion.span>
          </AnimatePresence>
          <div className="min-w-0 flex-1">
            <div className="truncate text-3xl leading-tight" style={SHOW_FONT}>{cur.name}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-amber-200">your go</div>
          </div>
          <div className={cn('flex min-w-[5.5rem] shrink-0 flex-col items-end rounded-2xl px-3 py-1', bingo ? 'bg-amber-300 text-amber-950' : 'bg-[#fbf0d6] text-[#3b2414]')}>
            <span className={cn('text-5xl leading-none tnum', typed === '' && !bingo && 'opacity-30')} style={SHOW_FONT}>
              {total}
            </span>
            {bingo && <span className="text-[0.7rem] font-bold">{typed || 0} + 50 bingo</span>}
          </div>
        </div>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 15).toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && score()}
          placeholder="The word (optional)"
          aria-label="The word played (optional, for best word)"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          className="mt-2.5 w-full rounded-xl bg-white/15 px-3 py-2 text-lg tracking-wider text-white outline-none ring-1 ring-white/20 placeholder:text-white/55 focus:ring-2 focus:ring-amber-300"
          style={SHOW_FONT}
        />
      </div>

      {/* The keypad: Scrabble tiles. */}
      <div className="mt-auto grid grid-cols-3 gap-2" role="group" aria-label="Score keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <DigitKey key={d} d={d} onPress={press} />
        ))}
        <button type="button" onClick={() => press('del')} aria-label="Delete a digit" className={KEY_TILE}>
          <Delete className="h-7 w-7" aria-hidden="true" />
        </button>
        <DigitKey d="0" onPress={press} />
        <button
          type="button"
          onClick={() => press('bingo')}
          aria-pressed={bingo}
          aria-label="Used all seven tiles: add 50"
          className={cn(KEY_TILE, 'flex-col leading-none', bingo && 'from-amber-300 to-amber-400 text-amber-950 ring-4 ring-amber-200 [--toy-edge:theme(colors.amber.600)]')}
          style={SHOW_FONT}
        >
          +50
          <span className="mt-0.5 text-[0.6rem] font-body font-bold uppercase tracking-wide">all 7 tiles</span>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_1.2fr_1.4fr] gap-2">
        <Action onClick={doPass} disabled={s.finished} className="bg-white/90 text-[#3b2414] [--toy-edge:rgba(0,0,0,0.3)]">
          Pass
        </Action>
        <Action onClick={doUndo} disabled={!match.log.length} className="flex-col gap-0 bg-white/90 text-[#3b2414] [--toy-edge:rgba(0,0,0,0.3)]">
          <span className="flex items-center gap-1.5">
            <Undo2 className="h-5 w-5" aria-hidden="true" /> Undo
          </span>
          {last && <span className="max-w-full truncate px-1 font-body text-[0.65rem] font-bold leading-tight opacity-75">{name(last.p)} {last.pass ? 'pass' : `+${last.score}`}</span>}
        </Action>
        <Action onClick={score} disabled={!canScore} className="bg-emerald-600 text-white [--toy-edge:theme(colors.emerald.800)]">
          Score it
        </Action>
      </div>

      <Handoff card={handoff} match={match} onClose={() => setHandoffCard(null)} />
      <History match={match} s={s} index={history} onClose={() => setHistory(null)} />
      <WordCheck open={checking} onClose={() => setChecking(false)} initial={word} />

      {s.finished && <GameOver match={match} s={s} onBack={() => onChange(reopen(match))} onAgain={onAgain} onNew={onNew} onDone={onExit} />}
    </div>
  );
}

function DigitKey({ d, onPress }) {
  return (
    <button type="button" onClick={() => onPress(d)} className={KEY_TILE} style={SHOW_FONT}>
      {d}
      <span className="absolute bottom-1.5 right-2.5 text-[0.65rem] leading-none" aria-hidden="true">
        {letterValue(DIGIT_NAMES[+d][0])}
      </span>
    </button>
  );
}

function Action({ className, children, ...props }) {
  return (
    <button type="button" className={cn('toy flex min-h-[56px] min-w-0 items-center justify-center gap-1.5 rounded-2xl text-xl disabled:opacity-40', className)} style={SHOW_FONT} {...props}>
      {children}
    </button>
  );
}

/** "Pass the phone to …", after each turn. Tap anywhere to carry on. */
function Handoff({ card, match, onClose }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.id}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-label={`Pass the phone to ${match.players[card.to].name}`}
        >
          <motion.div
            className="w-full max-w-xs rounded-3xl bg-[#fbf3e1] p-5 text-center text-[#3b2414] shadow-2xl"
            initial={{ y: 40, scale: 0.85, rotate: -3 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <p className="text-sm font-bold text-[#7a5c3e]">
              {card.pass ? `${match.players[card.from].name} passed` : `${match.players[card.from].name} +${card.score}${card.word ? ` for ${card.word}` : ''}`}
            </p>
            <p className="mt-3 text-lg font-semibold">Pass the phone to</p>
            <div className="mt-2 flex justify-center">
              <Avatar player={match.players[card.to]} size={72} />
            </div>
            <p className="mt-2 truncate text-4xl" style={SHOW_FONT}>{match.players[card.to].name}</p>
            <button type="button" onClick={onClose} className="toy mt-4 min-h-[52px] w-full rounded-2xl bg-emerald-600 text-2xl text-white [--toy-edge:theme(colors.emerald.800)]" style={SHOW_FONT}>
              Got it
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHandoff(false);
                onClose();
              }}
              className="mt-3 text-xs font-semibold text-[#7a5c3e] underline underline-offset-4"
            >
              Don&apos;t show this between turns
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One player's turns. Read-only: a wrong score is put right with Undo. */
function History({ match, s, index, onClose }) {
  const open = index != null;
  const pl = open ? match.players[index] : null;
  const turns = open ? s.turns[index] : [];
  const st = open ? s.stats[index] : null;
  return (
    <Sheet open={open} onClose={onClose} label={pl ? `${pl.name}'s turns` : 'Turns'}>
      {pl && (
        <>
          <div className="flex items-center gap-3">
            <Avatar player={pl} size={48} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-3xl" style={SHOW_FONT}>{pl.name}</h2>
              <p className="text-sm font-semibold text-[#7a5c3e]">
                {s.totals[index]} points · {st.turns} turn{st.turns === 1 ? '' : 's'}
                {st.turns ? ` · average ${st.average} · best ${st.best}` : ''}
                {s.bingos[index] ? ` · ${s.bingos[index]} bingo${s.bingos[index] === 1 ? '' : 's'}` : ''}
              </p>
            </div>
          </div>
          {turns.length ? (
            <ol className="mt-4 space-y-1.5">
              {turns.map((t) => (
                <li key={t.at} className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-3 py-2">
                  <span className="w-14 shrink-0 text-xs font-bold uppercase text-[#a08560]">Round {t.round}</span>
                  <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>
                    {t.pass ? <span className="text-[#a08560]">Passed</span> : t.word || '—'}
                    {t.bingo && <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 align-middle text-xs text-amber-950">BINGO</span>}
                  </span>
                  <span className="shrink-0 text-2xl tnum" style={SHOW_FONT}>{t.score}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-center font-semibold text-[#7a5c3e]">No turns yet.</p>
          )}
          <p className="mt-4 text-xs font-semibold text-[#7a5c3e]">A score went in wrong? Undo takes back the last turn, then score it again.</p>
        </>
      )}
    </Sheet>
  );
}
