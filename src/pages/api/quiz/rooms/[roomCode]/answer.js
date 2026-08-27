import dbConnect from '@/lib/mongodb';
import QuizRoom from '@/models/QuizRoom';
import { scoreAnswer } from '@/lib/quizScoring';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();
  const { roomCode } = req.query;
  const { playerId, selectedOption, timeMs } = req.body;

  const room = await QuizRoom.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'question') {
    return res.status(400).json({ error: 'Not in question phase' });
  }

  const playerIdx = room.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const player = room.players[playerIdx];
  const qIdx = room.currentQuestionIndex;

  // Check if already answered
  if (player.answers.some(a => a.questionIndex === qIdx)) {
    return res.status(400).json({ error: 'Already answered' });
  }

  const question = room.questions[qIdx];
  const correct = selectedOption === question.correctAnswer;
  const totalTimeMs = (room.settings.timePerQuestion || 20) * 1000;

  // One formula, shared with same-device play. This was an inline copy of the
  // client's, identical by coincidence rather than by construction.
  const { points } = scoreAnswer(correct, timeMs, totalTimeMs, player.streak);

  player.answers.push({
    questionIndex: qIdx,
    selectedOption,
    timeMs,
    correct,
    points
  });

  player.score += points;
  player.streak = correct ? player.streak + 1 : 0;
  player.lastSeen = new Date();

  room.stateVersion = (room.stateVersion || 0) + 1;
  await room.save();

  // Check if all players answered
  const allAnswered = room.players.every(p =>
    p.answers.some(a => a.questionIndex === qIdx)
  );

  return res.status(200).json({
    correct,
    points,
    allAnswered
  });
}
