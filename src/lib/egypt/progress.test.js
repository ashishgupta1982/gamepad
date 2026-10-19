import { describe, it, expect } from 'vitest';
import {
  newProgress, setPlayers, cleanNames, recordAnswer, recordQuest, toggleLooked,
  nextPlayer, stopStatus, stampCount, rankFor, nextStop, scores, newer, isProgress, POINTS,
} from './progress';
import { GEM } from '@/data/egypt/gem';
import { PHOTOS } from '@/data/egypt/photos';

const [obelisk, ramesses] = GEM.stops;

function answerAll(p, stop, by) {
  return stop.quiz.reduce((acc, q, i) => recordAnswer(acc, stop, i, q.answer, by), p);
}

describe('players', () => {
  it('cleans names: trims, drops blanks and repeats, caps the count', () => {
    expect(cleanNames([' Ash ', '', 'ash', 'Mia', 'A', 'B', 'C', 'D', 'E'])).toEqual(['Ash', 'Mia', 'A', 'B', 'C', 'D']);
  });

  it('keeps a player’s id when the list is edited, so their points stay', () => {
    const p = newProgress('gem', ['Ash', 'Mia']);
    const mia = p.players[1].id;
    const edited = setPlayers(p, ['Mia', 'Leo']);
    expect(edited.players[0].id).toBe(mia);
    expect(edited.players.map((x) => x.name)).toEqual(['Mia', 'Leo']);
  });
});

describe('quiz', () => {
  it('scores a right answer to the player who gave it', () => {
    let p = newProgress('gem', ['Ash', 'Mia']);
    const [ash, mia] = p.players;
    p = recordAnswer(p, obelisk, 0, obelisk.quiz[0].answer, ash.id);
    p = recordAnswer(p, obelisk, 1, (obelisk.quiz[1].answer + 1) % 4, mia.id);
    const { team, board } = scores(p, GEM);
    expect(team).toBe(POINTS.correct);
    expect(board.find((x) => x.id === ash.id).points).toBe(POINTS.correct);
    expect(board.find((x) => x.id === mia.id).points).toBe(0);
  });

  it('ignores a second answer to the same question', () => {
    let p = newProgress('gem', ['Ash']);
    const by = p.players[0].id;
    p = recordAnswer(p, obelisk, 0, 99, by);
    p = recordAnswer(p, obelisk, 0, obelisk.quiz[0].answer, by);
    expect(p.stops.obelisk.answers[0].correct).toBe(false);
  });

  it('passes the turn round the table across stops', () => {
    let p = newProgress('gem', ['Ash', 'Mia', 'Leo']);
    expect(nextPlayer(p).name).toBe('Ash');
    p = recordAnswer(p, obelisk, 0, 0, p.players[0].id);
    expect(nextPlayer(p).name).toBe('Mia');
    p = recordAnswer(p, ramesses, 0, 0, p.players[1].id);
    expect(nextPlayer(p).name).toBe('Leo');
  });
});

describe('stamps', () => {
  it('stamps a stop once every question is answered, right or wrong', () => {
    let p = newProgress('gem', ['Ash']);
    const by = p.players[0].id;
    obelisk.quiz.forEach((_, i) => { p = recordAnswer(p, obelisk, i, -1, by); });
    expect(stopStatus(p, obelisk).stamped).toBe(true);
    expect(stopStatus(p, obelisk).perfect).toBe(false);
    expect(stampCount(p, GEM)).toBe(1);
    expect(nextStop(p, GEM).id).toBe('ramesses');
  });

  it('does not need the photo quest for a stamp', () => {
    let p = newProgress('gem', ['Ash']);
    p = answerAll(p, obelisk, p.players[0].id);
    expect(stopStatus(p, obelisk)).toMatchObject({ stamped: true, quest: false, perfect: true });
  });

  it('climbs the ranks by stamps', () => {
    expect(rankFor(0).title).toBe('Tourist');
    expect(rankFor(1).title).toBe('Tomb Explorer');
    expect(rankFor(4).title).toBe('Scribe');
    expect(rankFor(9).title).toBe('Pharaoh');
  });
});

describe('quests and looking', () => {
  it('scores a found quest, and a parent override, to the finder', () => {
    let p = newProgress('gem', ['Ash', 'Mia']);
    const mia = p.players[1].id;
    p = recordQuest(p, 'obelisk', { by: mia, found: false, override: true });
    expect(p.stops.obelisk.quest.found).toBe(true);
    expect(scores(p, GEM).board[0]).toMatchObject({ id: mia, points: POINTS.quest });
  });

  it('a quest the guide did not accept scores nothing', () => {
    let p = newProgress('gem', ['Ash']);
    p = recordQuest(p, 'obelisk', { by: p.players[0].id, found: false });
    expect(scores(p, GEM).team).toBe(0);
  });

  it('counts looking closely to the team, and untoggles', () => {
    let p = newProgress('gem', ['Ash']);
    p = toggleLooked(p, 'obelisk', 0);
    p = toggleLooked(p, 'obelisk', 1);
    expect(scores(p, GEM).team).toBe(2 * POINTS.look);
    p = toggleLooked(p, 'obelisk', 0);
    expect(scores(p, GEM).team).toBe(POINTS.look);
  });
});

describe('saving', () => {
  it('keeps the newer of two saves', () => {
    const a = { ...newProgress('gem'), updatedAt: '2026-10-20T10:00:00.000Z' };
    const b = { ...newProgress('gem'), updatedAt: '2026-10-20T11:00:00.000Z' };
    expect(newer(a, b)).toBe(b);
    expect(newer(null, a)).toBe(a);
  });

  it('recognises its own shape and rejects others', () => {
    expect(isProgress(newProgress('gem', ['Ash']))).toBe(true);
    expect(isProgress({ v: 2 })).toBe(false);
    expect(isProgress(null)).toBe(false);
  });
});

// The content is data, so these guard it rather than the code.
describe('the GEM trip', () => {
  it('has a valid answer and an explanation for every question', () => {
    for (const stop of GEM.stops) {
      for (const q of stop.quiz) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.why.length).toBeGreaterThan(10);
      }
    }
  });

  it('names only photos that exist', () => {
    const used = GEM.stops.flatMap((s) => [...s.photos, ...s.quiz.map((q) => q.photo).filter(Boolean)]);
    used.push(GEM.cover);
    expect(used.filter((k) => !PHOTOS[k])).toEqual([]);
  });

  it('has unique stop ids and a stamp for each', () => {
    const ids = GEM.stops.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GEM.stops.every((s) => s.stamp && s.quest && s.quiz.length >= 3)).toBe(true);
  });
});
