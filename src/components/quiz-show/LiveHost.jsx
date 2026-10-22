import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { Share, Tv, X } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { fetchQuestions, rememberSeen } from './data';
import { saveResult } from './LocalGame';
import useLive, { post } from './useLive';
import { JoinForm } from './LivePlayer';
import { FinalScreen, GetReady, QuestionScreen, RevealScreen, ScoresScreen } from './screens';
import { Avatar, Marquee, SHOW_FONT, ShowButton } from './ui';

// Hosting a multi-phone quiz. This screen is the show: put it on a laptop or a
// TV and everyone watches it while answering on their own phones (TV mode is
// simply this screen on a big display). The host's pass is kept on the device,
// so a reload carries on hosting the same quiz.
//
// The host can play too (Ash, 2026-10-22): "I'm playing too" in the lobby
// joins them like any phone, the seat is kept with the host's pass, and this
// screen then takes their answers. On a big screen everyone is watching, so
// there it asks them to join on their phone instead.

export const HOST_KEY = 'quiz:host';
const FIRST_BATCH = 3;

export function loadHost() {
  try {
    return JSON.parse(localStorage.getItem(HOST_KEY) || 'null');
  } catch {
    return null;
  }
}
export function clearHost() {
  try {
    localStorage.removeItem(HOST_KEY);
  } catch {}
}

