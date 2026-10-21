import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useWakeLock from '@/hooks/useWakeLock';
import { BannerProvider } from '@/components/arcade/Banner';
import ScrabbleHome from '@/components/scrabble/ScrabbleHome';
import Setup from '@/components/scrabble/Setup';
import Play from '@/components/scrabble/Play';
import WordCheck from '@/components/scrabble/WordCheck';
import { Table } from '@/components/scrabble/ui';
import { clearLocal, deleteAccountGame, fetchAccountGames, loadLocal, recentNames, rememberNames, saveLocal, useAccountSave } from '@/components/scrabble/store';
import { newMatch } from '@/lib/scrabble/rules';

// Scrabble, rebuilt (REDESIGN-PLAN.md, Phase 5): a scorer for the table, with
// tile keys, a total that rolls up, an end screen with awards and a word check
// that works offline.
//
//   home   carry on, start, check a word, look back  → ScrabbleHome
//   setup  who's playing and who goes first           → Setup
//   play   the scores and the keypad                  → Play (with the end screen)
//
// The match is saved to this phone after every turn, and to a signed-in
// player's account a moment later (components/scrabble/store.js).
function Scrabble() {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [view, setView] = useState('home');
  const [match, setMatch] = useState(null);
  const [resume, setResume] = useState(null);
  const [accountGames, setAccountGames] = useState(null);
  const [recent, setRecent] = useState([]);
  const [seed, setSeed] = useState(null);
  const [checking, setChecking] = useState(false);
  // Match id → the game's id on the account, once it has been saved there.
  const serverIds = useRef(new Map());

  const refresh = useCallback(async () => {
    // Only an unfinished game is offered as "Carry on".
    const local = loadLocal();
    setResume(local && !local.match.finished ? local : null);
    const names = recentNames();
    if (signedIn) {
      const games = await fetchAccountGames().catch(() => []);
      setAccountGames(games);
      const fromAccount = games.flatMap((g) => g.scrabbleConfig.match.players.map((p) => p.name)).filter((n) => n && !/^Player \d+$/.test(n));
      setRecent([...new Set([...names, ...fromAccount])]);
    } else {
      setAccountGames(null);
      setRecent(names);
    }
  }, [signedIn]);

  useEffect(() => {
    if (view === 'home') refresh();
  }, [view, refresh]);

  // Saved on this phone after every turn.
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
    // Same players; whoever sat after the last game's first player starts.
    const { players, first } = match;
    clearLocal();
    begin(newMatch({ players, first: (first + 1) % players.length }));
  };

  const another = () => {
    setSeed(match.players);
    clearLocal();
    setMatch(null);
    setView('setup');
  };

  const dismiss = () => {
    if (!window.confirm('Forget this game? It goes from this phone.')) return;
    clearLocal();
    setResume(null);
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
        <title>Scrabble Scorer — GamePad</title>
        <meta
          name="description"
          content="Keep the score at the Scrabble table: tap in each turn on tile keys, +50 for a bingo, a word checker that works offline, and awards for the best word at the end."
        />
      </Head>
      <Table dim={view === 'home' ? 0.15 : 0.6}>
        {view === 'home' && (
          <ScrabbleHome
            resume={resume}
            accountGames={accountGames}
            onResume={() => begin(resume.match, resume.serverId)}
            onDismiss={dismiss}
            onNew={() => {
              setSeed(null);
              setView('setup');
            }}
            onOpen={(g) => begin(g.scrabbleConfig.match, g._id)}
            onDelete={remove}
            onWords={() => setChecking(true)}
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
      </Table>
      <WordCheck open={checking} onClose={() => setChecking(false)} />
    </>
  );
}

export default function ScrabblePage() {
  return (
    <BannerProvider>
      <Scrabble />
    </BannerProvider>
  );
}
