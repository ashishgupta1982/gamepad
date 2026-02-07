import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '../../../components/ProfessionalHeader';

export default function ScrabbleScorer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [screen, setScreen] = useState('loading'); // loading, games, setup, play
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      loadGames();
    } else {
      // Guest mode - go straight to setup
      setScreen('setup');
    }
  }, [session, status]);

  const loadGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      const scrabbleGames = data.games.filter(g => g.gameType === 'scrabble-scorer');
      setGames(scrabbleGames);
      setScreen(scrabbleGames.length > 0 ? 'games' : 'setup');
    } catch (error) {
      console.error('Failed to load games:', error);
      setScreen('setup');
    }
  };

  const handleNewGame = () => {
    setCurrentGame(null);
    setPlayerCount(2);
    setPlayerNames(['Player 1', 'Player 2']);
    setScreen('setup');
  };

  const handleContinueGame = (game) => {
    setCurrentGame(game);
    setScreen('play');
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      loadGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const handleStartGame = async () => {
    if (session) {
      // Create game in database
      try {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'scrabble-scorer',
            players: playerNames
          })
        });
        const data = await res.json();
        setCurrentGame(data.game);
        setScreen('play');
      } catch (error) {
        console.error('Failed to create game:', error);
      }
    } else {
      // Guest mode - create temporary game
      setCurrentGame({
        _id: 'guest',
        players: playerNames.map(name => ({ name, scores: [] })),
        gameType: 'scrabble-scorer'
      });
      setScreen('play');
    }
  };

  const handleAddScore = async (playerIndex, score) => {
    const updatedPlayers = [...currentGame.players];
    updatedPlayers[playerIndex].scores.push(parseInt(score));

    setCurrentGame({ ...currentGame, players: updatedPlayers });

    // Check for high score (50+)
    if (score >= 50) {
      showNotification(`🎉 Amazing! ${updatedPlayers[playerIndex].name} scored ${score} points!`);
    } else if (score >= 30) {
      showNotification(`👏 Great score! ${updatedPlayers[playerIndex].name} got ${score} points!`);
    }

    // Save to database if logged in
    if (session && currentGame._id !== 'guest') {
      try {
        await fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: updatedPlayers })
        });
      } catch (error) {
        console.error('Failed to save score:', error);
      }
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEndGame = async () => {
    if (session && currentGame._id !== 'guest') {
      try {
        await fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (error) {
        console.error('Failed to end game:', error);
      }
    }
    router.push('/');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Scrabble Scorer - Gamepad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <ProfessionalHeader />

        {/* Notification */}
        {notification && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
              {notification}
            </div>
          </div>
        )}

        <div className="pt-16 px-2 md:px-4 pb-6">
          {screen === 'games' && (
            <GamesListScreen
              games={games}
              onNewGame={handleNewGame}
              onContinueGame={handleContinueGame}
              onDeleteGame={handleDeleteGame}
            />
          )}

          {screen === 'setup' && (
            <PlayerSetupScreen
              games={games}
              playerCount={playerCount}
              playerNames={playerNames}
              onPlayerCountChange={(count) => {
                setPlayerCount(count);
                setPlayerNames(Array.from({ length: count }, (_, i) => `Player ${i + 1}`));
              }}
              onPlayerNameChange={(index, name) => {
                const newNames = [...playerNames];
                newNames[index] = name;
                setPlayerNames(newNames);
              }}
              onStart={handleStartGame}
              onBack={() => session ? loadGames() : router.push('/')}
            />
          )}

          {screen === 'play' && currentGame && (
            <GamePlayScreen
              game={currentGame}
              onAddScore={handleAddScore}
              onEndGame={handleEndGame}
              onBack={() => session ? loadGames() : router.push('/')}
            />
          )}
        </div>
      </main>
    </>
  );
}

