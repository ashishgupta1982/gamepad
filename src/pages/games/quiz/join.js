import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '@/components/ProfessionalHeader';
import JoinScreen from '@/components/quiz/JoinScreen';
import PlayerLobby from '@/components/quiz/PlayerLobby';
import useQuizRoom from '@/hooks/useQuizRoom';
import useQuizTimer from '@/hooks/useQuizTimer';
import useQuizScoring from '@/hooks/useQuizScoring';
import AnswerGrid from '@/components/quiz/AnswerGrid';
import CountdownTimer from '@/components/quiz/CountdownTimer';
import QuestionResult from '@/components/quiz/QuestionResult';
import LiveScoreboard from '@/components/quiz/LiveScoreboard';
import FinalPodium from '@/components/quiz/FinalPodium';

export default function JoinPage() {
  const router = useRouter();
  const [screen, setScreen] = useState('join');
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const { roomState, connected } = useQuizRoom(roomCode, !!roomCode);
  const { calculatePoints } = useQuizScoring();

  useEffect(() => {
    if (!roomState) return;

    if (roomState.status === 'question' && screen !== 'player-question') {
      setScreen('player-question');
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else if (roomState.status === 'reveal' && screen === 'player-question') {
      setScreen('player-result');
    } else if (roomState.status === 'scores') {
      setScreen('player-scoreboard');
    } else if (roomState.status === 'finished') {
      setScreen('player-podium');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.status, roomState?.currentQuestionIndex]);

  const handleJoin = async (code, name, avatar, avatarColor) => {
    const res = await fetch(`/api/quiz/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, avatarColor })
    });
    if (!res.ok) throw new Error('Failed to join');
    const data = await res.json();
    setRoomCode(code);
    setPlayerId(data.playerId);
    setScreen('lobby');
  };

  const handleSubmitAnswer = async (answerIdx) => {
    if (answerSubmitted || !roomCode || !playerId) return;
    setSelectedAnswer(answerIdx);
    setAnswerSubmitted(true);

    const timeMs = roomState?.questionStartedAt
      ? Date.now() - new Date(roomState.questionStartedAt).getTime()
      : 5000;

    try {
      await fetch(`/api/quiz/rooms/${roomCode}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, selectedOption: answerIdx, timeMs })
      });
    } catch (e) {
      console.error('Failed to submit answer:', e);
    }
  };

  const question = roomState?.currentQuestion;
  const totalTime = roomState?.settings?.timePerQuestion || 20;

  return (
    <>
      <Head>
        <title>Join Quiz - Gamepad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        {screen === 'join' && <ProfessionalHeader />}
        <div className="pt-4 px-4 pb-8">

          {screen === 'join' && (
            <JoinScreen onJoin={handleJoin} onBack={() => router.push('/games/quiz')} />
          )}

          {screen === 'lobby' && roomCode && (
            <PlayerLobby
              roomCode={roomCode}
              playerId={playerId}
              onGameStart={() => {}}
            />
          )}

          {screen === 'player-question' && question && (
            <div className="max-w-lg mx-auto">
              {/* Compact status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-700 bg-white/80 px-3 py-1 rounded-full">
                  Q{(roomState?.currentQuestionIndex || 0) + 1} / {roomState?.totalQuestions}
                </span>
                <span className="text-sm text-slate-500 bg-white/80 px-3 py-1 rounded-full">
                  {question.category}
                </span>
              </div>

              {/* Question */}
              <div className="bg-white rounded-2xl p-5 shadow-lg mb-4">
                <h2 className="text-xl font-bold text-slate-800 text-center">{question.question}</h2>
              </div>

              {/* Answers */}
              <AnswerGrid
                options={question.options}
                onSelect={handleSubmitAnswer}
                selectedAnswer={selectedAnswer}
                correctAnswer={roomState?.revealedAnswer?.correctAnswer}
                revealed={screen === 'player-result'}
                disabled={answerSubmitted}
              />

              {answerSubmitted && screen === 'player-question' && (
                <div className="text-center mt-4 text-slate-500 text-sm font-medium">
                  Answer locked in! Waiting for others...
                </div>
              )}
            </div>
          )}

          {screen === 'player-result' && roomState?.revealedAnswer && (
            <div className="max-w-lg mx-auto text-center">
              <div className={`rounded-2xl p-6 mb-4 ${
                selectedAnswer === roomState.revealedAnswer.correctAnswer
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="text-4xl mb-2">
                  {selectedAnswer === roomState.revealedAnswer.correctAnswer ? '🎉' : '😔'}
                </div>
                <div className="text-xl font-bold">
                  {selectedAnswer === roomState.revealedAnswer.correctAnswer ? 'Correct!' : 'Wrong!'}
                </div>
              </div>
              {roomState.revealedAnswer.explanation && (
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                  <span className="font-semibold">Did you know?</span> {roomState.revealedAnswer.explanation}
                </div>
              )}
              <div className="mt-4 text-slate-400 text-sm">Waiting for host...</div>
            </div>
          )}

          {screen === 'player-scoreboard' && roomState?.players && (
            <LiveScoreboard
              players={roomState.players}
              questionIndex={roomState.currentQuestionIndex || 0}
              totalQuestions={roomState.totalQuestions || 0}
            />
          )}

          {screen === 'player-podium' && roomState?.players && (
            <FinalPodium
              players={roomState.players}
              onPlayAgain={() => router.push('/games/quiz')}
              onEndGame={() => router.push('/')}
            />
          )}
        </div>
      </main>
    </>
  );
}
