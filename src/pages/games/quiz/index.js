import Head from 'next/head';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '@/components/ProfessionalHeader';
import { CATEGORIES, AVATAR_EMOJIS, AVATAR_COLORS, GAME_MODES } from '@/data/quizConstants';
import useQuizTimer from '@/hooks/useQuizTimer';
import useQuizScoring from '@/hooks/useQuizScoring';
import useQuizRoom from '@/hooks/useQuizRoom';

import QuizHome from '@/components/quiz/QuizHome';
import CategoryPicker from '@/components/quiz/CategoryPicker';
import PlayerSetup from '@/components/quiz/PlayerSetup';
import GameSettings from '@/components/quiz/GameSettings';
import WaitingScreen from '@/components/quiz/WaitingScreen';
import QuestionDisplay from '@/components/quiz/QuestionDisplay';
import SameDeviceAnswerZones from '@/components/quiz/SameDeviceAnswerZones';
import QuestionResult from '@/components/quiz/QuestionResult';
import LiveScoreboard from '@/components/quiz/LiveScoreboard';
import FinalPodium from '@/components/quiz/FinalPodium';
import GameHistory from '@/components/quiz/GameHistory';
import LeaderboardView from '@/components/quiz/LeaderboardView';

// Multi-device components
import HostLobby from '@/components/quiz/HostLobby';
import JoinScreen from '@/components/quiz/JoinScreen';
import PlayerLobby from '@/components/quiz/PlayerLobby';

/*
 * Screen flow:
 * home -> setup -> waiting -> question -> question-result -> scoreboard -> (loop or) podium
 *                                                                          -> leaderboard
 * New round: podium -> round-setup -> waiting -> question -> ...  (scores carry over)
 * Multi-device host: home -> setup -> host-lobby -> question -> ...
 * Multi-device player: join -> player-lobby -> question -> ...  (auto-advances via SSE)
 */

