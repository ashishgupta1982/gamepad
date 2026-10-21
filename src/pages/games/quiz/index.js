import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useWakeLock from '@/hooks/useWakeLock';
import { Stage } from '@/components/quiz-show/ui';
import QuizHome, { History } from '@/components/quiz-show/QuizHome';
import Setup from '@/components/quiz-show/Setup';
import LocalGame, { clearLocal, loadLocal } from '@/components/quiz-show/LocalGame';
import LiveHost, { clearHost, loadHost } from '@/components/quiz-show/LiveHost';

// The quiz, rebuilt as a game show (REDESIGN-PLAN.md, Phase 3).
//
// Three ways to play, chosen in setup:
//   solo   one player on this phone          → LocalGame
//   shout  this screen, the quizmaster scores → LocalGame
//   multi  everyone on their own phone        → LiveHost here, /games/quiz/join on theirs
//
// A game in progress is saved as it goes (on the device for solo and shout,
// on the server for multi), and offered as "Carry on" here.
const HOST_KEEP_MS = 12 * 60 * 60 * 1000;

export default function QuizPage() {
  const router = useRouter();
  const [view, setView] = useState('home'); // 'home' | 'setup' | 'local' | 'host' | 'history'
  const [setup, setSetup] = useState(null);
  const [resume, setResume] = useState(null); // { kind: 'local'|'host', data, label }
  const [round, setRound] = useState(0); // bumped for "Play again", so the game starts fresh

  // What can be carried on: an unfinished solo or shout game on this phone, or
  // a quiz this phone is hosting from the last 12 hours (the server keeps a
  // live quiz that long). Worked out afresh each time home is shown, and
  // cleared when there is nothing, so a finished game is never offered: an
  // earlier offer used to stay on screen after the next game was played out.
  useEffect(() => {
    if (view !== 'home') return;
    const local = loadLocal();
    if (local && local.game.phase === 'finished') clearLocal();
    if (local && local.game.phase !== 'finished') {
      const g = local.game;
      setResume({
        kind: 'local',
        data: local,
        label: `${g.mode === 'solo' ? g.players[0]?.name : `${g.players.length} players`} · question ${Math.max(1, g.index + 1)} of ${g.settings.count}`,
      });
      return;
    }
    const host = loadHost();
    if (host?.code && !host.recorded && host.at && Date.now() - host.at < HOST_KEEP_MS) {
      setResume({ kind: 'host', data: host, label: `Hosting quiz ${host.code}` });
      return;
    }
    if (host) clearHost();
    setResume(null);
  }, [view]);

  const dismissResume = () => {
    if (resume?.kind === 'local') clearLocal();
    if (resume?.kind === 'host') clearHost();
    setResume(null);
  };

  useWakeLock(view === 'local' || view === 'host');

  const start = (s) => {
    setSetup(s);
    if (s.mode === 'multi') {
      clearHost();
      setView('host');
    } else {
      clearLocal();
      setView('local');
    }
  };

  const home = () => {
    setSetup(null);
    setView('home');
  };

  return (
    <>
      <Head>
        <title>Quiz Night — GamePad</title>
        <meta name="description" content="A family quiz show: fresh questions every game, for any age. Play on your own, shout it out round one screen, or everyone on their phones." />
      </Head>
      <Stage dim={view === 'home' ? 0.25 : 0.5}>
        {view === 'home' && (
          <QuizHome
            resume={resume?.label}
            onResume={() => setView(resume.kind === 'local' ? 'local' : 'host')}
            onDismissResume={dismissResume}
            onStart={() => setView('setup')}
            onJoin={() => router.push('/games/quiz/join')}
            onHistory={() => setView('history')}
            onBack={() => router.push('/')}
          />
        )}
        {view === 'setup' && <Setup initial={setup} onStart={start} onCancel={home} />}
        {view === 'local' && (
          <LocalGame
            key={round}
            setup={setup || resume?.data?.game?.settings}
            resume={setup ? null : resume?.data}
            onExit={home}
            onNewQuiz={(s) => {
              setSetup(s);
              setRound((r) => r + 1);
            }}
          />
        )}
        {view === 'host' && (
          <LiveHost
            setup={setup}
            resume={setup ? null : resume?.data}
            onExit={(opts) => (opts?.again ? setView('setup') : home())}
          />
        )}
        {view === 'history' && <History onBack={home} />}
      </Stage>
    </>
  );
}
