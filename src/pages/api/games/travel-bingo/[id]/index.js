import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  await dbConnect();

  let game;
  try {
    game = await Game.findById(id);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid game id' });
  }

  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json({ game: serializeGame(game) });
}

// What every player in a game may see. No account or guest ids.
//
// This used to return `travelBingoConfig` whole, `hostUserId` and every car's
// `userId` included, from a GET anyone can call. A guest's id IS their
// credential (`resolvePlayer` accepts it from the request body when there is no
// session), so anyone in a game could read another guest car's id and mark its
// tiles, or generate as the host. The host is now named by car, which a client
// can compare with the car it holds; the server still checks the real id on
// every write.
export function serializeGame(game) {
  // A plain copy: travelBingoConfig is a nested path, not a subdocument, so it
  // has no toObject of its own, and spreading the live getter is unreliable.
  const cfg = (typeof game.toObject === 'function' ? game.toObject() : game).travelBingoConfig || {};
  const hostCar = (cfg.cars || []).find((c) => c.userId && c.userId === cfg.hostUserId);
  const { hostUserId, ...rest } = cfg;
  return {
    _id: game._id.toString(),
    gameType: game.gameType,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    travelBingoConfig: {
      ...rest,
      hostCarId: hostCar?.carId || null,
      cars: (cfg.cars || []).map(({ userId, ...car }) => car),
    },
  };
}
