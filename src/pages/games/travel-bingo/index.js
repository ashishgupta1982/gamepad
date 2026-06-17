import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import ProfessionalHeader from '@/components/ProfessionalHeader';
import LandingScreen from '@/components/travel-bingo/LandingScreen';
import SubmissionScreen from '@/components/travel-bingo/SubmissionScreen';
import BingoCard from '@/components/travel-bingo/BingoCard';
import TileDetailModal from '@/components/travel-bingo/TileDetailModal';
import Scoreboard from '@/components/travel-bingo/Scoreboard';
import ProgressFeed from '@/components/travel-bingo/ProgressFeed';
import ResultsScreen from '@/components/travel-bingo/ResultsScreen';

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

function ensureUserId(session) {
  if (session?.user?.email) return `user:${session.user.email}`;
  if (typeof window === 'undefined') return null;
  let guest = localStorage.getItem('travel-bingo:guestId');
  if (!guest) {
    guest = `guest_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem('travel-bingo:guestId', guest);
  }
  return guest;
}

export default function TravelBingoPage() {
  const { data: session, status: authStatus } = useSession();
  const [game, setGame] = useState(null);
  const [myCarId, setMyCarId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeView, setActiveView] = useState('mine'); // 'mine' | 'others' | 'feed'
  const [openTile, setOpenTile] = useState(null); // { tile, ownerCar }
  const [error, setError] = useState('');
  const userIdRef = useRef(null);

  // Establish userId once auth is resolved
  useEffect(() => {
    if (authStatus === 'loading') return;
    userIdRef.current = ensureUserId(session);
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
      const userId = userIdRef.current || ensureUserId(session);
      const res = await fetch('/api/games/travel-bingo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, hostCarName: carName }),
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
      const userId = userIdRef.current || ensureUserId(session);
      const lookup = await fetch(`/api/games/travel-bingo/by-code/${code}`);
      if (!lookup.ok) throw new Error('Game not found for that code');
      const { gameId } = await lookup.json();

      const join = await fetch(`/api/games/travel-bingo/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carName, userId }),
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
      body: JSON.stringify({ carId: myCarId, items }),
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
      const userId = userIdRef.current || ensureUserId(session);
      const res = await fetch(`/api/games/travel-bingo/${game._id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId }),
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

  const handleMarkFound = async ({ tileId, photoUrl, caption }) => {
    if (!game?._id || !myCarId) return;
    const res = await fetch(`/api/games/travel-bingo/${game._id}/mark-tile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId: myCarId, tileId, photoUrl, caption, found: true }),
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
      body: JSON.stringify({ carId: myCarId, tileId, found: false }),
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

  const isHost = !!(game && userIdRef.current && game.travelBingoConfig?.hostUserId === userIdRef.current);
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">
        <ProfessionalHeader />

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
              <p className="text-xs text-slate-500 mb-2">
                Game code: <span className="font-mono font-bold text-emerald-700 tracking-wider">{game.travelBingoConfig.joinCode}</span>
              </p>
              <button onClick={handleLeave} className="text-xs text-slate-400 hover:text-red-600 underline">
                Leave game
              </button>
            </div>
          </>
        )}

        {game && phase === 'generating' && (
          <div className="max-w-md mx-auto px-4 pt-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
            <p className="mt-4 text-slate-600 font-semibold">AI is building your bingo cards…</p>
            <p className="text-xs text-slate-400 mt-1">This usually takes a few seconds.</p>
          </div>
        )}

        {game && phase === 'playing' && myCar && (
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-10">
            <div className="flex bg-white rounded-xl shadow p-1 mb-4 border border-emerald-100">
              <button
                onClick={() => setActiveView('mine')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'mine' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
                }`}
              >
                My card
              </button>
              <button
                onClick={() => setActiveView('others')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'others' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
                }`}
              >
                Other cars
              </button>
              <button
                onClick={() => setActiveView('feed')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeView === 'feed' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
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
                  <p className="text-center text-sm text-slate-500">No other cars yet.</p>
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
              <p className="text-xs text-slate-500">
                Game code: <span className="font-mono font-bold text-emerald-700 tracking-wider">{game.travelBingoConfig.joinCode}</span>
              </p>
              <button onClick={handleLeave} className="text-xs text-slate-400 hover:text-red-600 underline mt-1">
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          </div>
        )}

        <TileDetailModal
          open={!!openTile}
          tile={openTile?.tile}
          ownerCar={openTile?.ownerCar}
          myCarId={myCarId}
          gameId={game?._id}
          onClose={() => setOpenTile(null)}
          onMarkFound={handleMarkFound}
          onUnmark={handleUnmark}
          onAddComment={handleAddComment}
        />
      </main>
    </>
  );
}
