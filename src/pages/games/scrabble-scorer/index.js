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
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold">
              {notification}
            </div>
          </div>
        )}

        <div className="pt-20 px-4 pb-12">
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
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => window.location.href = '/'}
        className="mb-6 text-purple-600 hover:text-purple-700 font-semibold text-sm md:text-base"
      >
        ← Back to Games
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
        🎲 Scrabble Scorer
      </h1>

      <div className="text-center mb-8">
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg"
        >
          ➕ New Game
        </button>
      </div>

      {activeGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Active Games</h2>
          <div className="space-y-4">
            {activeGames.map(game => {
              const leader = getLeader(game);
              return (
                <div key={game._id} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-semibold text-slate-700">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        👑 {leader.name} leading with {leader.total} points
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onContinueGame(game)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transform transition-all"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => onDeleteGame(game._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
                      >
                        🗑️
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
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Completed Games</h2>
          <div className="space-y-4">
            {completedGames.map(game => {
              const leader = getLeader(game);
              return (
                <div key={game._id} className="bg-slate-100 rounded-2xl p-6 shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-semibold text-slate-600">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        🏆 {leader.name} won with {leader.total} points
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteGame(game._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
                    >
                      🗑️
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
function PlayerSetupScreen({ playerCount, playerNames, onPlayerCountChange, onPlayerNameChange, onStart, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-purple-600 hover:text-purple-700 font-semibold"
      >
        ← Back
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Set Up Your Game
        </h2>

        <div className="mb-8">
          <label className="block text-lg font-semibold text-slate-700 mb-4">
            Number of Players
          </label>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => onPlayerCountChange(num)}
                className={`
                  py-4 rounded-xl text-2xl font-bold transition-all
                  ${playerCount === num
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-semibold text-slate-700 mb-4">
            Player Names
          </label>
          <div className="space-y-4">
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => onPlayerNameChange(index, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-lg"
                placeholder={`Player ${index + 1} name`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={playerNames.some(name => !name.trim())}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game! 🎮
        </button>
      </div>
    </div>
  );
}

// Game Play Screen Component
function GamePlayScreen({ game, onAddScore, onEndGame, onBack }) {
  const [scoreInputs, setScoreInputs] = useState({});
  const [editingScore, setEditingScore] = useState(null); // { playerIndex, scoreIndex }
  const [editValue, setEditValue] = useState('');
  const [showWordChecker, setShowWordChecker] = useState(false);
  const [wordToCheck, setWordToCheck] = useState('');
  const [wordCheckResult, setWordCheckResult] = useState(null);
  const [isCheckingWord, setIsCheckingWord] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [editingPlayerName, setEditingPlayerName] = useState(null); // playerIndex
  const [editPlayerNameValue, setEditPlayerNameValue] = useState('');
  const inputRefs = React.useRef([]);
  const { data: session } = useSession();

  // Detect mobile and set default collapsed state
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Collapse all by default on mobile
      const collapsed = {};
      game.players.forEach((_, index) => {
        collapsed[index] = false;
      });
      setExpandedHistory(collapsed);
    } else {
      // Expand all by default on desktop
      const expanded = {};
      game.players.forEach((_, index) => {
        expanded[index] = true;
      });
      setExpandedHistory(expanded);
    }
  }, []);

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

      // Move focus to next player's input (rotate back to first player)
      const nextPlayerIndex = (playerIndex + 1) % game.players.length;
      setTimeout(() => {
        inputRefs.current[nextPlayerIndex]?.focus();
      }, 100);
    }
  };

  const handleEditScore = async (playerIndex, scoreIndex, newScore) => {
    if (!newScore || isNaN(newScore) || parseInt(newScore) < 0) return;

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex].scores[scoreIndex] = parseInt(newScore);

    // Update local state
    game.players = updatedPlayers;

    // Save to database if logged in
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

    // Update local state
    game.players = updatedPlayers;

    // Save to database if logged in
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Title and Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 gap-3">
        <button
          onClick={onBack}
          className="self-start text-purple-600 hover:text-purple-700 font-semibold text-sm md:text-base"
        >
          ← Back
        </button>
        <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          🎲 Scrabble Scorer
        </h1>
        <button
          onClick={onEndGame}
          className="self-end bg-red-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          title="End Game"
        >
          ✕
        </button>
      </div>

      {/* Word Checker Section */}
      <div className="mb-4 md:mb-8 bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowWordChecker(!showWordChecker)}
          className="w-full px-4 md:px-6 py-3 md:py-4 flex justify-between items-center hover:bg-purple-50 transition-colors"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">📖</span>
            <span className="text-base md:text-lg font-semibold text-slate-700">Check Word</span>
          </div>
          <span className="text-purple-600 text-xl md:text-2xl">
            {showWordChecker ? '−' : '+'}
          </span>
        </button>

        {showWordChecker && (
          <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-slate-200">
            <div className="mt-3 md:mt-4">
              <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">
                Not sure if a word is valid? Check it here!
              </p>

              <div className="flex gap-2 mb-3 md:mb-4">
                <input
                  type="text"
                  value={wordToCheck}
                  onChange={(e) => {
                    setWordToCheck(e.target.value);
                    setWordCheckResult(null); // Clear previous result when typing new word
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckWord()}
                  placeholder="Enter word to check..."
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base md:text-lg uppercase"
                  disabled={isCheckingWord}
                />
                <button
                  onClick={handleCheckWord}
                  disabled={!wordToCheck.trim() || isCheckingWord}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-8 rounded-xl text-sm md:text-base font-semibold hover:scale-105 transform transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isCheckingWord ? '...' : 'Check'}
                </button>
              </div>

              {wordCheckResult && (
                <div className={`rounded-xl p-4 md:p-6 border-2 ${
                  wordCheckResult.includes('✅')
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                }`}>
                  <div className="space-y-2 md:space-y-3">
                    {wordCheckResult.split('\n').map((line, index) => {
                      if (!line.trim()) return null;

                      // Parse markdown-style bold
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={index} className={`${index === 0 ? 'text-base md:text-xl' : 'text-sm md:text-base'}`}>
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

      {/* Score Input Section */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {game.players.map((player, index) => {
          const position = getPlayerPosition(index);
          const positionColor = position === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                position === 2 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                position === 3 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                                'bg-slate-500';
          const positionEmoji = position === 1 ? '👑' : `#${position}`;

          return (
          <div key={index} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg relative">
            {/* Position Pill */}
            {getTotalScore(index) > 0 && (
              <div className={`absolute top-3 md:top-4 right-3 md:right-4 ${positionColor} text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold flex items-center gap-1`}>
                <span>{positionEmoji}</span>
              </div>
            )}

            {editingPlayerName === index ? (
              <div className="flex gap-2 mb-3 md:mb-4 pr-12 md:pr-16">
                <input
                  type="text"
                  value={editPlayerNameValue}
                  onChange={(e) => setEditPlayerNameValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEditPlayerName(index, editPlayerNameValue);
                    } else if (e.key === 'Escape') {
                      cancelEditingPlayerName();
                    }
                  }}
                  onBlur={() => {
                    if (editPlayerNameValue && editPlayerNameValue !== player.name) {
                      handleEditPlayerName(index, editPlayerNameValue);
                    } else {
                      cancelEditingPlayerName();
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1 border-2 border-purple-500 rounded-lg font-bold text-lg md:text-xl text-slate-700"
                />
                <button
                  onClick={cancelEditingPlayerName}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <h3
                onClick={() => startEditingPlayerName(index, player.name)}
                className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-slate-700 pr-12 md:pr-16 cursor-pointer hover:text-purple-600 hover:bg-purple-50 rounded px-2 py-1 -mx-2 transition-colors group inline-block"
                title="Click to edit name"
              >
                {player.name}
                <span className="opacity-0 group-hover:opacity-100 ml-2 text-sm text-purple-400">✏️</span>
              </h3>
            )}

            <div className="flex gap-2 mb-3 md:mb-4">
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="number"
                value={scoreInputs[index] || ''}
                onChange={(e) => setScoreInputs({ ...scoreInputs, [index]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitScore(index)}
                placeholder="Enter score"
                className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base md:text-lg"
              />
              <button
                onClick={() => handleSubmitScore(index)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 md:px-6 rounded-xl text-sm md:text-base font-semibold hover:scale-105 transform transition-all"
              >
                Add
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3 md:pt-4">
              <button
                onClick={() => toggleHistory(index)}
                className="w-full flex justify-between items-center text-sm text-slate-600 mb-2 hover:text-slate-800"
              >
                <span>Score History ({player.scores.length})</span>
                <span className="text-purple-600">
                  {expandedHistory[index] ? '▼' : '▶'}
                </span>
              </button>

              {expandedHistory[index] && (
                <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                  {player.scores.length > 0 ? (
                    player.scores.map((score, scoreIndex) => {
                      const isBest = score === bestScore && score > 0;
                      const isWorst = score === worstScore && score > 0 && bestScore !== worstScore;
                      const isEditing = editingScore?.playerIndex === index && editingScore?.scoreIndex === scoreIndex;

                      return (
                        <div key={scoreIndex} className="flex justify-between text-sm items-center group">
                          <span className="text-slate-600">Round {scoreIndex + 1}</span>

                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditScore(index, scoreIndex, editValue);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                onBlur={() => {
                                  if (editValue && editValue !== score.toString()) {
                                    handleEditScore(index, scoreIndex, editValue);
                                  } else {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                                className="w-16 px-2 py-1 border-2 border-purple-500 rounded text-center font-semibold text-purple-600"
                              />
                              <button
                                onClick={cancelEditing}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 transition-opacity w-4">
                                ✏️
                              </span>
                              <span className="w-5 text-center">
                                {isBest && <span className="text-lg" title="Best Score">🏆</span>}
                                {isWorst && <span className="text-lg" title="Wooden Spoon">🥄</span>}
                              </span>
                              <button
                                onClick={() => startEditing(index, scoreIndex, score)}
                                className="font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors min-w-[3rem] text-right"
                                title="Click to edit"
                              >
                                {score}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-sm italic">No scores yet</div>
                  )}
                </div>
              )}

              <div className={`${expandedHistory[index] ? 'border-t border-slate-200 pt-2' : ''} flex justify-between font-bold text-sm md:text-base`}>
                <span>Total</span>
                <span className="text-purple-600 text-lg md:text-xl">{getTotalScore(index)}</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
