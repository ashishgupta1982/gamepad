import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import GameShell from '@/components/layout/GameShell';
import DartsHome from '@/components/darts/DartsHome';
import GameModeSelector from '@/components/darts/GameModeSelector';
import PlayerSetup from '@/components/darts/PlayerSetup';
import X01Setup from '@/components/darts/X01Setup';
import X01Game from '@/components/darts/X01Game';
import CricketGame from '@/components/darts/CricketGame';
import ClockGame from '@/components/darts/ClockGame';
import KillerGame from '@/components/darts/KillerGame';
import DartsGameOver from '@/components/darts/DartsGameOver';
import RulesModal from '@/components/darts/RulesModal';
import { CRICKET_TARGETS, GAME_MODES } from '@/data/dartsConstants';
import GuestNotice from '@/components/game/GuestNotice';

// Screens: loading, home, mode-select, setup, playing, game-over
export default function DartsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [screen, setScreen] = useState('loading');
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [previousNames, setPreviousNames] = useState([]);

  // Setup state
  const [gameMode, setGameMode] = useState(null);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [startingScore, setStartingScore] = useState(501);
  const [legs, setLegs] = useState(1);
  const [doubleOut, setDoubleOut] = useState(true);
  const [doubleIn, setDoubleIn] = useState(false);

  // Killer number assignment
  const [killerNumbers, setKillerNumbers] = useState([]);
  const [showRules, setShowRules] = useState(false);

  const fetchGames = useCallback(async () => {
    // /api/games is account-scoped and 401s for a guest, so there is nothing to
    // ask for. Skipping the call is not just tidiness — it is what keeps the
    // guest path free of a failed request on every visit to the home screen.
    if (status !== 'authenticated') {
      setGames([]);
      setPreviousNames([]);
      setScreen('home');
      return;
    }
    try {
      const res = await fetch('/api/games?gameType=darts');
      if (res.ok) {
        const data = await res.json();
        const dartsGames = (data.games || []).filter(g => g.gameType === 'darts');
        setGames(dartsGames);

        // Extract unique player names from past games
        const names = new Set();
        dartsGames.forEach(g => {
          g.players?.forEach(p => {
            if (p.name && !p.name.match(/^Player \d+$/)) {
              names.add(p.name);
            }
          });
        });
        setPreviousNames([...names]);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    }
    setScreen('home');
  }, [status]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const createGame = async (config) => {
    const players = playerNames;

    // Guest: a local game object, never persisted. Same `_id: 'guest'` sentinel
    // Scrabble and Quiz already use, so all three games now agree.
    //
    // Without this, Start Game was a dead button for anyone signed out: the POST
    // 401'd, createGame returned null, and `if (game) setScreen('playing')`
    // simply never fired. Nothing was logged to the user and nothing moved.
    if (status !== 'authenticated') {
      const localGame = {
        _id: 'guest',
        gameType: 'darts',
        players: players.map((p) => (typeof p === 'string' ? { name: p } : p)),
        dartsConfig: config,
        status: 'active',
      };
      setCurrentGame(localGame);
      return localGame;
    }

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: 'darts',
          players,
          dartsConfig: config,
          status: 'active'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentGame(data.game);
        return data.game;
      }
    } catch (err) {
      console.error('Failed to create game:', err);
    }
    return null;
  };

  const updateGame = async (updates) => {
    if (!currentGame?._id || currentGame._id === 'guest') return;
    try {
      await fetch(`/api/games/${currentGame._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Failed to update game:', err);
    }
  };

  const handleSelectMode = (mode) => {
    setGameMode(mode);
    if (mode === 'killer') {
      // Pre-assign random numbers for killer
      const available = Array.from({ length: 20 }, (_, i) => i + 1);
      const shuffled = available.sort(() => Math.random() - 0.5);
      setKillerNumbers(shuffled.slice(0, 8));
    }
    setScreen('setup');
  };

  const handleStartGame = async () => {
    const players = playerNames.map(name => ({ name }));
    let config = {
      gameMode,
      currentPlayerIndex: 0,
      currentRound: 1,
      turns: []
    };

    if (gameMode === 'x01') {
      config = {
        ...config,
        startingScore,
        doubleOut,
        doubleIn,
        legs,
        currentLeg: 1,
        legsWon: players.map(() => 0),
        remainingScores: players.map(() => startingScore)
      };
    } else if (gameMode === 'cricket') {
      config = {
        ...config,
        cricketMarks: players.map(() => CRICKET_TARGETS.map(() => 0)),
        cricketPoints: players.map(() => 0)
      };
    } else if (gameMode === 'around-the-clock') {
      config = {
        ...config,
        clockTargets: players.map(() => 1)
      };
    } else if (gameMode === 'killer') {
      config = {
        ...config,
        killerNumbers: killerNumbers.slice(0, players.length),
        killerLives: players.map(() => 3),
        killerActive: players.map(() => false)
      };
    }

    const game = await createGame(config);
    if (game) {
      setScreen('playing');
    }
  };

  const handleUpdateConfig = (newConfig) => {
    setCurrentGame(prev => ({
      ...prev,
      dartsConfig: newConfig
    }));
    updateGame({ dartsConfig: newConfig });
  };

  const handleLegWon = () => {
    // Handled within X01Game
  };

  const handleGameOver = () => {
    updateGame({ status: 'completed' });
    setScreen('game-over');
  };

  const handleContinueGame = (game) => {
    setCurrentGame(game);
    setGameMode(game.dartsConfig?.gameMode);
    setPlayerNames(game.players?.map(p => p.name) || ['Player 1', 'Player 2']);
    setScreen('playing');
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      setGames(games.filter(g => g._id !== gameId));
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  };

  const handlePlayAgain = async () => {
    setScreen('setup');
  };

  const handleEndGame = () => {
    setCurrentGame(null);
    fetchGames();
  };

  const handleBack = () => {
    if (screen === 'playing') {
      // Set screen first so game component unmounts before config is nulled
      setScreen('home');
      setCurrentGame(null);
      fetchGames();
    } else if (screen === 'setup') {
      setScreen('mode-select');
    } else if (screen === 'mode-select') {
      setScreen('home');
    } else if (screen === 'game-over') {
      fetchGames();
    }
  };

  const players = currentGame?.players || playerNames.map(name => ({ name }));
  const dartsConfig = currentGame?.dartsConfig || {};

  // Titles the shell by screen, so the header says where you are rather than
  // repeating "Darts" over a screen that is plainly a Cricket board.
  const shellTitle =
    screen === 'playing' || screen === 'game-over'
      ? GAME_MODES.find((m) => m.id === gameMode)?.name || 'Darts'
      : 'Darts Scorer';

  const shellBack = () => {
    if (screen === 'mode-select') return setScreen('home');
    if (screen === 'setup') return setScreen('mode-select');
    if (screen === 'playing' || screen === 'game-over') return handleBack();
    return router.push('/');
  };

  return (
    <GameShell
      title={shellTitle}
      onBack={shellBack}
      // A darts leg is read between throws far more often than it is touched.
      keepAwake={screen === 'playing'}
    >
      <div>
        {screen === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-game-darts border-t-transparent rounded-full" />
          </div>
        )}

        {screen === 'home' && (
          <DartsHome
            games={games}
            onNewGame={() => setScreen('mode-select')}
            onContinueGame={handleContinueGame}
            onDeleteGame={handleDeleteGame}
          />
        )}

        {screen === 'mode-select' && (
          <GameModeSelector
            onSelectMode={handleSelectMode}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'setup' && (
          <div className="max-w-lg mx-auto">
            <GuestNotice className="mb-4" />

            <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
              {gameMode === 'x01' ? 'X01 Setup' :
               gameMode === 'cricket' ? 'Cricket Setup' :
               gameMode === 'around-the-clock' ? 'Around the Clock' :
               'Killer Setup'}
            </h2>

            <div className="text-center mb-5">
              <button
                onClick={() => setShowRules(true)}
                className="text-sm font-semibold text-accent hover:text-accent transition-colors"
              >
                How to Play?
              </button>
            </div>

            {/* X01 specific settings */}
            {gameMode === 'x01' && (
              <div className="mb-4">
                <X01Setup
                  startingScore={startingScore}
                  onStartingScoreChange={setStartingScore}
                  legs={legs}
                  onLegsChange={setLegs}
                  doubleOut={doubleOut}
                  onDoubleOutChange={setDoubleOut}
                  doubleIn={doubleIn}
                  onDoubleInChange={setDoubleIn}
                />
              </div>
            )}

            {/* Player setup */}
            <div className="bg-card rounded-xl p-3 border border-border mb-4">
              <PlayerSetup
                players={playerNames}
                onPlayersChange={setPlayerNames}
                previousNames={previousNames}
              />
            </div>

            {/* Killer number assignment */}
            {gameMode === 'killer' && (
              <div className="bg-card rounded-xl p-3 border border-border mb-4">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Assigned Numbers
                </label>
                <div className="space-y-1.5">
                  {playerNames.map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-brand/10 rounded-lg">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      <span className="text-sm font-bold text-brand">
                        Double {killerNumbers[idx] || idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const available = Array.from({ length: 20 }, (_, i) => i + 1);
                    const shuffled = available.sort(() => Math.random() - 0.5);
                    setKillerNumbers(shuffled.slice(0, 8));
                  }}
                  className="mt-2 w-full py-2 text-xs font-semibold text-brand bg-brand/10
                             rounded-lg hover:bg-brand/10 transition-colors"
                >
                  Re-shuffle Numbers
                </button>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-game-darts to-game-darts-deep text-white font-bold
                         text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              Start Game
            </button>
          </div>
        )}

        {screen === 'playing' && gameMode === 'x01' && (
          <X01Game
            players={players}
            dartsConfig={dartsConfig}
            onUpdateConfig={handleUpdateConfig}
            onLegWon={handleLegWon}
            onGameOver={handleGameOver}
            onBack={handleBack}
          />
        )}

        {screen === 'playing' && gameMode === 'cricket' && (
          <CricketGame
            players={players}
            dartsConfig={dartsConfig}
            onUpdateConfig={handleUpdateConfig}
            onGameOver={handleGameOver}
            onBack={handleBack}
          />
        )}

        {screen === 'playing' && gameMode === 'around-the-clock' && (
          <ClockGame
            players={players}
            dartsConfig={dartsConfig}
            onUpdateConfig={handleUpdateConfig}
            onGameOver={handleGameOver}
            onBack={handleBack}
          />
        )}

        {screen === 'playing' && gameMode === 'killer' && (
          <KillerGame
            players={players}
            dartsConfig={dartsConfig}
            onUpdateConfig={handleUpdateConfig}
            onGameOver={handleGameOver}
            onBack={handleBack}
          />
        )}

        {screen === 'game-over' && (
          <DartsGameOver
            players={players}
            dartsConfig={dartsConfig}
            onPlayAgain={handlePlayAgain}
            onEndGame={handleEndGame}
          />
        )}
      </div>

      {showRules && (
        <RulesModal
          mode={GAME_MODES.find(m => m.id === gameMode)}
          onClose={() => setShowRules(false)}
        />
      )}
    </GameShell>
  );
}