// Games List Screen Component
function GamesListScreen({ games, onNewGame, onContinueGame, onDeleteGame }) {
  const activeGames = games.filter(g => g.status === 'active');
  const completedGames = games.filter(g => g.status === 'completed');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeader = (game) => {
    const totals = game.players.map(p => ({
      name: p.name,
      total: p.scores.reduce((sum, s) => sum + s, 0)
    }));
    totals.sort((a, b) => b.total - a.total);
    return totals[0];
  };

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => window.location.href = '/'}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
      >
        &larr; Back to Games
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
        Scrabble Scorer
      </h1>

      <div className="text-center mb-6">
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:scale-105 transform transition-all shadow-md"
        >
          + New Game
        </button>
      </div>

      {activeGames.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-3">Active Games</h2>
          <div className="space-y-2">
            {activeGames.map(game => {
              const leader = getLeader(game);
              return (
                <div key={game._id} className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-medium text-sm text-slate-700 truncate">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-xs text-purple-600 mt-0.5">
                        {leader.name} leading &mdash; {leader.total} pts
                      </div>
                    </div>
                    <div className="flex gap-1.5 ml-2 shrink-0">
                      <button
                        onClick={() => onContinueGame(game)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:scale-105 transform transition-all"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => onDeleteGame(game._id)}
                        className="text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedGames.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-3">Completed Games</h2>
          <div className="space-y-2">
            {completedGames.map(game => {
              const leader = getLeader(game);
              return (
                <div key={game._id} className="bg-slate-50 rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-medium text-sm text-slate-600 truncate">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-xs text-purple-600 mt-0.5">
                        {leader.name} won &mdash; {leader.total} pts
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteGame(game._id)}
                      className="text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50 transition-colors ml-2 shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Player Setup Screen Component
function PlayerSetupScreen({ games, playerCount, playerNames, onPlayerCountChange, onPlayerNameChange, onStart, onBack }) {
  const previousNames = [...new Set(games.flatMap(g => g.players.map(p => p.name)))]
    .filter(name => !/^Player \d+$/.test(name));

  const fillNextSlot = (name) => {
    const nextSlot = playerNames.findIndex((n) => /^Player \d+$/.test(n));
    if (nextSlot !== -1) {
      onPlayerNameChange(nextSlot, name);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
      >
        &larr; Back
      </button>

      <div className="bg-white rounded-xl p-5 shadow-md">
        <h2 className="text-xl font-bold text-center mb-5 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Set Up Your Game
        </h2>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Players
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => onPlayerCountChange(num)}
                className={`
                  py-2.5 rounded-lg text-base font-bold transition-all
                  ${playerCount === num
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Names
          </label>

          {previousNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {previousNames.map(name => (
                <button
                  key={name}
                  onClick={() => fillNextSlot(name)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95 transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => onPlayerNameChange(index, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm"
                placeholder={`Player ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={playerNames.some(name => !name.trim())}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold hover:scale-[1.02] transform transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

// Game Play Screen Component
function GamePlayScreen({ game, onAddScore, onEndGame, onBack }) {
  const [scoreInputs, setScoreInputs] = useState({});
  const [editingScore, setEditingScore] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showWordChecker, setShowWordChecker] = useState(false);
  const [wordToCheck, setWordToCheck] = useState('');
  const [wordCheckResult, setWordCheckResult] = useState(null);
  const [isCheckingWord, setIsCheckingWord] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [editingPlayerName, setEditingPlayerName] = useState(null);
  const [editPlayerNameValue, setEditPlayerNameValue] = useState('');
  const inputRefs = React.useRef([]);
  const { data: session } = useSession();

  // Default all history expanded
  useEffect(() => {
    const expanded = {};
    game.players.forEach((_, index) => {
      expanded[index] = true;
    });
    setExpandedHistory(expanded);
  }, [game.players]);

  const toggleHistory = (playerIndex) => {
    setExpandedHistory(prev => ({
      ...prev,
      [playerIndex]: !prev[playerIndex]
    }));
  };

  const getTotalScore = (playerIndex) => {
    return game.players[playerIndex].scores.reduce((sum, score) => sum + score, 0);
  };

  const getPlayerPosition = (playerIndex) => {
    const totals = game.players.map((p, i) => ({ index: i, total: getTotalScore(i) }));
    totals.sort((a, b) => b.total - a.total);
    return totals.findIndex(p => p.index === playerIndex) + 1;
  };

  const allScores = game.players.flatMap(p => p.scores).filter(s => s > 0);
  const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const worstScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  const handleSubmitScore = (playerIndex) => {
    const score = scoreInputs[playerIndex];
    if (score && !isNaN(score) && parseInt(score) >= 0) {
      onAddScore(playerIndex, score);
      setScoreInputs({ ...scoreInputs, [playerIndex]: '' });

      const nextPlayerIndex = (playerIndex + 1) % game.players.length;
      setTimeout(() => {
        const nextInput = inputRefs.current[nextPlayerIndex];
        if (nextInput) {
          nextInput.focus();
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleEditScore = async (playerIndex, scoreIndex, newScore) => {
    if (!newScore || isNaN(newScore) || parseInt(newScore) < 0) return;

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex].scores[scoreIndex] = parseInt(newScore);
    game.players = updatedPlayers;

    if (session && game._id !== 'guest') {
      try {
        await fetch(`/api/games/${game._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: updatedPlayers })
        });
      } catch (error) {
        console.error('Failed to save edited score:', error);
      }
    }

    setEditingScore(null);
    setEditValue('');
  };

  const startEditing = (playerIndex, scoreIndex, currentScore) => {
    setEditingScore({ playerIndex, scoreIndex });
    setEditValue(currentScore.toString());
  };

  const cancelEditing = () => {
    setEditingScore(null);
    setEditValue('');
  };

  const handleEditPlayerName = async (playerIndex, newName) => {
    if (!newName || !newName.trim()) return;

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex].name = newName.trim();
    game.players = updatedPlayers;

    if (session && game._id !== 'guest') {
      try {
        await fetch(`/api/games/${game._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: updatedPlayers })
        });
      } catch (error) {
        console.error('Failed to save player name:', error);
      }
    }

    setEditingPlayerName(null);
    setEditPlayerNameValue('');
  };

  const startEditingPlayerName = (playerIndex, currentName) => {
    setEditingPlayerName(playerIndex);
    setEditPlayerNameValue(currentName);
  };

  const cancelEditingPlayerName = () => {
    setEditingPlayerName(null);
    setEditPlayerNameValue('');
  };

  const handleCheckWord = async () => {
    if (!wordToCheck.trim()) return;

    setIsCheckingWord(true);
    setWordCheckResult(null);

    try {
      const prompt = `You are a Scrabble word validator. Please check if "${wordToCheck.toUpperCase()}" is a valid Scrabble word according to the official Scrabble dictionary (which is based on standard dictionaries like the Oxford English Dictionary).

Respond in this format:

**${wordToCheck.toUpperCase()}** - [✅ Valid or ❌ Not Valid]

**Definition:** [If valid, provide a clear, concise definition. If not valid, explain why it's not accepted in Scrabble]

**Dictionary Status:** [Mention if it appears in the Oxford English Dictionary and any relevant notes about its usage, etymology, or interesting facts]

Keep your response clear, informative and helpful for family game play.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useCache: false })
      });

      if (!response.ok) {
        throw new Error('Failed to check word');
      }

      const result = await response.json();
      setWordCheckResult(result);
    } catch (error) {
      console.error('Error checking word:', error);
      setWordCheckResult('Sorry, there was an error checking this word. Please try again.');
    } finally {
      setIsCheckingWord(false);
    }
  };

  // Dynamic grid classes based on player count
  const gridClass = game.players.length === 1
    ? 'grid-cols-1 max-w-xs mx-auto'
    : game.players.length === 2
    ? 'grid-cols-2'
    : game.players.length === 3
    ? 'grid-cols-3'
    : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
        >
          &larr; Back
        </button>
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Scrabble Scorer
        </h1>
        <button
          onClick={onEndGame}
          className="text-red-400 hover:text-red-600 text-sm font-medium"
          title="End Game"
        >
          End
        </button>
      </div>

      {/* Word Checker */}
      <div className="mb-3 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => setShowWordChecker(!showWordChecker)}
          className="w-full px-3 py-2 flex justify-between items-center hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-600">Check a Word</span>
          <span className="text-purple-600 text-sm">
            {showWordChecker ? '−' : '+'}
          </span>
        </button>

        {showWordChecker && (
          <div className="px-3 pb-3 border-t border-slate-100">
            <div className="mt-2">
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={wordToCheck}
                  onChange={(e) => {
                    setWordToCheck(e.target.value);
                    setWordCheckResult(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckWord()}
                  placeholder="Enter word..."
                  className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm uppercase"
                  disabled={isCheckingWord}
                />
                <button
                  onClick={handleCheckWord}
                  disabled={!wordToCheck.trim() || isCheckingWord}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingWord ? '...' : 'Check'}
                </button>
              </div>

              {wordCheckResult && (
                <div className={`rounded-lg p-3 border ${
                  wordCheckResult.includes('✅')
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="space-y-1">
                    {wordCheckResult.split('\n').map((line, index) => {
                      if (!line.trim()) return null;
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={index} className={`${index === 0 ? 'text-sm' : 'text-xs'}`}>
                          {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={i} className="text-slate-900 font-bold">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return <span key={i} className="text-slate-700">{part}</span>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Player Columns */}
      <div className={`grid ${gridClass} gap-2`}>
        {game.players.map((player, index) => {
          const position = getPlayerPosition(index);
          const accentColor = position === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                              position === 2 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                              position === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                              'bg-slate-200';

          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              {/* Position accent bar */}
              <div className={`h-1 ${accentColor}`} />

              {/* Player name */}
              <div className="px-2 pt-2 pb-1">
                {editingPlayerName === index ? (
                  <input
                    type="text"
                    value={editPlayerNameValue}
                    onChange={(e) => setEditPlayerNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditPlayerName(index, editPlayerNameValue);
                      if (e.key === 'Escape') cancelEditingPlayerName();
                    }}
                    onBlur={() => {
                      if (editPlayerNameValue && editPlayerNameValue !== player.name) {
                        handleEditPlayerName(index, editPlayerNameValue);
                      } else {
                        cancelEditingPlayerName();
                      }
                    }}
                    autoFocus
                    className="w-full px-1 py-0.5 border border-purple-400 rounded text-xs font-semibold"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => startEditingPlayerName(index, player.name)}
                      className="text-xs font-semibold text-slate-700 truncate cursor-pointer hover:text-purple-600"
                      title="Tap to edit"
                    >
                      {player.name}
                    </span>
                    {position === 1 && getTotalScore(index) > 0 && (
                      <span className="text-xs shrink-0">👑</span>
                    )}
                  </div>
                )}
              </div>

              {/* Total score */}
              <div className="px-2 pb-2 text-center">
                <div className="text-2xl md:text-3xl font-black text-purple-600 leading-none">
                  {getTotalScore(index)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">points</div>
              </div>

              {/* Score input */}
              <div className="px-2 pb-2">
                <div className="flex gap-1">
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={scoreInputs[index] || ''}
                    onChange={(e) => setScoreInputs({ ...scoreInputs, [index]: e.target.value.replace(/[^0-9]/g, '') })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitScore(index);
                      }
                    }}
                    placeholder="+"
                    className="w-full min-w-0 px-2 py-2 rounded-md border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-center text-sm font-semibold"
                  />
                  <button
                    onClick={() => handleSubmitScore(index)}
                    className="shrink-0 bg-purple-500 text-white px-2 py-2 rounded-md text-xs font-bold hover:bg-purple-600 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Score history */}
              <div className="border-t border-slate-100 mt-auto">
                <button
                  onClick={() => toggleHistory(index)}
                  className="w-full px-2 py-1.5 flex justify-between items-center text-[10px] text-slate-400 hover:bg-slate-50"
                >
                  <span>History ({player.scores.length})</span>
                  <span>{expandedHistory[index] ? '−' : '+'}</span>
                </button>

                {expandedHistory[index] && (
                  <div className="px-2 pb-2 max-h-28 overflow-y-auto">
                    {player.scores.length > 0 ? (
                      <div className="space-y-0.5">
                        {player.scores.map((score, scoreIndex) => {
                          const isBest = score === bestScore && score > 0;
                          const isWorst = score === worstScore && score > 0 && bestScore !== worstScore;
                          const isEditing = editingScore?.playerIndex === index && editingScore?.scoreIndex === scoreIndex;

                          return (
                            <div key={scoreIndex} className="flex justify-between text-[11px] items-center">
                              <span className="text-slate-400">R{scoreIndex + 1}</span>

                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditScore(index, scoreIndex, editValue);
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    onBlur={() => {
                                      if (editValue && editValue !== score.toString()) {
                                        handleEditScore(index, scoreIndex, editValue);
                                      } else {
                                        cancelEditing();
                                      }
                                    }}
                                    autoFocus
                                    className="w-10 px-1 py-0.5 border border-purple-400 rounded text-center text-[11px] font-semibold text-purple-600"
                                  />
                                  <button
                                    onClick={cancelEditing}
                                    className="text-red-400 hover:text-red-600 text-[10px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  {isBest && <span className="text-xs" title="Best Score">🏆</span>}
                                  {isWorst && <span className="text-xs" title="Worst Score">🥄</span>}
                                  <button
                                    onClick={() => startEditing(index, scoreIndex, score)}
                                    className="font-medium text-slate-600 hover:text-purple-600 px-1 py-0.5 rounded text-[11px]"
                                    title="Tap to edit"
                                  >
                                    {score}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-300 italic">No scores</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
