import dbConnect from '@/lib/mongodb';
import QuizRoom from '@/models/QuizRoom';

export const config = {
  api: {
    responseLimit: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomCode } = req.query;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  await dbConnect();

  let lastVersion = 0;
  let closed = false;

  // Send initial state
  const room = await QuizRoom.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) {
    res.write(`data: ${JSON.stringify({ error: 'Room not found' })}\n\n`);
    res.end();
    return;
  }

  lastVersion = room.stateVersion || 0;

  const sendState = (room) => {
    if (closed) return;
    const data = {
      status: room.status,
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
      totalQuestions: room.questions?.length || 0,
      answeredCount: room.currentQuestionIndex >= 0
        ? room.players.filter(p => p.answers.some(a => a.questionIndex === room.currentQuestionIndex)).length
        : 0
    };

    // Include question during question phase (without answer)
    if (room.status === 'question' && room.currentQuestionIndex >= 0) {
      const q = room.questions[room.currentQuestionIndex];
      data.currentQuestion = {
        question: q.question,
        options: q.options,
        category: q.category
      };
    }

    // Include answer during reveal
    if (room.status === 'reveal' && room.currentQuestionIndex >= 0) {
      const q = room.questions[room.currentQuestionIndex];
      data.revealedAnswer = {
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      };
    }

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendState(room);

  // Poll for changes (simple approach without change streams)
  const pollInterval = setInterval(async () => {
    if (closed) return;
    try {
      const updated = await QuizRoom.findOne({ roomCode: roomCode.toUpperCase() });
      if (!updated) {
        res.write(`data: ${JSON.stringify({ error: 'Room closed' })}\n\n`);
        clearInterval(pollInterval);
        res.end();
        return;
      }

      if (updated.stateVersion > lastVersion) {
        lastVersion = updated.stateVersion;
        sendState(updated);
      }

      // Send heartbeat
      if (!closed) {
        res.write(`:heartbeat\n\n`);
      }
    } catch (e) {
      console.error('SSE poll error:', e);
    }
  }, 1000);

  req.on('close', () => {
    closed = true;
    clearInterval(pollInterval);
  });
}
