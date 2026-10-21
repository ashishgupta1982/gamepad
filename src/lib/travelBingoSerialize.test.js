// The game every player can read must never carry an account or guest id: a
// guest's id is their credential (REDESIGN-PLAN.md, Phase 1).
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ default: async () => {} }));

import Game from '@/models/Game';
import { serializeGame } from '@/pages/api/games/travel-bingo/[id]/index';

describe('serializeGame', () => {
  it('drops every id and names the host by car', () => {
    const game = new Game({
      userId: 'guest_host',
      gameType: 'travel-bingo',
      players: [],
      status: 'active',
      travelBingoConfig: {
        joinCode: 'ABC123',
        hostUserId: 'guest_host',
        phase: 'submission',
        cars: [
          { carId: 'car_a', name: 'A', userId: 'guest_host' },
          { carId: 'car_b', name: 'B', userId: 'guest_b' },
        ],
      },
    });
    const out = JSON.parse(JSON.stringify(serializeGame(game)));
    expect(JSON.stringify(out)).not.toContain('guest_');
    expect(out.travelBingoConfig.hostCarId).toBe('car_a');
    expect(out.travelBingoConfig.cars.map((c) => c.name)).toEqual(['A', 'B']);
  });
});