export default function QuizGame() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- Screen state ---
  const [screen, setScreen] = useState('loading');
  const [gameMode, setGameMode] = useState(GAME_MODES.SAME_DEVICE);

  // --- Setup state ---
  const [players, setPlayers] = useState([
    { name: 'Player 1', avatar: AVATAR_EMOJIS[0], avatarColor: AVATAR_COLORS[0] },
    { name: 'Player 2', avatar: AVATAR_EMOJIS[1], avatarColor: AVATAR_COLORS[1] }
  ]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [timePerQuestion, setTimePerQuestion] = useState(20);

  // --- Game state ---
  const [currentGame, setCurrentGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [games, setGames] = useState([]);

  // --- Multi-device state ---
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // --- Multi-device answer state ---
  const [hostAnswered, setHostAnswered] = useState(false);
  const [multiDeviceAnswerCount, setMultiDeviceAnswerCount] = useState(0);

  // --- Hooks ---
  const { calculatePoints } = useQuizScoring();
  const timer = useQuizTimer(timePerQuestion, handleTimeUp);
  const timerStartRef = useRef(null);
  const playerAnswersRef = useRef({});
  const pendingScoresRef = useRef(null); // Deferred score updates for same-device mode

  // SSE hook for multi-device gameplay (host uses this during question/scoreboard screens)
  const isMultiDevice = gameMode === GAME_MODES.MULTI_DEVICE;
  const multiDeviceActive = isMultiDevice && roomCode &&
    ['question', 'scoreboard', 'question-result', 'podium'].includes(screen);
  const { roomState: hostRoomState } = useQuizRoom(roomCode, isHost && multiDeviceActive);
  const { roomState: playerRoomState } = useQuizRoom(roomCode, !isHost && isMultiDevice && ['question', 'question-result', 'scoreboard', 'podium'].includes(screen));

  // Sync gamePlayers and answer count from SSE for host
  useEffect(() => {
    if (!hostRoomState || !isHost) return;
    const rs = hostRoomState;
    if (rs.players && rs.players.length > 0) {
      setGamePlayers(prev => {
        return rs.players.map(p => {
          const existing = prev.find(ep => ep.id === p.id);
          const existingAnswers = existing?.answers || [];

          // During reveal, merge lastAnswer data into answers array for QuestionResult
          let answers = existingAnswers;
          if (rs.status === 'reveal' && p.lastAnswer && p.lastAnswer.questionIndex >= 0) {
            const alreadyHas = existingAnswers.some(a => a.questionIndex === p.lastAnswer.questionIndex);
            if (!alreadyHas) {
              answers = [...existingAnswers, p.lastAnswer];
            }
          }

          // Defer score sync until 'scores' status so top scoreboard doesn't update early
          const useServerScore = rs.status === 'scores' || rs.status === 'finished';
          return {
            ...p,
            score: useServerScore ? p.score : (existing?.score ?? p.score ?? 0),
            answers,
            streak: existing?.streak ?? p.streak ?? 0
          };
        });
      });
    }
    if (typeof rs.answeredCount === 'number') {
      setMultiDeviceAnswerCount(rs.answeredCount);
    }
  }, [hostRoomState?.stateVersion, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reveal for host when all multi-device players have answered
  useEffect(() => {
    if (!isHost || !isMultiDevice || screen !== 'question' || revealed) return;
    if (gamePlayers.length > 0 && multiDeviceAnswerCount >= gamePlayers.length) {
      setTimeout(() => {
        timer.stop();
        setRevealed(true);
        // Update room to reveal state
        if (roomCode) {
          fetch(`/api/quiz/rooms/${roomCode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'reveal' })
          }).catch(e => console.error('Failed to update room for reveal:', e));
        }
      }, 500);
    }
  }, [multiDeviceAnswerCount, gamePlayers.length, isHost, isMultiDevice, screen, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  // For joined players: watch SSE for question changes and reveals
  useEffect(() => {
    if (isHost || !playerRoomState || !isMultiDevice) return;
    const rs = playerRoomState;

    // Update current question from SSE
    if (rs.currentQuestion && rs.status === 'question') {
      const newIdx = rs.currentQuestionIndex;
      if (newIdx !== currentQuestionIndex || screen !== 'question') {
        setQuestions(prev => {
          const updated = [...prev];
          updated[newIdx] = { ...rs.currentQuestion, correctAnswer: null };
          return updated;
        });
        setCurrentQuestionIndex(newIdx);
        setHostAnswered(false);
        setRevealed(false);
        setScreen('question');
        timerStartRef.current = new Date(rs.questionStartedAt || Date.now()).getTime();
        timer.start();
      }
    }

    // Reveal answer from SSE
    if (rs.status === 'reveal' && rs.revealedAnswer && !revealed) {
      timer.stop();
      setRevealed(true);
      // Update current question with correct answer
      setQuestions(prev => {
        const updated = [...prev];
        const idx = rs.currentQuestionIndex;
        if (updated[idx]) {
          updated[idx] = { ...updated[idx], correctAnswer: rs.revealedAnswer.correctAnswer };
        }
        return updated;
      });
    }

    // Sync players for scoreboard
    if (rs.players) {
      setGamePlayers(prev => {
        return rs.players.map(p => {
          const existing = prev.find(ep => ep.id === p.id);
          const existingAnswers = existing?.answers || [];

          // During reveal, merge lastAnswer data for QuestionResult
          let answers = existingAnswers;
          if (rs.status === 'reveal' && p.lastAnswer && p.lastAnswer.questionIndex >= 0) {
            const alreadyHas = existingAnswers.some(a => a.questionIndex === p.lastAnswer.questionIndex);
            if (!alreadyHas) {
              answers = [...existingAnswers, p.lastAnswer];
            }
          }

          // Defer score sync until 'scores' status
          const useServerScore = rs.status === 'scores' || rs.status === 'finished';
          return {
            ...p,
            score: useServerScore ? p.score : (existing?.score ?? p.score ?? 0),
            answers,
            streak: existing?.streak ?? p.streak ?? 0
          };
        });
      });
    }

    // Transition to question-result when host moves to 'scores' status
    if (rs.status === 'scores' && screen !== 'question-result' && screen !== 'scoreboard') {
      setScreen('question-result');
    }

    // Transition to podium when host finishes the game
    if (rs.status === 'finished' && screen !== 'podium') {
      setScreen('podium');
    }
  }, [playerRoomState?.stateVersion, isHost, isMultiDevice]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Data loading ───

  const loadCustomCategories = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const user = await res.json();
        setCustomCategories(user.customQuizCategories || []);
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  }, [session]);

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      setGames(data.games?.filter(g => g.gameType === 'quiz') || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (session) {
      loadGames();
      loadCustomCategories();
    }
    setScreen('home');
  }, [session, status, loadGames, loadCustomCategories]);

  // ─── Question generation ───

  const generateQuestions = async () => {
    const categoriesToUse = selectedCategories.map(cat => {
      if (cat.startsWith('custom:')) return cat.replace('custom:', '');
      return CATEGORIES.find(c => c.id === cat)?.name || cat;
    });

    if (categoriesToUse.length === 0) categoriesToUse.push('General Knowledge');

    const questionsPerCategory = Math.ceil(questionCount / categoriesToUse.length);

    const difficultyInstructions = {
      easy: 'kids ages 5-10 with simple, fun questions',
      medium: 'teenagers and adults with intermediate questions',
      hard: 'very challenging expert-level questions'
    };

    const categoryInstructionMap = {
      'Brain Teasers': 'Create fun puzzles using lateral thinking and clever wordplay. These should require creative thinking.',
    };

    const processedCategories = categoriesToUse.map(cat => {
      if (cat.includes(':')) {
        const [topic, desc] = cat.split(':').map(s => s.trim());
        return { name: topic, description: desc };
      }
      return { name: cat, description: null };
    });

    const categoriesText = processedCategories.map(c =>
      c.description ? `${c.name} (${c.description})` : c.name
    ).join(', ');

    const customInstructions = processedCategories
      .filter(c => c.description)
      .map(c => `For "${c.name}": Focus specifically on ${c.description}.`)
      .join('\n  ');

    const specialInstructions = categoriesToUse
      .map(cat => categoryInstructionMap[cat])
      .filter(Boolean)
      .join('\n  ');

    const seed = Math.floor(Math.random() * 10000);
    const prompt = `Generate ${questionCount} multiple choice quiz questions:
- Categories: ${categoriesText}
${categoriesToUse.length > 1 ? `- ~${questionsPerCategory} questions per category` : ''}
- Each question has exactly 4 options (A, B, C, D)
- Difficulty: ${difficultyInstructions[difficulty]}
- Make questions engaging and interesting - pub quiz quality
- Distractors should be very plausible
- Vary the position of the correct answer
- Variety seed: #${seed}. Generate fresh, unique questions. Avoid the most common/obvious questions. Be creative and surprising.
${customInstructions ? `- CUSTOM INSTRUCTIONS:\n  ${customInstructions}` : ''}
${specialInstructions ? `- SPECIAL INSTRUCTIONS:\n  ${specialInstructions}` : ''}

Return ONLY a JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"category":"...","explanation":"..."}]`;

    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, useCache: false })
    });

    if (!response.ok) throw new Error('Failed to generate questions');

    const result = await response.json();
    let parsed = tryParseJSON(result);
    if (!parsed) throw new Error('Failed to parse questions');
    if (!Array.isArray(parsed)) parsed = [parsed];

    // Validate and fix: ensure 4 options
    return parsed.map(q => ({
      ...q,
      options: (q.options || []).slice(0, 4),
      correctAnswer: Math.min(q.correctAnswer || 0, 3)
    }));
  };

  function tryParseJSON(text) {
    const cleaned = String(text).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        let json = arrayMatch[0].replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(json);
      } catch (e) { /* fall through */ }
    }
    return null;
  }

  // ─── Game lifecycle ───

  const handleStartGame = async () => {
    setScreen('waiting');

    try {
      // Save new custom categories
      const newCustom = selectedCategories
        .filter(c => c.startsWith('custom:') && !customCategories.includes(c.replace('custom:', '')))
        .map(c => c.replace('custom:', ''));

      if (newCustom.length > 0 && session) {
        await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customQuizCategories: [...customCategories, ...newCustom] })
        });
        setCustomCategories(prev => [...prev, ...newCustom]);
      }

      const qs = await generateQuestions();
      setQuestions(qs);
      setCurrentQuestionIndex(0);

      // Initialize game players with scoring
      const gp = players.map((p, i) => ({
        id: `local-${i}`,
        name: p.name,
        avatar: p.avatar,
        avatarColor: p.avatarColor,
        score: 0,
        streak: 0,
        answers: []
      }));
      setGamePlayers(gp);

      // Save game to DB
      const categoriesToSave = selectedCategories.map(cat => {
        if (cat.startsWith('custom:')) return cat.replace('custom:', '');
        return CATEGORIES.find(c => c.id === cat)?.name || cat;
      });

      let game = null;
      if (session) {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'quiz',
            players: gp.map(p => p.name),
            quizConfig: {
              categories: categoriesToSave,
              totalQuestions: questionCount,
              difficulty,
              mode: gameMode,
              timePerQuestion,
              scoringType: 'speed',
              currentQuestionIndex: 0,
              currentRound: 1,
              questions: qs
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          game = data.game;
        }
      }

      if (!game) {
        game = { _id: 'guest', gameType: 'quiz' };
      }
      setCurrentGame(game);

      // Start the first question
      setPlayerAnswers({});
      setRevealed(false);
      setScreen('question');
      timerStartRef.current = Date.now();
      timer.start();
    } catch (error) {
      console.error('Failed to start game:', error);
      showNotification('Failed to generate questions. Please try again.');
      setScreen('setup');
    }
  };

  const handleStartMultiDeviceGame = async () => {
    setScreen('waiting');
    try {
      const qs = await generateQuestions();
      setQuestions(qs);
      setCurrentQuestionIndex(0);

      // Save new custom categories
      const newCustom = selectedCategories
        .filter(c => c.startsWith('custom:') && !customCategories.includes(c.replace('custom:', '')))
        .map(c => c.replace('custom:', ''));
      if (newCustom.length > 0 && session) {
        await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customQuizCategories: [...customCategories, ...newCustom] })
        });
        setCustomCategories(prev => [...prev, ...newCustom]);
      }

      const categoriesToSave = selectedCategories.map(cat => {
        if (cat.startsWith('custom:')) return cat.replace('custom:', '');
        return CATEGORIES.find(c => c.id === cat)?.name || cat;
      });

      // Create room
      const res = await fetch('/api/quiz/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            categories: categoriesToSave,
            difficulty,
            questionCount,
            timePerQuestion
          },
          questions: qs
        })
      });

      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      setRoomCode(data.roomCode);
      setIsHost(true);

      // Auto-join host as first player
      const hostPlayer = players[0] || { name: 'Host', avatar: AVATAR_EMOJIS[0], avatarColor: AVATAR_COLORS[0] };
      const joinRes = await fetch(`/api/quiz/rooms/${data.roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hostPlayer.name,
          avatar: hostPlayer.avatar,
          avatarColor: hostPlayer.avatarColor
        })
      });
      if (joinRes.ok) {
        const joinData = await joinRes.json();
        setPlayerId(joinData.playerId);
      }

      setGamePlayers([]);
      setScreen('host-lobby');
    } catch (error) {
      console.error('Failed to create room:', error);
      showNotification('Failed to create game room. Please try again.');
      setScreen('setup');
    }
  };

  // ─── Answer handling ───

  function handleTimeUp() {
    // Auto-reveal when time runs out
    if (!revealed) {
      handleReveal();
    }
  }

  const handlePlayerAnswer = (playerIdx, answerIdx) => {
    if (revealed || playerAnswersRef.current[playerIdx] !== undefined) return;

    const timeMs = Date.now() - (timerStartRef.current || Date.now());
    const answerData = { answer: answerIdx, timeMs };
    playerAnswersRef.current[playerIdx] = answerData;
    setPlayerAnswers(prev => ({
      ...prev,
      [playerIdx]: answerData
    }));

    // Auto-reveal if all players answered
    const totalAnswered = Object.keys(playerAnswersRef.current).length;
    if (totalAnswered >= gamePlayers.length) {
      setTimeout(() => handleReveal(), 300);
    }
  };

  const handleReveal = () => {
    timer.stop();
    setRevealed(true);

    // For multi-device: scores are calculated server-side in the answer API
    // Just update room status to 'reveal' so players see the answer
    if (isMultiDevice && isHost && roomCode) {
      fetch(`/api/quiz/rooms/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reveal' })
      }).catch(e => console.error('Failed to update room for reveal:', e));
      return;
    }

    // Same-device: calculate scores locally but defer score update until scoreboard
    const question = questions[currentQuestionIndex];
    const totalTimeMs = timePerQuestion * 1000;

    const pendingPoints = {};
    const updatedPlayers = gamePlayers.map((player, idx) => {
      const answer = playerAnswersRef.current[idx];
      const selectedOption = answer?.answer;
      const timeMs = answer?.timeMs || totalTimeMs;
      const correct = selectedOption === question.correctAnswer;

      const { points, streak } = calculatePoints(correct, timeMs, totalTimeMs, player.streak);
      pendingPoints[idx] = { points, streak: correct ? streak : 0 };

      return {
        ...player,
        // Don't update score yet — defer until scoreboard
        streak: correct ? streak : 0,
        answers: [
          ...player.answers,
          {
            questionIndex: currentQuestionIndex,
            selectedOption,
            timeMs,
            correct,
            points
          }
        ]
      };
    });

    pendingScoresRef.current = pendingPoints;
    setGamePlayers(updatedPlayers);
  };

  const handleShowScoreboard = () => {
    // Apply deferred score updates for same-device mode
    if (!isMultiDevice && pendingScoresRef.current) {
      const pending = pendingScoresRef.current;
      setGamePlayers(prev => {
        const updated = prev.map((player, idx) => {
          const p = pending[idx];
          if (!p) return player;
          return { ...player, score: player.score + p.points };
        });

        // Save to DB
        if (session && currentGame?._id !== 'guest') {
          fetch(`/api/games/${currentGame._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              players: updated.map(p => ({
                name: p.name,
                scores: p.answers.map(a => a.points),
                roundScores: [p.score]
              })),
              quizConfig: { currentQuestionIndex }
            })
          }).catch(e => console.error('Failed to save:', e));
        }

        return updated;
      });
      pendingScoresRef.current = null;
    }
    setScreen('scoreboard');
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx >= questions.length) {
      handleGameEnd();
      return;
    }

    setCurrentQuestionIndex(nextIdx);
    setPlayerAnswers({});
    playerAnswersRef.current = {};
    setRevealed(false);
    setHostAnswered(false);
    setMultiDeviceAnswerCount(0);
    setScreen('question');
    timerStartRef.current = Date.now();
    timer.start();

    // For multi-device: notify players of next question
    if (isMultiDevice && isHost && roomCode) {
      fetch(`/api/quiz/rooms/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'question',
          currentQuestionIndex: nextIdx,
          questionStartedAt: new Date().toISOString()
        })
      }).catch(e => console.error('Failed to update room:', e));
    }
  };

  const handleGameEnd = async () => {
    // Apply any pending score updates (same-device mode)
    let finalPlayers = gamePlayers;
    if (!isMultiDevice && pendingScoresRef.current) {
      const pending = pendingScoresRef.current;
      finalPlayers = gamePlayers.map((player, idx) => {
        const p = pending[idx];
        return p ? { ...player, score: player.score + p.points } : player;
      });
      pendingScoresRef.current = null;
      setGamePlayers(finalPlayers);
    }

    // Save game completion to DB
    try {
      if (session && currentGame?._id && currentGame._id !== 'guest') {
        fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            quizConfig: {
              playerStats: finalPlayers.map(p => ({
                name: p.name,
                totalScore: p.score,
                correctCount: p.answers.filter(a => a.correct).length,
                avgResponseTime: p.answers.length > 0
                  ? p.answers.reduce((sum, a) => sum + (a.timeMs || 0), 0) / p.answers.length
                  : 0,
                bestStreak: Math.max(...p.answers.reduce((streaks, a, i) => {
                  if (a.correct) {
                    streaks.push((streaks.length > 0 ? streaks[streaks.length - 1] : 0) + 1);
                  } else {
                    streaks.push(0);
                  }
                  return streaks;
                }, [0]), 0),
                pointsPerQuestion: p.answers.map(a => a.points)
              }))
            }
          })
        }).catch(e => console.error('Failed to save final:', e));

        fetch('/api/quiz/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: currentGame._id,
            players: finalPlayers,
            categories: selectedCategories.map(cat => {
              if (cat.startsWith('custom:')) return cat.replace('custom:', '');
              return CATEGORIES.find(c => c.id === cat)?.name || cat;
            })
          })
        }).catch(e => console.error('Failed to save stats:', e));
      }
    } catch (e) {
      console.error('Failed to save game data:', e);
    }

    // Notify players of game end
    if (isMultiDevice && isHost && roomCode) {
      fetch(`/api/quiz/rooms/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' })
      }).catch(e => console.error('Failed to update room:', e));
    }

    setScreen('podium');
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setPlayerAnswers({});
    playerAnswersRef.current = {};
    setRevealed(false);
    setGamePlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0, answers: [] })));
    setScreen('setup');
  };

  const handleNewRound = () => {
    setCurrentQuestionIndex(0);
    setPlayerAnswers({});
    playerAnswersRef.current = {};
    pendingScoresRef.current = null;
    setRevealed(false);
    setHostAnswered(false);
    setMultiDeviceAnswerCount(0);
    // Keep gamePlayers with their scores
    setScreen('round-setup');
  };

  const handleStartNewRound = async () => {
    setScreen('waiting');
    try {
      const qs = await generateQuestions();
      setQuestions(qs);
      setCurrentQuestionIndex(0);
      setPlayerAnswers({});
      playerAnswersRef.current = {};
      pendingScoresRef.current = null;

      // Reset per-round data but keep scores
      setGamePlayers(prev => prev.map(p => ({
        ...p,
        streak: 0,
        answers: []
      })));

      if (isMultiDevice && isHost && roomCode) {
        const categoriesToSave = selectedCategories.map(cat => {
          if (cat.startsWith('custom:')) return cat.replace('custom:', '');
          return CATEGORIES.find(c => c.id === cat)?.name || cat;
        });

        await fetch(`/api/quiz/rooms/${roomCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: qs,
            settings: {
              categories: categoriesToSave,
              difficulty,
              questionCount,
              timePerQuestion
            },
            status: 'question',
            currentQuestionIndex: 0,
            questionStartedAt: new Date().toISOString(),
            resetPlayerAnswers: true
          })
        });
      }

      setRevealed(false);
      setHostAnswered(false);
      setMultiDeviceAnswerCount(0);
      timerStartRef.current = Date.now();
      timer.start();
      setScreen('question');
    } catch (error) {
      console.error('Failed to start new round:', error);
      showNotification('Failed to generate questions. Please try again.');
      setScreen('round-setup');
    }
  };

  const handleEndGame = () => {
    router.push('/');
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Delete this game?')) return;
    try {
      await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      loadGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const handleContinueGame = (game) => {
    setCurrentGame(game);
    const config = game.quizConfig || {};
    if (config.questions?.length > 0) {
      setQuestions(config.questions);
      setCurrentQuestionIndex(config.currentQuestionIndex || 0);
      setTimePerQuestion(config.timePerQuestion || 20);
      setGamePlayers(game.players?.map((p, i) => ({
        id: `local-${i}`,
        name: p.name,
        avatar: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        score: (p.scores || []).reduce((s, v) => s + v, 0),
        streak: 0,
        answers: []
      })) || []);
      setPlayerAnswers({});
      setRevealed(false);
      setScreen('question');
      timerStartRef.current = Date.now();
      timer.start();
    }
  };

  const handleToggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleAddCustomCategory = (catString) => {
    const catId = `custom:${catString}`;
    setSelectedCategories(prev => [...prev, catId]);
  };

  const handleDeleteCustomCategory = async (cat) => {
    if (!session) return;
    const updated = customCategories.filter(c => c !== cat);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuizCategories: updated })
      });
      setCustomCategories(updated);
      setSelectedCategories(prev => prev.filter(c => c !== `custom:${cat}`));
    } catch (e) {
      console.error('Failed to delete custom category:', e);
    }
  };

  // ─── Multi-device handlers ───

  const handleHostStartGame = () => {
    // This is called when host starts the game from lobby
    const gp = gamePlayers.map(p => ({ ...p, score: 0, streak: 0, answers: [] }));
    setGamePlayers(gp);
    setCurrentQuestionIndex(0);
    setPlayerAnswers({});
    setRevealed(false);
    setHostAnswered(false);
    setMultiDeviceAnswerCount(0);
    setScreen('question');
    timerStartRef.current = Date.now();
    timer.start();

    // Notify players via room update
    if (roomCode) {
      fetch(`/api/quiz/rooms/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'question',
          currentQuestionIndex: 0,
          questionStartedAt: new Date().toISOString()
        })
      }).catch(e => console.error('Failed to update room:', e));
    }
  };

  const handleJoinRoom = async (code, playerName, avatar, avatarColor) => {
    try {
      const res = await fetch(`/api/quiz/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, avatar, avatarColor })
      });
      if (!res.ok) throw new Error('Failed to join');
      const data = await res.json();
      setRoomCode(code);
      setPlayerId(data.playerId);
      setIsHost(false);
      setScreen('player-lobby');
    } catch (error) {
      showNotification('Failed to join room. Check the code and try again.');
    }
  };

  // ─── Notifications ───

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Render ───

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = Object.keys(playerAnswers).length >= gamePlayers.length && gamePlayers.length > 0;

  return (
    <>
      <Head>
        <title>Quiz Game - Gamepad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        {screen !== 'question' && screen !== 'question-result' && screen !== 'scoreboard' && screen !== 'podium' && (
          <ProfessionalHeader />
        )}

        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold">
              {notification}
            </div>
          </div>
        )}

        <div className={`${screen === 'question' || screen === 'question-result' || screen === 'scoreboard' || screen === 'podium' ? 'pt-4' : 'pt-2'} px-4 pb-8`}>

          {/* ── HOME ── */}
          {screen === 'home' && (
            <QuizHome
              games={games}
              onNewGame={() => setScreen('setup')}
              onContinueGame={handleContinueGame}
              onDeleteGame={handleDeleteGame}
              onJoinGame={() => setScreen('join')}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onViewHistory={() => setScreen('history')}
            />
          )}

          {/* ── SETUP ── */}
          {screen === 'setup' && (
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setScreen('home')}
                className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
              >
                ← Back
              </button>

              <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-3xl p-5 shadow-xl border border-purple-100">
                <h2 className="text-2xl font-bold text-center mb-5 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Set Up Your Quiz
                </h2>

                {/* Game mode selector */}
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setGameMode(GAME_MODES.SAME_DEVICE)}
                    className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all text-center
                      ${gameMode === GAME_MODES.SAME_DEVICE
                        ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-200'
                      }`}
                  >
                    <span className="block text-xl mb-1">📱</span>
                    Same Device
                  </button>
                  <button
                    onClick={() => setGameMode(GAME_MODES.MULTI_DEVICE)}
                    className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all text-center
                      ${gameMode === GAME_MODES.MULTI_DEVICE
                        ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-200'
                      }`}
                  >
                    <span className="block text-xl mb-1">🌐</span>
                    Multi-Device
                  </button>
                </div>

                <div className="space-y-5">
                  <GameSettings
                    questionCount={questionCount}
                    onQuestionCountChange={setQuestionCount}
                    difficulty={difficulty}
                    onDifficultyChange={setDifficulty}
                    timePerQuestion={timePerQuestion}
                    onTimeChange={setTimePerQuestion}
                  />

                  <CategoryPicker
                    selectedCategories={selectedCategories}
                    onToggleCategory={handleToggleCategory}
                    customCategories={customCategories}
                    onAddCustomCategory={handleAddCustomCategory}
                    onDeleteCustomCategory={handleDeleteCustomCategory}
                  />

                  {gameMode === GAME_MODES.SAME_DEVICE && (
                    <PlayerSetup
                      players={players}
                      onPlayersChange={setPlayers}
                    />
                  )}
                </div>

                {/* Start button */}
                <button
                  onClick={gameMode === GAME_MODES.SAME_DEVICE ? handleStartGame : handleStartMultiDeviceGame}
                  disabled={selectedCategories.length === 0}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white
                             font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {gameMode === GAME_MODES.SAME_DEVICE ? 'Start Quiz!' : 'Create Room'}
                </button>
              </div>
            </div>
          )}

          {/* ── ROUND SETUP (new round with same players, keep scores) ── */}
          {screen === 'round-setup' && (
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setScreen('podium')}
                className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
              >
                ← Back to Results
              </button>

              <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-3xl p-5 shadow-xl border border-purple-100">
                <h2 className="text-2xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  New Round
                </h2>
                <p className="text-center text-slate-500 text-sm mb-5">
                  Same players, scores carry over
                </p>

                {/* Show current players and scores */}
                <div className="flex flex-wrap gap-2 justify-center mb-5">
                  {gamePlayers.map(p => (
                    <div key={p.id || p.name} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm text-sm">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ backgroundColor: p.avatarColor || '#6c5ce7' }}
                      >
                        {p.avatar || p.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-700">{p.name}</span>
                      <span className="font-bold text-purple-600">{p.score}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <GameSettings
                    questionCount={questionCount}
                    onQuestionCountChange={setQuestionCount}
                    difficulty={difficulty}
                    onDifficultyChange={setDifficulty}
                    timePerQuestion={timePerQuestion}
                    onTimeChange={setTimePerQuestion}
                  />

                  <CategoryPicker
                    selectedCategories={selectedCategories}
                    onToggleCategory={handleToggleCategory}
                    customCategories={customCategories}
                    onAddCustomCategory={handleAddCustomCategory}
                    onDeleteCustomCategory={handleDeleteCustomCategory}
                  />
                </div>

                <button
                  onClick={handleStartNewRound}
                  disabled={selectedCategories.length === 0}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white
                             font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  Start Round!
                </button>
              </div>
            </div>
          )}

          {/* ── WAITING ── */}
          {screen === 'waiting' && (
            <WaitingScreen />
          )}

          {/* ── QUESTION (same-device) ── */}
          {screen === 'question' && currentQuestion && gameMode === GAME_MODES.SAME_DEVICE && (
            <div className="max-w-5xl mx-auto">
              {/* Compact scoreboard */}
              <LiveScoreboard
                players={gamePlayers}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                compact={true}
              />

              {/* Question display */}
              <div className="mb-4">
                <QuestionDisplay
                  question={currentQuestion}
                  questionIndex={currentQuestionIndex}
                  totalQuestions={questions.length}
                  timeLeft={timer.timeLeft}
                  totalTime={timePerQuestion}
                  revealed={revealed}
                  disabled={revealed}
                  category={currentQuestion.category}
                  selectedAnswer={null}
                  correctAnswer={revealed ? currentQuestion.correctAnswer : null}
                  onSelectAnswer={() => {}}
                />
              </div>

              {/* Player answer zones */}
              <SameDeviceAnswerZones
                players={gamePlayers}
                options={currentQuestion.options}
                playerAnswers={Object.fromEntries(
                  Object.entries(playerAnswers).map(([k, v]) => [k, v.answer])
                )}
                onPlayerAnswer={handlePlayerAnswer}
                revealed={revealed}
                correctAnswer={currentQuestion.correctAnswer}
                disabled={revealed}
              />

              {/* Reveal / Next buttons */}
              <div className="mt-4 text-center">
                {!revealed && allAnswered && (
                  <button
                    onClick={handleReveal}
                    className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-xl shadow-lg
                               hover:bg-yellow-600 transition-all animate-pulse"
                  >
                    Reveal Answer!
                  </button>
                )}
                {revealed && (
                  <button
                    onClick={() => setScreen('question-result')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold
                               rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── QUESTION (multi-device — host and joined players) ── */}
          {screen === 'question' && currentQuestion && gameMode === GAME_MODES.MULTI_DEVICE && (
            <div className="max-w-3xl mx-auto">
              {isHost && (
                <LiveScoreboard
                  players={gamePlayers}
                  questionIndex={currentQuestionIndex}
                  totalQuestions={questions.length}
                  compact={true}
                />
              )}
              <QuestionDisplay
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                timeLeft={timer.timeLeft}
                totalTime={timePerQuestion}
                revealed={revealed}
                disabled={hostAnswered || revealed}
                category={currentQuestion.category}
                selectedAnswer={hostAnswered ? playerAnswers['self']?.answer : null}
                correctAnswer={revealed ? currentQuestion.correctAnswer : null}
                onSelectAnswer={(answerIdx) => {
                  if (hostAnswered || revealed || !playerId || !roomCode) return;
                  setHostAnswered(true);
                  const timeMs = Date.now() - (timerStartRef.current || Date.now());
                  setPlayerAnswers(prev => ({ ...prev, self: { answer: answerIdx, timeMs } }));
                  // Submit answer to server
                  fetch(`/api/quiz/rooms/${roomCode}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId, selectedOption: answerIdx, timeMs })
                  }).catch(e => console.error('Failed to submit answer:', e));
                }}
              />
              {hostAnswered && !revealed && (
                <div className="mt-3 text-center">
                  <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Answer submitted! Waiting for others...
                  </div>
                </div>
              )}
              {isHost && (
                <div className="mt-3 text-center text-sm text-slate-500">
                  {multiDeviceAnswerCount} / {gamePlayers.length} players answered
                </div>
              )}
              {revealed && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      // Host: notify all players to show scores
                      if (isHost && roomCode) {
                        fetch(`/api/quiz/rooms/${roomCode}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'scores' })
                        }).catch(e => console.error('Failed to update room:', e));
                      }
                      setScreen('question-result');
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold
                               rounded-xl shadow-lg"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── QUESTION RESULT ── */}
          {screen === 'question-result' && currentQuestion && (
            <QuestionResult
              players={gamePlayers}
              questionIndex={currentQuestionIndex}
              question={currentQuestion}
              isLastQuestion={currentQuestionIndex + 1 >= questions.length}
              onContinue={currentQuestionIndex + 1 >= questions.length
                ? handleGameEnd
                : handleShowScoreboard
              }
            />
          )}

          {/* ── SCOREBOARD ── */}
          {screen === 'scoreboard' && (
            <>
              <LiveScoreboard
                players={gamePlayers}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onContinue={(!isMultiDevice || isHost)
                  ? (currentQuestionIndex + 1 >= questions.length ? handleGameEnd : handleNextQuestion)
                  : null
                }
              />
              {isMultiDevice && !isHost && (
                <div className="mt-4 text-center text-slate-500 text-sm font-medium animate-pulse">
                  Waiting for host to continue...
                </div>
              )}
            </>
          )}

          {/* ── FINAL PODIUM ── */}
          {screen === 'podium' && (
            <FinalPodium
              players={gamePlayers}
              onNewRound={isHost || !isMultiDevice ? handleNewRound : null}
              onPlayAgain={handlePlayAgain}
              onEndGame={handleEndGame}
              onViewLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* ── HOST LOBBY ── */}
          {screen === 'host-lobby' && roomCode && (
            <HostLobby
              roomCode={roomCode}
              players={gamePlayers}
              hostPlayerId={playerId}
              onStart={handleHostStartGame}
              onUpdatePlayers={setGamePlayers}
              onBack={() => setScreen('setup')}
            />
          )}

          {/* ── JOIN ── */}
          {screen === 'join' && (
            <JoinScreen
              onJoin={handleJoinRoom}
              onBack={() => setScreen('home')}
            />
          )}

          {/* ── PLAYER LOBBY ── */}
          {screen === 'player-lobby' && roomCode && (
            <PlayerLobby
              roomCode={roomCode}
              playerId={playerId}
              onGameStart={(roomStateOrQs, gp) => {
                if (gp) setGamePlayers(gp.map(p => ({ ...p, answers: p.answers || [], streak: p.streak ?? 0 })));
                setGameMode(GAME_MODES.MULTI_DEVICE);
                setHostAnswered(false);
                setPlayerAnswers({});
                setRevealed(false);

                // roomStateOrQs is the SSE room state — extract currentQuestion
                if (roomStateOrQs && roomStateOrQs.currentQuestion) {
                  const idx = roomStateOrQs.currentQuestionIndex || 0;
                  setQuestions(prev => {
                    const updated = [...prev];
                    updated[idx] = { ...roomStateOrQs.currentQuestion, correctAnswer: null };
                    return updated;
                  });
                  setCurrentQuestionIndex(idx);
                  timerStartRef.current = new Date(roomStateOrQs.questionStartedAt || Date.now()).getTime();
                } else {
                  setCurrentQuestionIndex(0);
                  timerStartRef.current = Date.now();
                }

                setScreen('question');
                timer.start();
              }}
            />
          )}

          {/* ── LEADERBOARD ── */}
          {screen === 'leaderboard' && (
            <LeaderboardView onBack={() => setScreen(currentGame ? 'podium' : 'home')} />
          )}

          {/* ── HISTORY ── */}
          {screen === 'history' && (
            <GameHistory
              games={games}
              onBack={() => setScreen('home')}
              onContinueGame={handleContinueGame}
              onDeleteGame={handleDeleteGame}
            />
          )}
        </div>
      </main>
    </>
  );
}
