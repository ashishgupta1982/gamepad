import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';
import GameShell from '@/components/layout/GameShell';
import { BannerProvider, useBanner } from '@/components/arcade/Banner';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { buzz, celebrate } from '@/components/arcade/feedback';
import StartScreen from '@/components/travel-bingo/StartScreen';
import SetupScreen from '@/components/travel-bingo/SetupScreen';
import DealingScreen from '@/components/travel-bingo/DealingScreen';
import RaceTrack from '@/components/travel-bingo/RaceTrack';
import BingoCard from '@/components/travel-bingo/BingoCard';
import TileSheet from '@/components/travel-bingo/TileSheet';
import FeedList from '@/components/travel-bingo/FeedList';
import ResultsScreen from '@/components/travel-bingo/ResultsScreen';
import { guestIdForRequest } from '@/lib/identity';
import { MIN_POOL, newLines, rivalFinds, TILES_PER_CARD } from '@/lib/bingoRules';
import { cn } from '@/lib/cn';

// Travel Bingo, rebuilt in the toy-box arcade look (REDESIGN-PLAN.md, Phase 1).
//
// The server routes are unchanged in shape; what changed is the feel:
//   - one tap stamps a tile, on screen at once, with a thunk and a buzz. The
//     save happens behind it and is retried through patchy signal; only if it
//     still fails is the stamp taken back, and the banner says so;
//   - every new row, column or diagonal is a LINE! moment on the way to the
//     full card, which is the win;
//   - the scoreboard is a race, and another car's find arrives as a banner
//     with a honk, from the same poll as before.

const STORAGE_KEY = 'travel-bingo:active';
const POLL_MS = 4000;
const RETRY_DELAYS = [1500, 4000];
const CONFETTI = ['#14b8a6', '#fbbf24', '#f43f5e', '#38bdf8', '#a78bfa'];