export default function LiveHost({ setup, resume, onExit }) {
  const { data: session, status } = useSession();
  const [host, setHost] = useState(resume || null); // { code, hostToken, at, recorded?, seat? }
  const [error, setError] = useState('');
  const seat = host?.seat || null; // { playerId, token } when the host is playing too
  const live = useLive(host?.code, { player: seat?.playerId });
  const game = live.game;
  const writing = useRef(false);
  const sentRef = useRef([]); // the questions sent to this game, in order
  const [attempt, setAttempt] = useState(0); // bumped by "Try again"
  const seenPlayers = useRef(0);
  const [big, setBig] = useState(false);
  const [counting, setCounting] = useState(false); // the 3-2-1 before the first question
  const [joining, setJoining] = useState(false); // the host's own join form is open

  const keepHost = (h) => {
    setHost(h);
    try {
      localStorage.setItem(HOST_KEY, JSON.stringify(h));
    } catch {}
  };

  useEffect(() => {
    setBig(window.matchMedia('(min-width: 900px)').matches);
  }, []);

  // Open the quiz on the server.
  useEffect(() => {
    if (host) return;
    post('/api/quiz/live', { settings: { picks: setup.picks, level: setup.level, count: setup.count, timer: setup.timer } })
      .then((data) => {
        // `at` lets the quiz page stop offering it once the server has let it go.
        const h = { code: data.code, hostToken: data.hostToken, at: Date.now() };
        try {
          localStorage.setItem(HOST_KEY, JSON.stringify(h));
        } catch {}
        setHost(h);
        live.apply(data);
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (action, extra = {}) => {
    try {
      live.apply(await post(`/api/quiz/live/${host.code}/host`, { hostToken: host.hostToken, seat, action, ...extra }));
    } catch (err) {
      setError(err.message);
    }
  };

  // The questions, fetched once the host presses Start (Ash, 2026-10-21): by
  // then everyone has joined, so whatever any of them has seen before on a
  // signed-in account is left out. From the bank this takes about a second,
  // inside the 3-2-1. A few first, then the rest.
  useEffect(() => {
    if (!host || !game || writing.current) return;
    if (game.phase === 'ready' && !counting) return;
    const have = game.questionsReady || 0;
    if (have >= game.settings.count || game.phase === 'finished') return;
    writing.current = true;
    (async () => {
      try {
        let got = have;
        const sent = sentRef.current;
        const players = game.players.map((p) => p.name);
        while (got < game.settings.count) {
          const want = got === 0 ? Math.min(FIRST_BATCH, game.settings.count) : game.settings.count - got;
          const qs = await fetchQuestions({ picks: game.settings.picks, level: game.settings.level, count: want, exclude: sent, players });
          if (!qs.length) throw new Error('No questions came back.');
          await act('questions', { questions: qs });
          sent.push(...qs);
          got += qs.length;
        }
      } catch (err) {
        setError(err.message || 'Could not write the questions. Try again?');
      } finally {
        writing.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, game?.questionsReady, game?.phase, counting, attempt]);

  // A pop for each player who joins.
  useEffect(() => {
    const n = game?.players.length || 0;
    if (n > seenPlayers.current) play('pop');
    seenPlayers.current = n;
  }, [game?.players.length]);

  // The result into the signed-in host's history, once.
  useEffect(() => {
    if (!game || game.phase !== 'finished' || host?.recorded || !game.players.length) return;
    keepHost({ ...host, recorded: true });
    if (status === 'authenticated') {
      saveResult(game).catch(() => {});
      rememberSeen(game.players.map((p) => p.name), sentRef.current);
    }
  }, [game, host, status]);

  const end = async () => {
    if (game && game.phase !== 'finished' && !window.confirm('End the quiz for everyone?')) return;
    // The questions already played still count as seen.
    if (game && game.phase !== 'finished' && game.index >= 0 && status === 'authenticated') {
      rememberSeen(game.players.map((p) => p.name), sentRef.current.slice(0, game.index + 1));
    }
    if (game && game.phase !== 'finished') await act('end');
    clearHost();
    onExit();
  };

  if (error && !game) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl" style={SHOW_FONT}>{error}</p>
        <ShowButton className="max-w-xs" onClick={onExit}>Back</ShowButton>
      </div>
    );
  }
  if (live.gone) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl" style={SHOW_FONT}>That quiz has closed.</p>
        <ShowButton className="max-w-xs" onClick={() => { clearHost(); onExit(); }}>Back</ShowButton>
      </div>
    );
  }
  if (!game) return <GetReady game={{ players: [] }} waitingFor />;

  const answered = game.players.filter((p) => p.answers[game.index]).length;
  // The host's own player, while they are still in the quiz.
  const me = seat && game.players.some((p) => p.id === seat.playerId) ? seat.playerId : null;
  const answerIt = async (option) => {
    try {
      live.apply(await post(`/api/quiz/live/${host.code}/answer`, { ...seat, option }));
    } catch {
      play('error');
    }
  };

  if (game.phase === 'ready' && joining) {
    return (
      <JoinForm
        hostCode={host.code}
        defaultName={session?.user?.name?.split(' ')[0] || ''}
        onBack={() => setJoining(false)}
        onJoined={(s, data) => {
          keepHost({ ...host, seat: { playerId: s.playerId, token: s.token } });
          live.apply(data);
          setJoining(false);
        }}
      />
    );
  }

  return (
    <>
      {game.phase !== 'finished' && (
        <button
          type="button"
          onClick={end}
          aria-label="End the quiz"
          className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/30"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {game.phase === 'ready' && counting && <GetReady game={game} />}
      {game.phase === 'ready' && !counting && (
        <Lobby
          game={game}
          code={host.code}
          big={big}
          error={error}
          playing={Boolean(me)}
          onJoin={() => setJoining(true)}
          onStart={() => {
            setCounting(true);
            setTimeout(() => act('start'), 2800);
          }}
          onRemove={(id) => act('remove', { playerId: id })}
        />
      )}
      {game.phase === 'loading' && !error && <GetReady game={game} waitingFor />}
      {game.phase === 'loading' && error && (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-2xl" style={SHOW_FONT}>{error}</p>
          <ShowButton
            className="max-w-xs"
            onClick={() => {
              setError('');
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </ShowButton>
        </div>
      )}
      {game.phase === 'question' && (
        <>
          <QuestionScreen game={game} me={me} onAnswer={me ? answerIt : undefined} big={big} offset={live.offset} answeredCount={answered} />
          <HostBar>
            <button type="button" onClick={() => act('reveal')} className="font-bold underline">Show the answer now</button>
          </HostBar>
        </>
      )}
      {game.phase === 'reveal' && <RevealScreen game={game} me={me} big={big} offset={live.offset} answeredCount={answered} onNext={() => act('scores')} />}
      {game.phase === 'scores' && <ScoresScreen game={game} me={me} big={big} onNext={() => act('next')} />}
      {game.phase === 'finished' && (
        <FinalScreen game={game} me={me} big={big}>
          <ShowButton onClick={() => { clearHost(); onExit({ again: true }); }}>New quiz</ShowButton>
          <ShowButton className="bg-white text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]" onClick={() => { clearHost(); onExit(); }}>
            Back to the quiz
          </ShowButton>
        </FinalScreen>
      )}
    </>
  );
}

function HostBar({ children }) {
  return <div className="fixed inset-x-0 bottom-2 z-20 text-center text-sm text-white/80">{children}</div>;
}

// The lobby: how to join, who has, and the start button.
// Send the invite (Ash, 2026-10-21): copies it, and opens the phone's share
// sheet, which has WhatsApp, Messages and the rest; WhatsApp gets its own
// button too. Both start in the tap itself, as Safari only opens the share
// sheet straight from one.
function ShareInvite({ code, url }) {
  const [copied, setCopied] = useState(false);
  const text = `Join our quiz on GamePad! Tap the link, or open GamePad, Quiz, Join and type the code ${code}.`;
  const share = () => {
    play('tap');
    navigator.clipboard
      ?.writeText(`${text}\n${url}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {});
    if (navigator.share) navigator.share({ title: 'Quiz Night on GamePad', text, url }).catch(() => {});
  };
  return (
    <div className="mt-3 flex justify-center gap-2">
      <button type="button" onClick={share} className="toy flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 font-bold text-white [--toy-edge:theme(colors.violet.800)]">
        <Share className="h-4 w-4" aria-hidden="true" />
        {copied ? 'Copied!' : 'Share invite'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => play('tap')}
        className="toy flex items-center gap-2 rounded-2xl bg-[#25d366] px-4 py-2 font-bold text-[#073b1c] [--toy-edge:#128c3e]"
      >
        WhatsApp
      </a>
    </div>
  );
}

function Lobby({ game, code, big, error, playing, onJoin, onStart, onRemove }) {
  const [qr, setQr] = useState(null);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/games/quiz/join?code=${code}` : '';
  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then((m) => m.toDataURL(url, { margin: 1, width: 360, color: { dark: '#241a45', light: '#ffffff' } }))
      .then((d) => alive && setQr(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);
  return (
    <div className={big ? 'mx-auto grid min-h-dvh max-w-6xl grid-cols-2 items-center gap-10 px-8 py-10' : 'mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]'}>
      <div className="flex flex-col items-center gap-5 text-center">
        <Marquee small={!big}>Quiz Night</Marquee>
        <div className="rounded-3xl bg-white p-4 text-[#241a45] shadow-[0_8px_0_rgba(0,0,0,0.25)]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6b6390]">Join on your phone</p>
          <p className={big ? 'mt-1 text-7xl tracking-[0.15em]' : 'mt-1 text-5xl tracking-[0.15em]'} style={SHOW_FONT}>{code}</p>
          {qr && <img src={qr} alt={`QR code to join quiz ${code}`} className={big ? 'mx-auto mt-3 h-56 w-56' : 'mx-auto mt-3 h-40 w-40'} />}
          <p className="mt-2 text-sm font-semibold text-[#6b6390]">Scan it, or go to GamePad → Quiz → Join</p>
          <ShareInvite code={code} url={url} />
        </div>
        {big && (
          <p className="flex items-center gap-2 text-white/80">
            <Tv className="h-5 w-5" aria-hidden="true" /> This screen is the show: everyone watches it.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-center text-3xl" style={SHOW_FONT}>
          {game.players.length ? `${game.players.length} in the studio` : 'Waiting for players…'}
        </h2>
        <ul className="flex flex-wrap justify-center gap-3">
          <AnimatePresence>
            {game.players.map((p) => (
              <motion.li key={p.id} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="flex flex-col items-center">
                <button type="button" onClick={() => window.confirm(`Remove ${p.name}?`) && onRemove(p.id)} aria-label={`${p.name}. Tap to remove`}>
                  <Avatar player={p} size={big ? 72 : 56} />
                </button>
                <span className="mt-1 max-w-[6rem] truncate text-lg" style={SHOW_FONT}>{p.name}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {error && <p className="text-center font-semibold text-rose-200">{error}</p>}
        {!playing &&
          (big ? (
            <p className="text-center text-white/80">Playing too? Join on your phone with the code.</p>
          ) : (
            <ShowButton className="bg-white text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]" onClick={onJoin}>
              I’m playing too
            </ShowButton>
          ))}
        {/* The questions are fetched once Start is pressed, for the players who joined. */}
        <ShowButton onClick={onStart} disabled={!game.players.length}>
          {game.players.length ? 'Start the quiz!' : 'Waiting for players'}
        </ShowButton>
      </div>
    </div>
  );
}
