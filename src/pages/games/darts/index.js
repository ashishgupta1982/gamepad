import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useWakeLock from '@/hooks/useWakeLock';
import { BannerProvider } from '@/components/arcade/Banner';
import DartsHome from '@/components/darts/DartsHome';
import Setup from '@/components/darts/Setup';
import Play from '@/components/darts/Play';
import { Oche } from '@/components/darts/ui';
import { clearLocal, deleteAccountGame, fetchAccountGames, loadLocal, recentNames, rememberNames, saveLocal, useAccountSave } from '@/components/darts/store';
import { newMatch, replay } from '@/lib/darts/rules';

// Darts, rebuilt (REDESIGN-PLAN.md, Phase 4): tap the board, the scores and the
// checkout take care of themselves.
//
//   home   carry on, start, or look back       → DartsHome
//   setup  the game, the players, the options  → Setup
//   play   the board and the scores            → Play (with the end screen)
//
// The match is saved to this phone after every dart, and to a signed-in
// player's account a moment later (components/darts/store.js).
function Darts() {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [view, setView] = useState('home');
  const [match, setMatch] = useState(null);
  const [resume, setResume] = useState(null);
  const [accountGames, setAccountGames] = useState(null);
  const [recent, setRecent] = useState([]);
  const [seed, setSeed] = useState(null);
  // Match id → the game's id on the account, once it has been saved there.
  const serverIds = useRef(new Map());

  const refresh = useCallback(async () => {
    // Only an unfinished game is offered as "Carry on".
    const local = loadLocal();
    setResume(local && !replay(local.match).finished ? local : null);
    const names = recentNames();
    if (signedIn) {
      const games = await fetchAccountGames().catch(() => []);
      setAccountGames(games);
      const fromAccount = games.flatMap((g) => g.players?.map((p) => p.name) || []).filter((n) => n && !/^Player \d+$/.test(n));
      setRecent([...new Set([...names, ...fromAccount])]);
    } else {
      setAccountGames(null);
      setRecent(names);
    }
  }, [signedIn]);

  useEffect(() => {
    if (view === 'home') refresh();
  }, [view, refresh]);

  // Saved on this phone after every dart.
  useEffect(() => {
    if (match) saveLocal(match, serverIds.current.get(match.id));
  }, [match]);
  useAccountSave(match, { enabled: signedIn && view === 'play', serverIds });
  useWakeLock(view === 'play');

  const begin = (m, id = null) => {
    if (id) serverIds.current.set(m.id, id);
    rememberNames(m.players.map((p) => p.name));
    setMatch(m);
    setView('play');
  };

  const home = () => {
    setMatch(null);
    setView('home');
  };

  const again = () => {
    // Same players and settings; Killer deals new numbers.
    const { mode, players, settings } = match;
    clearLocal();
    begin(newMatch({ mode, players, settings: mode === 'killer' ? { lives: settings.lives } : settings }));
  };

  const another = () => {
    setSeed({ mode: match.mode, players: match.players, settings: match.settings });
    clearLocal();
    setMatch(null);
    setView('setup');
  };

  const remove = async (game) => {
    if (!window.confirm('Delete this game?')) return;
    await deleteAccountGame(game._id).catch(() => {});
    if (resume?.serverId === game._id) clearLocal();
    refresh();
  };

  return (
    <>
      <Head>
        <title>Darts — GamePad</title>
        <meta name="description" content="A darts scorer you tap: X01, Cricket, Around the Clock and Killer, with checkouts lit up on the board and a caller for the 180s." />
      </Head>
      <Oche dim={view === 'home' ? 0.2 : 0.55}>
        {view === 'home' && (
          <DartsHome
            resume={resume}
            accountGames={accountGames}
            onResume={() => begin(resume.match, resume.serverId)}
            onNew={() => {
              setSeed(null);
              setView('setup');
            }}
            onOpen={(g) => begin(g.dartsConfig.match, g._id)}
            onDelete={remove}
            onBack={() => router.push('/')}
          />
        )}
        {view === 'setup' && (
          <Setup
            initial={seed}
            recent={recent}
            onStart={(m) => {
              clearLocal();
              begin(m);
            }}
            onCancel={() => setView('home')}
          />
        )}
        {view === 'play' && match && <Play match={match} onChange={setMatch} onExit={home} onAgain={again} onNew={another} />}
      </Oche>
    </>
  );
}

export default function DartsPage() {
  return (
    <BannerProvider>
      <Darts />
    </BannerProvider>
  );
}