function stored(action, value) {
  try {
    if (action === 'get') return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (action === 'set') localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    if (action === 'clear') localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

// A copy of the game with one tile on one car changed.
function withTile(game, carId, tileId, patch) {
  const cfg = game.travelBingoConfig;
  return {
    ...game,
    travelBingoConfig: {
      ...cfg,
      cars: cfg.cars.map((c) =>
        c.carId !== carId ? c : { ...c, card: c.card.map((t) => (t.tileId === tileId ? { ...t, ...patch } : t)) },
      ),
    },
  };
}

function TravelBingo() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const banner = useBanner();

  const [game, setGameState] = useState(null);
  const [myCarId, setMyCarId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [view, setView] = useState('card'); // 'card' | 'convoy' | 'feed'
  const [open, setOpen] = useState(null); // { carId, tileId }

  const gameRef = useRef(null);
  const myCarRef = useRef(null);
  // Every local change bumps this. A poll that started before one is stale by
  // the time it lands and is dropped, so it cannot un-stamp a tile on screen.
  const editSeq = useRef(0);
  const inFlight = useRef(0);
  // The full-house fanfare is played locally the moment the ninth tile is
  // stamped; this stops the server's 'completed' playing it a second time.
  const celebratedWin = useRef(false);

  const guestId = () => guestIdForRequest(session);

  const setGame = useCallback((g) => {
    gameRef.current = g;
    setGameState(g);
  }, []);

  // Everything that arrives from the server comes through here, which is where
  // the other cars' finds and the end of the game are noticed.
  const receive = useCallback(
    (next) => {
      const prev = gameRef.current;
      const me = myCarRef.current;
      const prevPhase = prev?.travelBingoConfig?.phase;
      const phase = next?.travelBingoConfig?.phase;

      if (prev && prevPhase === 'playing') {
        const finds = rivalFinds(prev, next, me);
        finds.slice(-3).forEach((f) => banner.show({ title: `${f.carName} spotted`, text: f.label, tone: 'rival' }));
        if (finds.length) {
          play('honk');
          buzz(20);
        }
      }
      if (prev && prevPhase !== 'playing' && phase === 'playing') play('deal');
      if (prev && prevPhase === 'playing' && phase === 'completed' && !celebratedWin.current) {
        const winner = next.travelBingoConfig.cars.find((c) => c.carId === next.travelBingoConfig.winnerCarId);
        celebratedWin.current = true;
        play('win');
        celebrate('big', CONFETTI);
        if (winner?.carId !== me) banner.show({ title: 'BINGO!', text: `${winner?.name || 'Someone'} got the full card`, tone: 'win', big: true });
      }
      setGame(next);
    },
    [banner, setGame],
  );

  const fetchGame = useCallback(
    async (gameId, { poll = false } = {}) => {
      const seq = editSeq.current;
      const res = await fetch(`/api/games/travel-bingo/${gameId}`);
      if (!res.ok) throw new Error('Game not found');
      const { game: next } = await res.json();
      if (poll && (seq !== editSeq.current || inFlight.current > 0)) return null;
      receive(next);
      return next;
    },
    [receive],
  );

  // Resume the game this phone was in, unless the games room sent us here to
  // start or join a different one (?start=new or ?start=join).
  useEffect(() => {
    if (authStatus === 'loading' || !router.isReady) return;
    if (router.query.start === 'new' || router.query.start === 'join') stored('clear');
    const s = stored('get');
    if (s?.gameId && s?.carId) {
      myCarRef.current = s.carId;
      setMyCarId(s.carId);
      fetchGame(s.gameId).catch(() => stored('clear'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, router.isReady]);

  const gameId = game?._id;
  const phase = game?.travelBingoConfig?.phase;

  // Poll while the game is live, and straight away when the phone comes back
  // to this tab (a passenger switching to maps and back).
  useEffect(() => {
    if (!gameId || phase === 'completed') return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fetchGame(gameId, { poll: true }).catch(() => {});
    };
    const t = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [gameId, phase, fetchGame]);

  const enter = (id, carId) => {
    // Drop ?start=new / ?start=join, so a reload resumes this game rather than
    // clearing it to start another.
    if (router.query.start) router.replace('/games/travel-bingo', undefined, { shallow: true });
    stored('set', { gameId: id, carId });
    myCarRef.current = carId;
    setMyCarId(carId);
    celebratedWin.current = false;
  };

  const handleCreate = async (name) => {
    setBusy(true);
    try {
      const { gameId: id, carId } = await post('/api/games/travel-bingo/create', { hostCarName: name, guestId: guestId() });
      enter(id, carId);
      await fetchGame(id);
      play('deal');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (code, name) => {
    setBusy(true);
    try {
      const lookup = await fetch(`/api/games/travel-bingo/by-code/${code}`);
      if (!lookup.ok) throw new Error('No game with that code. Check it with the other car?');
      const { gameId: id } = await lookup.json();
      const { carId, game: joined } = await post(`/api/games/travel-bingo/${id}/join`, { carName: name, guestId: guestId() });
      enter(id, carId);
      setGame(joined);
      play('deal');
    } finally {
      setBusy(false);
    }
  };

  const saveItems = async (items) => {
    const g = gameRef.current;
    if (!g) return;
    const { game: next } = await post(`/api/games/travel-bingo/${g._id}/submit-items`, { carId: myCarId, items, guestId: guestId() });
    receive(next);
  };

  const deal = async () => {
    const g = gameRef.current;
    if (!g) return;
    play('tap');
    setDealing(true);
    try {
      const { game: next } = await post(`/api/games/travel-bingo/${g._id}/generate`, { guestId: guestId() });
      receive(next);
      setView('card');
    } catch (err) {
      play('error');
      banner.show({ title: 'Could not deal the cards', text: err.message, tone: 'error', hold: 3500 });
      fetchGame(g._id).catch(() => {});
    } finally {
      setDealing(false);
    }
  };

  // One tap: stamped now, saved behind it.
  const stamp = async (tile) => {
    const g = gameRef.current;
    const myCar = g?.travelBingoConfig?.cars?.find((c) => c.carId === myCarId);
    if (!myCar || tile.found) return;

    editSeq.current += 1;
    const next = withTile(g, myCarId, tile.tileId, { found: true, foundAt: new Date().toISOString() });
    const nextCar = next.travelBingoConfig.cars.find((c) => c.carId === myCarId);
    setGame(next);

    play('stamp');
    buzz(35);
    const lines = newLines(myCar.card, nextCar.card);
    const full = nextCar.card.every((t) => t.found);
    if (full) {
      celebratedWin.current = true;
      setTimeout(() => {
        play('win');
        buzz([60, 80, 60, 80, 200]);
        celebrate('big', CONFETTI);
        banner.show({ title: 'BINGO!', text: 'Full card!', tone: 'win', big: true, hold: 3000 });
      }, 250);
    } else if (lines.length) {
      setTimeout(() => {
        play('line');
        buzz([40, 60, 40]);
        celebrate('small', CONFETTI);
        banner.show({ title: lines.length > 1 ? `${lines.length} LINES!` : 'LINE!', tone: 'win', big: true });
      }, 250);
    }

    inFlight.current += 1;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const { game: saved } = await post(`/api/games/travel-bingo/${g._id}/mark-tile`, {
            carId: myCarId,
            tileId: tile.tileId,
            found: true,
            guestId: guestId(),
          });
          editSeq.current += 1;
          receive(saved);
          return;
        } catch (err) {
          // A 4xx will not get better by asking again; a dropped signal might.
          if ((err.status && err.status < 500) || attempt >= RETRY_DELAYS.length) throw err;
          await wait(RETRY_DELAYS[attempt]);
        }
      }
    } catch (err) {
      editSeq.current += 1;
      celebratedWin.current = false;
      setGame(withTile(gameRef.current, myCarId, tile.tileId, { found: false, foundAt: null }));
      play('error');
      banner.show({ title: `${tile.label} not saved`, text: 'No signal? Tap it again in a moment.', tone: 'error', hold: 3500 });
    } finally {
      inFlight.current -= 1;
    }
  };

  const unmark = async (tile) => {
    const g = gameRef.current;
    editSeq.current += 1;
    setGame(withTile(g, myCarId, tile.tileId, { found: false, foundAt: null, caption: '' }));
    play('unstamp');
    setOpen(null);
    try {
      const { game: saved } = await post(`/api/games/travel-bingo/${g._id}/mark-tile`, {
        carId: myCarId,
        tileId: tile.tileId,
        found: false,
        guestId: guestId(),
      });
      editSeq.current += 1;
      receive(saved);
    } catch (err) {
      banner.show({ title: 'Could not undo that', text: err.message, tone: 'error' });
      fetchGame(g._id).catch(() => {});
    }
  };

  const saveCaption = async (tile, caption) => {
    const g = gameRef.current;
    try {
      const { game: saved } = await post(`/api/games/travel-bingo/${g._id}/mark-tile`, {
        carId: myCarId,
        tileId: tile.tileId,
        found: true,
        caption,
        guestId: guestId(),
      });
      editSeq.current += 1;
      receive(saved);
      play('tap');
    } catch (err) {
      banner.show({ title: 'Not saved', text: err.message, tone: 'error' });
    }
  };

  const comment = async (ownerCar, tile, text) => {
    const g = gameRef.current;
    try {
      const { game: saved } = await post(`/api/games/travel-bingo/${g._id}/comment`, {
        carId: myCarId,
        ownerCarId: ownerCar.carId,
        tileId: tile.tileId,
        text,
        guestId: guestId(),
      });
      editSeq.current += 1;
      receive(saved);
      play('tap');
    } catch (err) {
      banner.show({ title: 'Comment not posted', text: err.message, tone: 'error' });
      throw err;
    }
  };

  const reset = () => {
    stored('clear');
    gameRef.current = null;
    myCarRef.current = null;
    setGameState(null);
    setMyCarId(null);
    setView('card');
    setOpen(null);
    celebratedWin.current = false;
  };

  const leave = () => {
    if (!window.confirm('Leave this game? You can join again with the same code.')) return;
    reset();
  };

  const cfg = game?.travelBingoConfig;
  const cars = cfg?.cars || [];
  const myCar = cars.find((c) => c.carId === myCarId);
  const isHost = !!(myCarId && cfg?.hostCarId === myCarId);
  const pool = new Set(cars.flatMap((c) => c.submittedItems || []).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const hostName = cars.find((c) => c.carId === cfg?.hostCarId)?.name || 'the host';

  // The tile in the sheet, read live from the game so comments appear as they land.
  const openCar = open && cars.find((c) => c.carId === open.carId);
  const openTile = openCar?.card?.find((t) => t.tileId === open.tileId);

  const setupActions =
    phase === 'submission' &&
    (isHost ? (
      <button
        type="button"
        onClick={deal}
        disabled={dealing || pool.size < MIN_POOL}
        className="toy min-h-[56px] w-full rounded-2xl bg-game-bingo font-display text-xl font-extrabold text-white [--toy-edge:hsl(var(--game-bingo-deep))] disabled:opacity-50"
      >
        {dealing ? 'Dealing…' : pool.size < MIN_POOL ? `Pick ${MIN_POOL - pool.size} more to spot` : 'Deal the cards!'}
      </button>
    ) : (
      <p className="py-2 text-center text-sm font-semibold text-muted-foreground">Waiting for {hostName} to deal the cards…</p>
    ));

  return (
    <>
      <Head>
        <title>Travel Bingo — GamePad</title>
      </Head>

      <GameShell
        title="Travel Bingo"
        onBack={() => router.push('/')}
        headerAside={<MuteButton />}
        actions={setupActions || null}
        // A card is watched out of a car window for long stretches between taps.
        keepAwake={!!game}
        className="bg-gradient-to-b from-teal-50 to-amber-50"
      >
        {!game && authStatus !== 'loading' && router.isReady && (
          <StartScreen
            onCreate={handleCreate}
            onJoin={handleJoin}
            busy={busy}
            initialCode={typeof router.query.code === 'string' ? router.query.code : ''}
            initialMode={router.query.start === 'join' ? 'join' : router.query.start === 'new' ? 'create' : null}
          />
        )}

        {game && phase === 'submission' && <SetupScreen game={game} myCarId={myCarId} onSaveItems={saveItems} />}

        {game && phase === 'generating' && <DealingScreen since={cfg.generatingSince} isHost={isHost} onRetry={deal} />}

        {game && phase === 'playing' && myCar && (
          <div className="space-y-4 pb-4">
            <RaceTrack cars={cars} myCarId={myCarId} />

            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
              {[
                ['card', 'My card'],
                ['convoy', 'Other cars'],
                ['feed', 'Finds'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={cn(
                    'press rounded-xl py-2.5 text-sm font-bold transition-colors',
                    view === id ? 'bg-game-bingo text-white' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === 'card' && (
              <>
                <BingoCard
                  card={myCar.card}
                  onTileTap={(tile) => (tile.found ? setOpen({ carId: myCarId, tileId: tile.tileId }) : stamp(tile))}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Tap a tile when you spot it. Tap a stamped one to add where, or undo.
                </p>
              </>
            )}

            {view === 'convoy' && (
              <div className="space-y-4">
                {cars.filter((c) => c.carId !== myCarId).length === 0 && (
                  <p className="rounded-3xl bg-white p-6 text-center text-muted-foreground shadow-sm">Just you on this trip.</p>
                )}
                {cars
                  .filter((c) => c.carId !== myCarId)
                  .map((c) => (
                    <section key={c.carId} className="rounded-3xl bg-white p-3 shadow-sm">
                      <p className="mb-2 font-display font-extrabold text-foreground">
                        {c.name} <span className="text-sm font-bold text-muted-foreground tnum">{c.card.filter((t) => t.found).length}/{TILES_PER_CARD}</span>
                      </p>
                      <BingoCard card={c.card} compact onTileTap={(tile) => setOpen({ carId: c.carId, tileId: tile.tileId })} />
                    </section>
                  ))}
              </div>
            )}

            {view === 'feed' && (
              <FeedList cars={cars} myCarId={myCarId} onOpen={(car, tile) => setOpen({ carId: car.carId, tileId: tile.tileId })} />
            )}
          </div>
        )}

        {game && phase === 'completed' && (
          <ResultsScreen game={game} myCarId={myCarId} onNewGame={reset} onOpen={(car, tile) => setOpen({ carId: car.carId, tileId: tile.tileId })} />
        )}

        {game && phase !== 'completed' && (
          <div className="mt-4 flex items-center justify-center gap-3 pb-2 text-xs text-muted-foreground">
            <span>
              Code <span className="font-mono font-bold tracking-wider text-game-bingo-deep">{cfg.joinCode}</span>
            </span>
            <button type="button" onClick={leave} className="press flex items-center gap-1 font-semibold hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Leave
            </button>
          </div>
        )}

        <TileSheet
          open={!!openTile}
          tile={openTile}
          ownerCar={openCar}
          myCarId={myCarId}
          onClose={() => setOpen(null)}
          onSaveCaption={saveCaption}
          onUnmark={unmark}
          onComment={comment}
        />
      </GameShell>
    </>
  );
}

export default function TravelBingoPage() {
  return (
    <BannerProvider>
      <TravelBingo />
    </BannerProvider>
  );
}
