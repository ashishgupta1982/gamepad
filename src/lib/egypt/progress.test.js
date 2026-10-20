import { describe, it, expect } from 'vitest';
import {
  newFamily, newerFamily, isFamily, playerId, cleanNames, newProgress, withPlayers,
  recordAnswer, recordQuest, toggleLooked, stopStatus, stampCount, familyStamped, familyStampCount,
  rankFor, nextStop, questFinders, scores, isProgress, upgrade, normalise, mergeProgress, sameProgress, POINTS, EPOCH,
} from './progress';
import { GEM } from '@/data/egypt/gem';
import { PHOTOS } from '@/data/egypt/photos';

const [obelisk, ramesses] = GEM.stops;
const family = newFamily(['Ash', 'Mia', 'Leo']);
const [ash, mia, leo] = family.players.map((p) => p.id);
const start = () => newProgress('gem', family.players);

function answerAll(p, stop, pid, right = true) {
  return stop.quiz.reduce((acc, q, i) => recordAnswer(acc, stop, i, right ? q.answer : -1, pid), p);
}

describe('the family', () => {
  it('cleans names: trims, drops blanks and repeats, caps the count', () => {
    expect(cleanNames([' Ash ', '', 'ash', 'Mia', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])).toEqual(['Ash', 'Mia', 'A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('makes the same id from the same name on any phone', () => {
    expect(newFamily(['Mia']).players[0].id).toBe(newFamily([' mia ']).players[0].id);
    expect(playerId('A.J.')).not.toMatch(/[.$]/);
  });

  it('keeps the newer list, and any typed list beats one worked out from old saves', () => {
    const old = newFamily(['Ash'], EPOCH);
    expect(newerFamily(old, family)).toBe(family);
    expect(newerFamily(null, family)).toBe(family);
    expect(isFamily(family)).toBe(true);
    expect(isFamily({ players: [] })).toBe(false);
  });
});

describe('everyone plays every stop', () => {
  it('scores each player their own answers, and lets two answer the same question', () => {
    let p = start();
    p = recordAnswer(p, obelisk, 0, obelisk.quiz[0].answer, ash);
    p = recordAnswer(p, obelisk, 0, obelisk.quiz[0].answer, mia);
    p = recordAnswer(p, obelisk, 1, -1, mia);
    const { team, board } = scores(p, GEM, family.players);
    expect(board.find((x) => x.id === ash).points).toBe(POINTS.correct);
    expect(board.find((x) => x.id === mia).points).toBe(POINTS.correct);
    expect(board.find((x) => x.id === leo).points).toBe(0);
    expect(team).toBe(2 * POINTS.correct);
  });

  it('ignores a second answer from the same player', () => {
    let p = start();
    p = recordAnswer(p, obelisk, 0, -1, ash);
    p = recordAnswer(p, obelisk, 0, obelisk.quiz[0].answer, ash);
    expect(p.play[ash].obelisk.answers[0].correct).toBe(false);
  });

  it('records nothing without a player', () => {
    const p = start();
    expect(recordAnswer(p, obelisk, 0, 0, null)).toBe(p);
  });

  it('stamps a stop for the player who answered every question, right or wrong', () => {
    let p = answerAll(start(), obelisk, ash, false);
    expect(stopStatus(p, obelisk, ash)).toMatchObject({ stamped: true, perfect: false });
    expect(stopStatus(p, obelisk, mia).stamped).toBe(false);
    expect(stampCount(p, GEM, ash)).toBe(1);
    expect(nextStop(p, GEM, ash).id).toBe('ramesses');
    expect(nextStop(p, GEM, mia).id).toBe('obelisk');
    p = answerAll(p, ramesses, mia);
    expect(scores(p, GEM, family.players).board.map((x) => [x.id, x.stamps])).toContainEqual([mia, 1]);
  });

  it('gives the family a stamp once every question there has been answered by somebody', () => {
    let p = start();
    obelisk.quiz.forEach((q, i) => { p = recordAnswer(p, obelisk, i, q.answer, i % 2 ? ash : mia); });
    expect(familyStamped(p, obelisk)).toBe(true);
    expect(stopStatus(p, obelisk, ash).stamped).toBe(false);
    expect(familyStampCount(p, GEM)).toBe(1);
  });

  it('climbs the ranks by stamps', () => {
    expect(rankFor(0).title).toBe('Tourist');
    expect(rankFor(4).title).toBe('Scribe');
    expect(rankFor(9).title).toBe('Pharaoh');
  });
});

describe('quests and looking', () => {
  it('scores a found quest to each finder', () => {
    let p = start();
    p = recordQuest(p, 'obelisk', mia, { found: true, says: 'Yes' });
    p = recordQuest(p, 'obelisk', ash, { found: true, says: 'Yes' });
    expect(questFinders(p, 'obelisk')).toEqual([mia, ash]);
    expect(scores(p, GEM, family.players).team).toBe(2 * POINTS.quest);
  });

  it('cannot be counted over the guide', () => {
    const p = recordQuest(start(), 'obelisk', mia, { found: false, override: true });
    expect(p.play[mia].obelisk.quest.found).toBe(false);
    expect(scores(p, GEM, family.players).team).toBe(0);
  });

  // Saved before 2026-10-20, when a parent could count a find the guide turned down.
  it('drops a quest a parent counted, and its points, wherever it was saved', () => {
    const counted = { found: true, override: true, says: 'Not quite', at: '2026-10-19T09:00:00.000Z' };
    const real = { found: true, says: 'Yes', at: '2026-10-19T10:00:00.000Z' };
    const saved = { ...start(), play: { [mia]: { obelisk: { answers: {}, quest: counted, looked: [] } }, [ash]: { obelisk: { answers: {}, quest: real, looked: [] } } } };
    const p = normalise(saved);
    expect(p.play[mia].obelisk.quest).toBe(null);
    expect(questFinders(p, 'obelisk')).toEqual([ash]);
    expect(scores(p, GEM, family.players).team).toBe(POINTS.quest);
    // A phone still holding the old copy cannot merge it back in.
    expect(mergeProgress(p, saved).play[mia].obelisk.quest).toBe(null);
    expect(mergeProgress(saved, p).play[mia].obelisk.quest).toBe(null);
  });

  it('a quest the guide did not accept scores nothing', () => {
    const p = recordQuest(start(), 'obelisk', ash, { found: false });
    expect(scores(p, GEM, family.players).team).toBe(0);
  });

  it('counts looking closely to the player, and untoggles', () => {
    let p = start();
    p = toggleLooked(p, 'obelisk', ash, 0);
    p = toggleLooked(p, 'obelisk', ash, 1);
    p = toggleLooked(p, 'obelisk', mia, 1);
    expect(scores(p, GEM, family.players).board[0]).toMatchObject({ id: ash, points: 2 * POINTS.look });
    p = toggleLooked(p, 'obelisk', ash, 0);
    expect(scores(p, GEM, family.players).team).toBe(2 * POINTS.look);
  });
});

// Saved on 2026-10-19, before everyone played for themselves.
const LEGACY = {
  v: 1,
  trip: 'gem',
  players: [{ id: 'p_a', name: 'Ash' }, { id: 'p_m', name: 'Mia' }],
  stops: {
    obelisk: {
      answers: {
        0: { by: 'p_a', choice: obelisk.quiz[0].answer, correct: true },
        1: { by: 'p_m', choice: obelisk.quiz[1].answer, correct: true },
        2: { by: 'p_m', choice: -1, correct: false },
        3: { by: 'p_gone', choice: obelisk.quiz[3].answer, correct: true },
      },
      quest: { by: 'p_m', found: true, override: false, says: 'That is it', at: '2026-10-19T09:00:00.000Z' },
      looked: [0, 2],
    },
  },
  asked: 3,
  startedAt: '2026-10-19T08:00:00.000Z',
  updatedAt: '2026-10-19T12:00:00.000Z',
};

describe('version 1 saves', () => {
  it('moves each answer and quest to whoever gave it', () => {
    const p = upgrade(LEGACY);
    expect(isProgress(p)).toBe(true);
    expect(p.players.map((x) => x.id)).toEqual([playerId('Ash'), playerId('Mia')]);
    expect(Object.keys(p.play[playerId('Ash')].obelisk.answers)).toEqual(['0']);
    expect(Object.keys(p.play[playerId('Mia')].obelisk.answers)).toEqual(['1', '2']);
    expect(p.play[playerId('Mia')].obelisk.quest.found).toBe(true);
    expect(p.shared.obelisk.looked).toEqual([0, 2]);
    expect(p.asked).toBe(3);
  });

  it('keeps everyone’s points, the family total and the family’s stamp', () => {
    const p = upgrade(LEGACY);
    const players = newFamily(['Ash', 'Mia', 'Leo']).players;
    const { team, board } = scores(p, GEM, players);
    expect(board.find((x) => x.name === 'Ash').points).toBe(POINTS.correct);
    expect(board.find((x) => x.name === 'Mia').points).toBe(POINTS.correct + POINTS.quest);
    // Three right answers, one quest and two shared ticks, the departed player's included.
    expect(team).toBe(3 * POINTS.correct + POINTS.quest + 2 * POINTS.look);
    expect(familyStamped(p, obelisk)).toBe(true);
  });

  it('leaves every question open for someone who had not answered it', () => {
    let p = upgrade(LEGACY);
    p = answerAll(p, obelisk, playerId('Leo'));
    expect(stopStatus(p, obelisk, playerId('Leo'))).toMatchObject({ stamped: true, perfect: true });
    p = recordAnswer(p, obelisk, 0, -1, playerId('Mia'));
    expect(p.play[playerId('Mia')].obelisk.answers[0].correct).toBe(false);
  });

  it('upgrades a version 1 copy when it is merged', () => {
    const merged = mergeProgress(answerAll(start(), ramesses, leo), LEGACY);
    expect(merged.play[playerId('Mia')].obelisk.quest.found).toBe(true);
    expect(stopStatus(merged, ramesses, leo).stamped).toBe(true);
  });
});

describe('several phones on one account', () => {
  it('adds together what each phone did', () => {
    const base = start();
    const phoneA = answerAll(base, obelisk, ash);
    const phoneB = recordQuest(answerAll(base, ramesses, mia), 'ramesses', mia, { found: true });
    const merged = mergeProgress(phoneA, phoneB);
    expect(stopStatus(merged, obelisk, ash).stamped).toBe(true);
    expect(stopStatus(merged, ramesses, mia)).toMatchObject({ stamped: true, quest: true });
    expect(sameProgress(merged, mergeProgress(phoneB, phoneA))).toBe(true);
  });

  it('is safe to repeat', () => {
    const p = answerAll(start(), obelisk, ash);
    const once = mergeProgress(p, p);
    expect(sameProgress(once, p)).toBe(true);
    expect(sameProgress(mergeProgress(once, p), once)).toBe(true);
  });

  it('keeps the first answer where one player answered differently on two phones', () => {
    const first = recordAnswer(start(), obelisk, 0, -1, ash);
    const second = recordAnswer(start(), obelisk, 0, obelisk.quiz[0].answer, ash);
    expect(mergeProgress(first, second).play[ash].obelisk.answers[0].correct).toBe(false);
  });

  it('keeps a found quest over one the guide turned down', () => {
    const found = recordQuest(start(), 'obelisk', ash, { found: true });
    const notFound = recordQuest(start(), 'obelisk', ash, { found: false });
    expect(mergeProgress(notFound, found).play[ash].obelisk.quest.found).toBe(true);
  });

  it('lets an untick on one phone win over the older tick', async () => {
    const ticked = toggleLooked(start(), 'obelisk', ash, 0);
    await new Promise((r) => setTimeout(r, 5));
    const unticked = toggleLooked(ticked, 'obelisk', ash, 0);
    expect(mergeProgress(ticked, unticked).play[ash].obelisk.looked).toEqual([]);
    expect(mergeProgress(unticked, ticked).play[ash].obelisk.looked).toEqual([]);
  });

  it('notices when one copy has something the other lacks', () => {
    const p = start();
    expect(sameProgress(p, { ...p, updatedAt: EPOCH })).toBe(true);
    expect(sameProgress(p, recordAnswer(p, obelisk, 0, 0, ash))).toBe(false);
  });

  it('ignores a copy of another trip and anything that is not progress', () => {
    const p = answerAll(start(), obelisk, ash);
    expect(sameProgress(mergeProgress(p, newProgress('giza')), p)).toBe(true);
    expect(sameProgress(mergeProgress(p, { junk: true }), p)).toBe(true);
    expect(mergeProgress(null, null)).toBe(null);
  });

  it('tidies a damaged record instead of failing on it', () => {
    const p = { ...start(), play: { [ash]: { obelisk: null, ramesses: { answers: { 0: 'x', 1: { choice: 1, correct: true } } } } } };
    const clean = mergeProgress(p, null);
    expect(clean.play[ash].obelisk).toEqual({ answers: {}, quest: null, looked: [] });
    expect(Object.keys(clean.play[ash].ramesses.answers)).toEqual(['1']);
  });

  it('keeps the family’s names for the launcher', () => {
    const p = start();
    expect(withPlayers(p, family.players)).toBe(p);
    expect(withPlayers(p, newFamily(['Zed']).players).players[0].name).toBe('Zed');
  });

  it('plays out a day on three phones, one of them offline for a while', () => {
    // The server, as api/egypt/progress.js runs it: stored first, the merge sent back.
    let stored = LEGACY;
    const save = (copy) => (stored = mergeProgress(stored, copy));
    const kids = newFamily(['Ash', 'Mia', 'Leo']).players;
    const [A, M, L] = kids.map((p) => p.id);

    // Each phone opens the trip: its own copy merged with the account's.
    let ashPhone = mergeProgress(stored, LEGACY);
    let miaPhone = mergeProgress(stored, null);
    let leoPhone = mergeProgress(stored, null);

    ashPhone = answerAll(ashPhone, ramesses, A);
    ashPhone = mergeProgress(save(ashPhone), ashPhone);
    miaPhone = recordQuest(answerAll(miaPhone, ramesses, M), 'ramesses', M, { found: true });
    miaPhone = mergeProgress(save(miaPhone), miaPhone);
    leoPhone = answerAll(leoPhone, obelisk, L); // no signal: not saved yet
    leoPhone = mergeProgress(stored, leoPhone); // a refresh that got through later
    save(leoPhone);
    ashPhone = mergeProgress(stored, ashPhone);

    const { board } = scores(ashPhone, GEM, kids);
    const pts = Object.fromEntries(board.map((p) => [p.id, p.points]));
    const quiz = (stop) => stop.quiz.length * POINTS.correct;
    expect(pts[A]).toBe(POINTS.correct + quiz(ramesses));
    expect(pts[M]).toBe(POINTS.correct + POINTS.quest + quiz(ramesses) + POINTS.quest);
    expect(pts[L]).toBe(quiz(obelisk));
    expect(sameProgress(ashPhone, stored)).toBe(true);
  });

  it('recognises its own shape and rejects others', () => {
    expect(isProgress(start())).toBe(true);
    expect(isProgress(LEGACY)).toBe(false);
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
