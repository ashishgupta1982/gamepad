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
export default function QuizPage() {
  const router = useRouter();
  const [view, setView] = useState('home'); // 'home' | 'setup' | 'local' | 'host' | 'history'
  const [setup, setSetup] = useState(null);
  const [resume, setResume] = useState(null); // { kind: 'local'|'host', data, label }
  const [round, setRound] = useState(0); // bumped for "Play again", so the game starts fresh

  // What can be carried on: a solo or shout game on this phone, or a quiz
  // this phone is hosting.
  useEffect(() => {
    const local = loadLocal();
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
    if (host?.code && !host.recorded) setResume({ kind: 'host', data: host, label: `Hosting quiz ${host.code}` });
  }, [view]);

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
