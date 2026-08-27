import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { BookOpen, Flag, Pencil } from 'lucide-react';
import GameShell from '@/components/layout/GameShell';
import { Button } from '@/components/ui/button';
import GamesListScreen from '@/components/scrabble/GamesListScreen';
import PlayerSetupScreen from '@/components/scrabble/PlayerSetupScreen';
import Scoreboard from '@/components/scrabble/Scoreboard';
import ScoreEntrySheet from '@/components/scrabble/ScoreEntrySheet';
import PlayerSheet from '@/components/scrabble/PlayerSheet';
import WordCheckerSheet from '@/components/scrabble/WordCheckerSheet';
import { celebrate, nextPlayerIndex } from '@/lib/scrabble';

// Scrabble Scorer — orchestration only.
//
// This file was 867 lines with four screen components inline. The screens now
// live in components/scrabble/; this holds game state, the persistence rules and
// the routing between screens.
//
// ─── The bug this rewrite fixes ────────────────────────────────────────────
//
// The old edit handlers did `game.players = updatedPlayers` — assigning to a
// prop. React never saw a state change. The UI appeared to update only because
// an unrelated setState in the same handler forced a re-render and the mutated
// object happened to be the one being read. The mutation also leaked into the
// `games` array, so returning to the list showed an edit as saved when no
// request had been made. Every update below is immutable and goes through
// `applyPlayers`.
export default function ScrabbleScorer() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [screen, setScreen] = useState('loading'); // loading | games | setup | play
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [notification, setNotification] = useState(null);

  const [scoringFor, setScoringFor] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [wordCheckerOpen, setWordCheckerOpen] = useState(false);

  const isGuestGame = !session || currentGame?._id === 'guest';

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      const mine = (data.games || []).filter((g) => g.gameType === 'scrabble-scorer');
      setGames(mine);
      setScreen(mine.length ? 'games' : 'setup');
    } catch {
      setGames([]);
      setScreen('setup');
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') loadGames();
    else setScreen('setup');
  }, [status, loadGames]);

  const notify = (message) => {
    if (!message) return;
    setNotification(message);
    setTimeout(() => setNotification(null), 2600);
  };

  // The single write path. Local state first so the board never lags a tap,
  // then persist — and only when there is somewhere to persist to.
  const applyPlayers = useCallback(
    async (players) => {
      setCurrentGame((prev) => (prev ? { ...prev, players } : prev));

      const id = currentGame?._id;
      if (!session || !id || id === 'guest') return;
      try {
        await fetch(`/api/games/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players }),
        });
      } catch {
        // A failed save must not roll the board back mid-game. What is on
        // screen is what the table is playing to.
      }
    },
    [session, currentGame?._id],
  );

  const withPlayers = (mutate) => {
    if (!currentGame) return null;
    const players = currentGame.players.map((p) => ({ ...p, scores: [...(p.scores || [])] }));
    mutate(players);
    return players;
  };

  const handleAddScore = (playerIndex, score) => {
    const players = withPlayers((next) => next[playerIndex].scores.push(score));
    if (!players) return;
    applyPlayers(players);
    notify(celebrate(players[playerIndex].name, score));
  };

  const handleEditScore = (playerIndex, scoreIndex, score) => {
    const players = withPlayers((next) => {
      next[playerIndex].scores[scoreIndex] = score;
    });
    if (players) applyPlayers(players);
  };

  const handleRemoveScore = (playerIndex, scoreIndex) => {
    const players = withPlayers((next) => {
      next[playerIndex].scores.splice(scoreIndex, 1);
    });
    if (players) applyPlayers(players);
  };

  const handleRename = (playerIndex, name) => {
    const players = withPlayers((next) => {
      next[playerIndex].name = name;
    });
    if (players) applyPlayers(players);
  };

  const handleStartGame = async () => {
    const names = playerNames.map((n) => n.trim());
    if (names.some((n) => !n)) return;

    if (session) {
      try {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameType: 'scrabble-scorer', players: names }),
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentGame(data.game);
          setScreen('play');
          return;
        }
      } catch {
        // Fall through to a local game rather than stranding the player. A
        // scoreboard that works without the server beats a dead Start button —
        // which is exactly what Darts used to do in this situation.
      }
    }

    setCurrentGame({
      _id: 'guest',
      gameType: 'scrabble-scorer',
      players: names.map((name) => ({ name, scores: [] })),
      status: 'active',
    });
    setScreen('play');
  };

  const handleEndGame = async () => {
    const id = currentGame?._id;
    if (session && id && id !== 'guest') {
      try {
        await fetch(`/api/games/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
      } catch {
        /* ending a game is not worth blocking on */
      }
    }
    setCurrentGame(null);
    if (session) loadGames();
    else router.push('/');
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    try {
      await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
    } catch {
      /* the reload below shows whether it went */
    }
    loadGames();
  };

  const leaveToGames = () => {
    if (session && games.length) {
      setCurrentGame(null);
      setScreen('games');
    } else {
      router.push('/');
    }
  };

  const players = currentGame?.players || [];
  const suggested = Math.min(nextPlayerIndex(players), Math.max(players.length - 1, 0));

  return (
    <>
      <Head>
        <title>Scrabble Scorer — GamePad</title>
        <meta
          name="description"
          content="Track Scrabble scores for up to four players, with turn history and awards."
        />
      </Head>

      {screen === 'loading' && (
        <GameShell title="Scrabble Scorer" onBack={() => router.push('/')}>
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        </GameShell>
      )}

      {screen === 'games' && (
        <GameShell title="Scrabble Scorer" onBack={() => router.push('/')}>
          <GamesListScreen
            games={games}
            onNewGame={() => {
              setPlayerCount(2);
              setPlayerNames(['Player 1', 'Player 2']);
              setScreen('setup');
            }}
            onContinueGame={(game) => {
              setCurrentGame(game);
              setScreen('play');
            }}
            onDeleteGame={handleDeleteGame}
          />
        </GameShell>
      )}

      {screen === 'setup' && (
        <GameShell
          title="Scrabble Scorer"
          onBack={() => (session && games.length ? setScreen('games') : router.push('/'))}
          actions={
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleStartGame}
              disabled={playerNames.some((n) => !n.trim())}
            >
              Start game
            </Button>
          }
        >
          <PlayerSetupScreen
            previousNames={[
              ...new Set(games.flatMap((g) => (g.players || []).map((p) => p.name))),
            ].filter((n) => n && !/^Player \d+$/.test(n))}
            playerCount={playerCount}
            playerNames={playerNames}
            onPlayerCountChange={(count) => {
              setPlayerCount(count);
              setPlayerNames((prev) =>
                Array.from({ length: count }, (_, i) => prev[i] || `Player ${i + 1}`),
              );
            }}
            onPlayerNameChange={(index, name) =>
              setPlayerNames((prev) => prev.map((n, i) => (i === index ? name : n)))
            }
          />
        </GameShell>
      )}

      {screen === 'play' && currentGame && (
        <GameShell
          title="Scrabble"
          onBack={leaveToGames}
          // A scoreboard is looked at far more than it is touched — exactly what
          // the wake lock is for.
          keepAwake
          actions={
            <>
              <Button
                type="button"
                fullWidth
                size="lg"
                onClick={() => setScoringFor(suggested)}
                disabled={!players.length}
              >
                Add score for {players[suggested]?.name}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setWordCheckerOpen(true)}
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Check a word
                </Button>
                <Button type="button" variant="ghost" onClick={handleEndGame}>
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  End game
                </Button>
              </div>
            </>
          }
        >
          {isGuestGame && (
            <p className="mb-3 text-xs text-muted-foreground">
              Not signed in — this game won’t be saved.
            </p>
          )}

          <Scoreboard
            players={players}
            expandedIndex={expandedRow}
            onAddScore={(index) => setScoringFor(index)}
            onOpenPlayer={(index) => setExpandedRow((prev) => (prev === index ? null : index))}
          />

          {expandedRow !== null && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="mt-3"
              onClick={() => setViewingPlayer(expandedRow)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit {players[expandedRow]?.name}
            </Button>
          )}
        </GameShell>
      )}

      {/* Toast, above the action bar. It used to sit under the header, where it
          covered the score it was congratulating. */}
      {notification && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-4 bottom-32 z-40 mx-auto max-w-sm animate-slide-up rounded-lg bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg"
        >
          {notification}
        </div>
      )}

      <ScoreEntrySheet
        open={scoringFor !== null}
        onOpenChange={(open) => !open && setScoringFor(null)}
        player={scoringFor !== null ? players[scoringFor] : null}
        onSubmit={(score) => handleAddScore(scoringFor, score)}
      />

      <PlayerSheet
        open={viewingPlayer !== null}
        onOpenChange={(open) => !open && setViewingPlayer(null)}
        player={viewingPlayer !== null ? players[viewingPlayer] : null}
        playerIndex={viewingPlayer ?? 0}
        onRename={handleRename}
        onEditScore={handleEditScore}
        onRemoveScore={handleRemoveScore}
      />

      <WordCheckerSheet open={wordCheckerOpen} onOpenChange={setWordCheckerOpen} />
    </>
  );
}
