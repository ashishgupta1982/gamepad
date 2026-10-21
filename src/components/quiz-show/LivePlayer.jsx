import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { standings } from '@/lib/quiz/machine';
import useLive, { post } from './useLive';
import { AVATARS, COLORS } from './Setup';
import { FinalScreen, QuestionScreen, RateQuestion, RevealScreen } from './screens';
import { nameKey } from '@/lib/quiz/seen';
import { useSeenPlayers } from './data';
import { Avatar, Leaderboard, Marquee, NamePills, SHOW_FONT, ShowButton } from './ui';

// A player's phone in a multi-phone quiz: join with the code, then answer.
// The pass from joining is kept on the phone, so a dropped connection or a
// reload comes straight back in as the same player with the same score.

export const PLAYER_KEY = 'quiz:player';

function loadSeat() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function LivePlayer({ initialCode = '', onLeave }) {
  const { data: session } = useSession();
  const [seat, setSeat] = useState(null); // { code, playerId, token }
  const [checking, setChecking] = useState(true);
  const live = useLive(seat?.code, { player: seat?.playerId });

  // Come back in as yourself, if this phone was already in this quiz.
  useEffect(() => {
    const saved = loadSeat();
    if (!saved || (initialCode && saved.code !== initialCode.toUpperCase())) {
      setChecking(false);
      return;
    }
    post(`/api/quiz/live/${saved.code}/join`, { playerId: saved.playerId, token: saved.token })
      .then((data) => {
        setSeat(saved);
        live.apply(data);
      })
      .catch(() => {
        try {
          localStorage.removeItem(PLAYER_KEY);
        } catch {}
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leave = () => {
    try {
      localStorage.removeItem(PLAYER_KEY);
    } catch {}
    onLeave();
  };

  if (checking) return null;
  if (!seat) {
    return (
      <JoinForm
        initialCode={initialCode}
        defaultName={session?.user?.name?.split(' ')[0] || ''}
        onBack={onLeave}
        onJoined={(s, data) => {
          try {
            localStorage.setItem(PLAYER_KEY, JSON.stringify(s));
          } catch {}
          setSeat(s);
          live.apply(data);
        }}
      />
    );
  }

  const game = live.game;
  if (live.gone) {
    return (
      <Centre>
        <p className="text-3xl" style={SHOW_FONT}>That quiz has closed.</p>
        <ShowButton className="max-w-xs" onClick={leave}>Back</ShowButton>
      </Centre>
    );
  }
  if (!game) return <Centre><p className="text-2xl" style={SHOW_FONT}>Joining…</p></Centre>;

  const me = game.players.find((p) => p.id === seat.playerId);
  if (!me) {
    return (
      <Centre>
        <p className="text-3xl" style={SHOW_FONT}>You’re not in this quiz any more.</p>
        <ShowButton className="max-w-xs" onClick={leave}>Back</ShowButton>
      </Centre>
    );
  }

  const answerIt = async (option) => {
    try {
      live.apply(await post(`/api/quiz/live/${seat.code}/answer`, { playerId: seat.playerId, token: seat.token, option }));
    } catch {
      play('error');
    }
  };

  return (
    <>
      {live.offline && <p className="fixed inset-x-0 top-0 z-40 bg-rose-500 py-1 text-center text-sm font-bold">Reconnecting…</p>}

      {game.phase === 'ready' && (
        <Centre>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
            <Avatar player={me} size={110} />
          </motion.div>
          <p className="text-4xl" style={SHOW_FONT}>You’re in, {me.name}!</p>
          <p className="text-lg text-white/85">Watch the host’s screen. The quiz starts any moment.</p>
          <p className="text-sm text-white/70">{game.players.length} playing</p>
        </Centre>
      )}
      {game.phase === 'loading' && (
        <Centre>
          <p className="text-3xl" style={SHOW_FONT}>Next question coming…</p>
        </Centre>
      )}
      {game.phase === 'question' && <QuestionScreen game={game} me={me.id} offset={live.offset} onAnswer={answerIt} />}
      {game.phase === 'reveal' && <RevealScreen game={game} me={me.id} offset={live.offset} />}
      {game.phase === 'scores' && <PlayerScores game={game} me={me} />}
      {game.phase === 'finished' && (
        <FinalScreen game={game} me={me.id}>
          <ShowButton onClick={leave}>Done</ShowButton>
        </FinalScreen>
      )}
    </>
  );
}

function Centre({ children }) {
  return <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">{children}</div>;
}

function PlayerScores({ game, me }) {
  const rows = standings(game);
  const mine = rows.find((r) => r.id === me.id);
  const gained = {};
  for (const p of game.players) gained[p.id] = p.answers[game.index]?.points || 0;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <p className="text-lg text-white/80">You’re</p>
        <p className="text-7xl text-amber-300" style={SHOW_FONT}>
          {mine.place}
          <sup className="text-3xl">{ordinal(mine.place)}</sup>
        </p>
        <p className="text-2xl" style={SHOW_FONT}>{mine.score} points</p>
      </div>
      <Leaderboard rows={rows.slice(0, 5)} highlight={me.id} gained={gained} />
      {/* Each player rates on their own phone; the big screen does not. */}
      {game.questions[game.index] && <RateQuestion key={game.questions[game.index].id} id={game.questions[game.index].id} />}
    </div>
  );
}

const ordinal = (n) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

function JoinForm({ initialCode, defaultName, onBack, onJoined }) {
  const [code, setCode] = useState(initialCode.toUpperCase().slice(0, 6));
  const [name, setName] = useState(defaultName);
  // On a signed-in phone, the names this account has played under.
  const known = useSeenPlayers().players.map((p) => p.name);
  const [avatar, setAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const color = COLORS[AVATARS.indexOf(avatar) % COLORS.length];

  const join = async (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return setError('The code is six letters and numbers, on the host’s screen.');
    if (!name.trim()) return setError('Give yourself a name.');
    setBusy(true);
    try {
      const data = await post(`/api/quiz/live/${code}/join`, { name, avatar, color });
      play('pop');
      onJoined({ code, playerId: data.playerId, token: data.token }, data);
    } catch (err) {
      play('error');
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={join} className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label="Back" className="toy flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="text-center">
        <Marquee small>Join the quiz</Marquee>
      </div>
      <label className="block">
        <span className="mb-1 block text-lg" style={SHOW_FONT}>Code from the host’s screen</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          placeholder="ABC123"
          className="w-full rounded-2xl bg-white px-4 py-3 text-center text-4xl tracking-[0.3em] text-[#241a45] outline-none ring-4 ring-transparent focus:ring-amber-300"
          style={SHOW_FONT}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-lg" style={SHOW_FONT}>Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          className="w-full rounded-2xl bg-white px-4 py-3 text-2xl text-[#241a45] outline-none ring-4 ring-transparent focus:ring-amber-300"
          style={SHOW_FONT}
        />
        <NamePills
          names={known}
          isOn={(n) => nameKey(n) === nameKey(name)}
          onPick={(n) => {
            play('tap');
            setName(n);
          }}
          label="Or tap who you are"
        />
      </label>
      <div>
        <span className="mb-1 block text-lg" style={SHOW_FONT}>Pick your face</span>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATARS.map((a, i) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-pressed={avatar === a}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl ${avatar === a ? 'ring-4 ring-amber-300' : 'opacity-80'}`}
              style={{ background: COLORS[i % COLORS.length] }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="rounded-xl bg-rose-500/90 px-3 py-2 font-semibold">{error}</p>}
      <ShowButton type="submit" disabled={busy} className="mt-auto">
        {busy ? 'Joining…' : 'I’m in!'}
      </ShowButton>
    </form>
  );
}
