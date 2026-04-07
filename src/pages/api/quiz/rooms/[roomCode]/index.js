import dbConnect from '@/lib/mongodb';
import QuizRoom from '@/models/QuizRoom';

export default async function handler(req, res) {
  await dbConnect();
  const { roomCode } = req.query;

  const room = await QuizRoom.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (req.method === 'GET') {
    // Don't send questions to players (they shouldn't see answers)
    const safeRoom = {
      roomCode: room.roomCode,
      status: room.status,
      settings: room.settings,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        avatarColor: p.avatarColor,
        score: p.score,
        streak: p.streak,
        connected: p.connected
      })),
      currentQuestionIndex: room.currentQuestionIndex,
      questionStartedAt: room.questionStartedAt,
      stateVersion: room.stateVersion,
      // Only send current question (without correctAnswer) during question phase
      currentQuestion: room.status === 'question' && room.currentQuestionIndex >= 0
        ? {
            question: room.questions[room.currentQuestionIndex]?.question,
            options: room.questions[room.currentQuestionIndex]?.options,
            category: room.questions[room.currentQuestionIndex]?.category
          }
        : null,
      // Send correct answer during reveal
      revealedAnswer: room.status === 'reveal' && room.currentQuestionIndex >= 0
        ? {
            correctAnswer: room.questions[room.currentQuestionIndex]?.correctAnswer,
            explanation: room.questions[room.currentQuestionIndex]?.explanation
          }
        : null,
      totalQuestions: room.questions?.length || 0
    };

    return res.status(200).json(safeRoom);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const allowedFields = ['status', 'currentQuestionIndex', 'questionStartedAt', 'players', 'questions', 'settings'];

    // Support updating a specific player's name
    if (updates.updatePlayer) {
      const { id, name } = updates.updatePlayer;
      const player = room.players.find(p => p.id === id);
      if (player && name) {
        player.name = name;
        room.markModified('players');
      }
    }

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        room[key] = updates[key];
      }
    });

    // Reset player answers for new round (keep scores)
    if (updates.resetPlayerAnswers) {
      room.players.forEach(p => {
        p.answers = [];
        p.streak = 0;
      });
      room.markModified('players');
    }

    room.stateVersion = (room.stateVersion || 0) + 1;
    await room.save();

    return res.status(200).json({ success: true, stateVersion: room.stateVersion });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
