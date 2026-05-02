import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Travel Bingo allows guest play, so we can't gate on NextAuth session.
// Instead we verify the gameId + carId belong to an existing game.
async function verifyGameCar(gameId, carId) {
  if (!gameId || !carId) return null;
  await dbConnect();
  const game = await Game.findById(gameId);
  if (!game || game.gameType !== 'travel-bingo') return null;
  const car = game.travelBingoConfig?.cars?.find(c => c.carId === carId);
  return car ? { game, car } : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, carId } = req.query;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary not configured' });
  }

  let folderName;

  if (gameId && carId) {
    const ok = await verifyGameCar(gameId, carId);
    if (!ok) return res.status(403).json({ error: 'Invalid game or car' });
    const safeCar = (ok.car.name || carId).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
    folderName = `Gamepad/travel-bingo/${gameId}/${safeCar}`;
  } else {
    return res.status(400).json({ error: 'gameId and carId required' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `tile-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const paramsToSign = {
    folder: folderName,
    format: 'jpg',
    public_id: publicId,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return res.status(200).json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: folderName,
    publicId,
  });
}
