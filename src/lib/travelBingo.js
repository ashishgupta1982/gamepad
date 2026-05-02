import crypto from 'crypto';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateJoinCode() {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

export function generateId(prefix = '') {
  const id = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

export function findCar(game, carId) {
  return game?.travelBingoConfig?.cars?.find(c => c.carId === carId) || null;
}

export function isHost(game, userId) {
  return Boolean(userId) && game?.travelBingoConfig?.hostUserId === userId;
}

export function carCompletion(car) {
  if (!car?.card?.length) return { found: 0, total: 0 };
  const total = car.card.length;
  const found = car.card.filter(t => t.found).length;
  return { found, total };
}
