import dbConnect from '@/lib/mongodb';
import QuizRoom from '@/models/QuizRoom';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    const { settings, questions } = req.body;

    // Generate unique room code
    let roomCode;
    let attempts = 0;
    while (attempts < 10) {
      roomCode = generateRoomCode();
      const existing = await QuizRoom.findOne({ roomCode });
      if (!existing) break;
      attempts++;
    }

    const room = await QuizRoom.create({
      roomCode,
      hostUserId: session?.user?.id || null,
      hostSessionId: req.headers['x-session-id'] || `guest-${Date.now()}`,
      status: 'lobby',
      settings: settings || {},
      questions: questions || [],
      players: [],
      currentQuestionIndex: -1
    });

    return res.status(201).json({
      roomCode: room.roomCode,
      roomId: room._id
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
