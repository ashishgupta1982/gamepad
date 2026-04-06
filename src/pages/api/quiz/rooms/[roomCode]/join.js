import dbConnect from '@/lib/mongodb';
import QuizRoom from '@/models/QuizRoom';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();
  const { roomCode } = req.query;
  const { name, avatar, avatarColor } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const room = await QuizRoom.findOne({ roomCode: roomCode.toUpperCase() });
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'lobby') {
    return res.status(400).json({ error: 'Game already in progress' });
  }

  if (room.players.length >= 20) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  room.players.push({
    id: playerId,
    name: name.trim(),
    avatar: avatar || null,
    avatarColor: avatarColor || null,
    score: 0,
    streak: 0,
    answers: [],
    connected: true,
    lastSeen: new Date()
  });

  room.stateVersion = (room.stateVersion || 0) + 1;
  await room.save();

  return res.status(200).json({
    playerId,
    playerCount: room.players.length
  });
}
