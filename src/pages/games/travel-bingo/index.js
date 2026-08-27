import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import GameShell from '@/components/layout/GameShell';
import LandingScreen from '@/components/travel-bingo/LandingScreen';
import SubmissionScreen from '@/components/travel-bingo/SubmissionScreen';
import BingoCard from '@/components/travel-bingo/BingoCard';
import TileDetailModal from '@/components/travel-bingo/TileDetailModal';
import Scoreboard from '@/components/travel-bingo/Scoreboard';
import ProgressFeed from '@/components/travel-bingo/ProgressFeed';
import ResultsScreen from '@/components/travel-bingo/ResultsScreen';
import { getPlayerIdentity, guestIdForRequest } from '@/lib/identity';

const STORAGE_KEY = 'travel-bingo:active';

function loadStored() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStored(value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

function clearStored() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// Identity comes from lib/identity now, not from here.
//
// This file used to mint its own: `user:<email>` when signed in, and a
// `travel-bingo:guestId` otherwise. Both were wrong. The email form matched
// nothing else in the app — every other endpoint keys on session.user.id — and
// the guest key was per-game, so the same person was a different player in
// Travel Bingo than anywhere else.
//
// The id is also no longer sent as the authoritative `userId`. The server reads
// the session and only falls back to `guestId` when there is none, so a body
// field can no longer name someone else's account.

export default function TravelBingoPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [game, setGame] = useState(null);
  const [myCarId, setMyCarId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeView, setActiveView] = useState('mine'); // 'mine' | 'others' | 'feed'
  const [openTile, setOpenTile] = useState(null); // { tile, ownerCar }
  const [error, setError] = useState('');
  const guestIdRef = useRef(undefined);

  // A guest id to send alongside requests. Undefined once signed in — the
  // server ignores it then anyway, and sending one would only invite confusion
  // about which identity won.
  useEffect(() => {
    if (authStatus === 'loading') return;
    guestIdRef.current = guestIdForRequest(session);
  }, [authStatus, session]);

  // Resume from localStorage on mount
  useEffect(() => {
    if (authStatus === 'loading') return;
    const stored = loadStored();
    if (stored?.gameId && stored?.carId) {
      setMyCarId(stored.carId);
      fetchGame(stored.gameId).catch(() => clearStored());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  const fetchGame = useCallback(async (gameId) => {
    const res = await fetch(`/api/games/travel-bingo/${gameId}`);
    if (!res.ok) throw new Error('Game not found');
    const data = await res.json();
    setGame(data.game);
    return data.game;
  }, []);

  // Polling while game active
  useEffect(() => {
    if (!game?._id) return;
    const phase = game.travelBingoConfig?.phase;
    if (phase === 'completed') return;
    const interval = setInterval(() => {
      fetchGame(game._id).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [game?._id, game?.travelBingoConfig?.phase, fetchGame]);

  const handleCreate = async (carName) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/games/travel-bingo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostCarName: carName, guestId: guestIdRef.current }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to create');
      const { gameId, carId } = await res.json();
      saveStored({ gameId, carId });
      setMyCarId(carId);
      await fetchGame(gameId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (code, carName) => {
    setBusy(true);
    setError('');
    try {
      const lookup = await fetch(`/api/games/travel-bingo/by-code/${code}`);
      if (!lookup.ok) throw new Error('Game not found for that code');
      const { gameId } = await lookup.json();

      const join = await fetch(`/api/games/travel-bingo/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carName, guestId: guestIdRef.current }),
      });
      if (!join.ok) throw new Error((await join.json())?.error || 'Failed to join');
      const { carId, game: joined } = await join.json();
      saveStored({ gameId, carId });
      setMyCarId(carId);
      setGame(joined);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitItems = async (items) => {
    if (!game?._id || !myCarId) return;
    const res = await fetch(`/api/games/travel-bingo/${game._id}/submit-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId: myCarId, items, guestId: guestIdRef.current }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || 'Save failed');
    const { game: updated } = await res.json();
    setGame(updated);
  };

  const handleGenerate = async () => {
    if (!game?._id) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/games/travel-bingo/${game._id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: guestIdRef.current }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Generation failed');
      const { game: updated } = await res.json();
      setGame(updated);
      setActiveView('mine');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkFound = async ({ tileId, caption }) => {
    if (!game?._id || !myCarId) return;
    const res = await fetch(`/api/games/travel-bingo/${game._id}/mark-tile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId: myCarId, tileId, caption, found: true, guestId: guestIdRef.current }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || 'Save failed');
    const { game: updated } = await res.json();
    setGame(updated);
  };

  const handleUnmark = async ({ tileId }) => {
    if (!game?._id || !myCarId) return;
    const res = await fetch(`/api/games/travel-bingo/${game._id}/mark-tile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId: myCarId, tileId, found: false, guestId: guestIdRef.current }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || 'Save failed');
    const { game: updated } = await res.json();
    setGame(updated);
  };

  const handleAddComment = async ({ ownerCarId, tileId, text }) => {
    if (!game?._id || !myCarId) return;
    const res = await fetch(`/api/games/travel-bingo/${game._id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId: myCarId, ownerCarId, tileId, text }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || 'Save failed');
    const { game: updated } = await res.json();
    setGame(updated);
  };

  const handlePlayAgain = () => {
    clearStored();
    setGame(null);
    setMyCarId(null);
    setActiveView('mine');
    setOpenTile(null);
    setError('');
  };

  const handleLeave = () => {
    if (!confirm('Leave this game? You can rejoin with the same code.')) return;
    clearStored();
    setGame(null);
    setMyCarId(null);
    setActiveView('mine');
    setOpenTile(null);
  };

  // Compared against the player's real id — session id when signed in, guest id
  // otherwise — not against whatever this client last sent. This is a display
  // hint only; the server re-checks the host on every host-only action.
  const playerId = getPlayerIdentity(session).id;
  const isHost = !!(game && playerId && game.travelBingoConfig?.hostUserId === playerId);
  const myCar = game?.travelBingoConfig?.cars?.find(c => c.carId === myCarId);
  const otherCars = (game?.travelBingoConfig?.cars || []).filter(c => c.carId !== myCarId);
  const phase = game?.travelBingoConfig?.phase;

  const openTileForOwner = (car, tile) => {
    setOpenTile({ ownerCar: car, tile });
  };

  return (
    <>
      <Head>
        <title>Travel Bingo — GamePad</title>
      </Head>

      <GameShell
        title="Travel Bingo"
        onBack={() => router.push('/')}
        bodyClassName="px-0"
        // A bingo card is watched out of a car window for long stretches
        // between taps, which is exactly what the wake lock is for.
        keepAwake={!!game}
      >

        {!game && authStatus !== 'loading' && (
          <LandingScreen onCreate={handleCreate} onJoin={handleJoin} busy={busy} />
        )}

        {game && phase === 'submission' && (
          <>
            <SubmissionScreen
              game={game}
              myCarId={myCarId}
              isHost={isHost}
              onSubmitItems={handleSubmitItems}
              onGenerate={handleGenerate}
              generating={generating}
            />
            <div className="max-w-2xl mx-auto px-4 mt-4 mb-8 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Game code: <span className="font-mono font-bold text-game-bingo tracking-wider">{game.travelBingoConfig.joinCode}</span>
              </p>
              <button onClick={handleLeave} className="text-xs text-muted-foreground hover:text-destructive underline">
                Leave game
              </button>
            </div>
          </>
        )}

        {game && phase === 'generating' && (
          <div className="max-w-md mx-auto px-4 pt-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-game-bingo mx-auto" />
            <p className="mt-4 text-muted-foreground font-semibold">AI is building your bingo cards…</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes a few seconds.</p>
          </div>
        )}

        {game && phase === 'playing' && myCar && (
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-10">
            <div className="flex bg-card rounded-xl shadow p-1 mb-4 border border-game-bingo/30">
              <button
                onClick={() => setActiveView('mine')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'mine' ? 'bg-game-bingo text-white shadow' : 'text-muted-foreground'
                }`}
              >
                My card
              </button>
              <button
                onClick={() => setActiveView('others')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'others' ? 'bg-game-bingo text-white shadow' : 'text-muted-foreground'
                }`}
              >
                Other cars
              </button>
              <button
                onClick={() => setActiveView('feed')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'feed' ? 'bg-game-bingo text-white shadow' : 'text-muted-foreground'
                }`}
              >
                Live feed
              </button>
            </div>

            <div className="mb-4">
              <Scoreboard
                cars={game.travelBingoConfig.cars}
                winnerCarId={game.travelBingoConfig.winnerCarId}
                myCarId={myCarId}
              />
            </div>

            {activeView === 'mine' && (
              <BingoCard
                car={myCar}
                interactive
                onTileClick={(tile) => setOpenTile({ ownerCar: myCar, tile })}
              />
            )}

            {activeView === 'others' && (
              <div className="space-y-4">
                {otherCars.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No other cars yet.</p>
                ) : otherCars.map(c => (
                  <BingoCard
                    key={c.carId}
                    car={c}
                    interactive
                    onTileClick={(tile) => setOpenTile({ ownerCar: c, tile })}
                  />
                ))}
              </div>
            )}

            {activeView === 'feed' && (
              <ProgressFeed
                cars={game.travelBingoConfig.cars}
                onTileClick={openTileForOwner}
              />
            )}

            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                Game code: <span className="font-mono font-bold text-game-bingo tracking-wider">{game.travelBingoConfig.joinCode}</span>
              </p>
              <button onClick={handleLeave} className="text-xs text-muted-foreground hover:text-destructive underline mt-1">
                Leave game
              </button>
            </div>
          </div>
        )}

        {game && phase === 'completed' && (
          <ResultsScreen game={game} myCarId={myCarId} onPlayAgain={handlePlayAgain} />
        )}

        {error && (
          <div className="max-w-md mx-auto px-4 mt-3">
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          </div>
        )}

        <TileDetailModal
          open={!!openTile}
          tile={openTile?.tile}
          ownerCar={openTile?.ownerCar}
          myCarId={myCarId}
          onClose={() => setOpenTile(null)}
          onMarkFound={handleMarkFound}
          onUnmark={handleUnmark}
          onAddComment={handleAddComment}
        />
      </GameShell>
    </>
  );
}
