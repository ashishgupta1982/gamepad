import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '@/components/ProfessionalHeader';
import DartsHome from '@/components/darts/DartsHome';
import GameModeSelector from '@/components/darts/GameModeSelector';
import PlayerSetup from '@/components/darts/PlayerSetup';
import X01Setup from '@/components/darts/X01Setup';
import X01Game from '@/components/darts/X01Game';
import CricketGame from '@/components/darts/CricketGame';
import ClockGame from '@/components/darts/ClockGame';
import KillerGame from '@/components/darts/KillerGame';
import DartsGameOver from '@/components/darts/DartsGameOver';
import { CRICKET_TARGETS } from '@/data/dartsConstants';

// Screens: loading, home, mode-select, setup, playing, game-over
export default function DartsPage() {
  const router = useRouter();
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

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games?gameType=darts');
      if (res.ok) {
        const data = await res.json();
        setGames(data);

        // Extract unique player names from past games
        const names = new Set();
        data.forEach(g => {
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
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const createGame = async (config) => {
    try {
      const players = playerNames.map(name => ({ name }));
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
        const game = await res.json();
        setCurrentGame(game);
        return game;
      }
    } catch (err) {
      console.error('Failed to create game:', err);
    }
    return null;
  };

  const updateGame = async (updates) => {
    if (!currentGame?._id) return;
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
      // Save and go home
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <ProfessionalHeader />
      <div className="p-4 pb-20">
        {screen === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
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
            <button
              onClick={() => setScreen('mode-select')}
              className="mb-4 text-red-500 hover:text-red-600 font-semibold text-sm"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-center mb-5 text-slate-800">
              {gameMode === 'x01' ? 'X01 Setup' :
               gameMode === 'cricket' ? 'Cricket Setup' :
               gameMode === 'around-the-clock' ? 'Around the Clock' :
               'Killer Setup'}
            </h2>

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
            <div className="bg-white rounded-xl p-3 border border-slate-100 mb-4">
              <PlayerSetup
                players={playerNames}
                onPlayersChange={setPlayerNames}
                previousNames={previousNames}
              />
            </div>

            {/* Killer number assignment */}
            {gameMode === 'killer' && (
              <div className="bg-white rounded-xl p-3 border border-slate-100 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                  Assigned Numbers
                </label>
                <div className="space-y-1.5">
                  {playerNames.map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-purple-50 rounded-lg">
                      <span className="text-sm font-semibold text-slate-700">{name}</span>
                      <span className="text-sm font-bold text-purple-600">
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
                  className="mt-2 w-full py-2 text-xs font-semibold text-purple-600 bg-purple-50
                             rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Re-shuffle Numbers
                </button>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold
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
    </div>
  );
}
