import { describe, expect, it } from 'vitest';
import { claimHandle, forget, handleOf, listSeen, remember, seenBy, takenNames } from './memory';

// Just enough of a Mongo database for lib/quiz/memory.js: equality, $in,
// $ne, $exists and $or in queries; $set, $unset and $setOnInsert, with upsert.
function fakeDb(seed = {}) {
  const cols = {};
  const get = (v, k) => v[k];
  const matches = (doc, q) =>
    Object.entries(q).every(([k, c]) => {
      if (k === '$or') return c.some((sub) => matches(doc, sub));
      const v = get(doc, k);
      if (c && typeof c === 'object' && !Array.isArray(c) && !(c instanceof Date)) {
        if ('$in' in c && !c.$in.includes(v)) return false;
        if ('$ne' in c && v === c.$ne) return false;
        if ('$exists' in c && (v !== undefined) !== c.$exists) return false;
        return true;
      }
      return v === c;
    });
  const col = (name) => {
    const rows = (cols[name] ||= (seed[name] || []).map((d, i) => ({ _id: `${name}${i}`, ...d })));
    let n = rows.length;
    return {
      rows,
      find: (q = {}) => {
        let out = rows.filter((d) => matches(d, q));
        const cur = {
          sort: (s) => {
            const [[k, dir]] = Object.entries(s);
            out = [...out].sort((a, b) => (a[k] > b[k] ? dir : -dir));
            return cur;
          },
          toArray: async () => out.map((d) => ({ ...d })),
        };
        return cur;
      },
      findOne: async (q) => {
        const d = rows.find((x) => matches(x, q));
        return d ? { ...d } : null;
      },
      updateOne: async (q, u, opts = {}) => {
        let d = rows.find((x) => matches(x, q));
        if (!d) {
          if (!opts.upsert) return { modifiedCount: 0 };
          d = { _id: `${name}${n++}` };
          for (const [k, v] of Object.entries(q)) if (typeof v !== 'object') d[k] = v;
          Object.assign(d, u.$setOnInsert || {});
          rows.push(d);
        }
        Object.assign(d, u.$set || {});
        for (const k of Object.keys(u.$unset || {})) delete d[k];
        return { modifiedCount: 1 };
      },
      deleteOne: async (q) => {
        const i = rows.findIndex((x) => matches(x, q));
        if (i >= 0) rows.splice(i, 1);
      },
    };
  };
  const made = {};
  return { collection: (name) => (made[name] ||= col(name)) };
}

const t = (s) => new Date(`2026-10-${s}`);
const family = () =>
  fakeDb({
    users: [
      { email: 'ash@x', name: 'Ashish Gupta' },
      { email: 'anya@x', name: 'Anya Gupta' },
    ],
    quizseens: [
      { email: 'ash@x', nameKey: 'ashish', name: 'Ashish', seen: ['a1', 'a2'], updatedAt: t('22') },
      { email: 'ash@x', nameKey: 'anya', name: 'Anya', seen: ['n1', 'n2', 'n3'], updatedAt: t('22') },
      { email: 'ash@x', nameKey: 'nikhil', name: 'Nikhil', seen: ['k1'], updatedAt: t('22') },
      { email: 'anya@x', nameKey: 'anya', name: 'Anya', seen: ['n3', 'n4'], updatedAt: t('23') },
      { email: 'anya@x', nameKey: 'ashish', name: 'Ashish', seen: ['a3'], updatedAt: t('23') },
    ],
  });

describe('handles and who has seen what', () => {
  it('a new handle is the first name, and adopts every guest memory of that name', async () => {
    const db = family();
    expect(await handleOf(db, 'anya@x')).toBe('Anya');
    // Anya's own memory: what she saw as a guest on Ash's account and on her own.
    expect((await seenBy(db, null, ['Anya'])).sort()).toEqual(['n1', 'n2', 'n3', 'n4']);
    // Ash's list still shows her, with her real count; Nikhil is still a guest.
    const list = await listSeen(db, 'ash@x');
    expect(list.find((p) => p.name === 'Anya')).toMatchObject({ count: 4, signedIn: true, me: false });
    expect(list.find((p) => p.name === 'Nikhil')).toMatchObject({ count: 1, signedIn: false });
  });

  it("someone else's handle is taken; your own is not", async () => {
    const db = family();
    await handleOf(db, 'ash@x');
    await handleOf(db, 'anya@x');
    expect(await takenNames(db, ['anya', 'Ashish', 'Nikhil'], 'ash@x')).toEqual(['anya']);
    expect(await takenNames(db, ['Anya', 'Ashish'])).toEqual(['Anya', 'Ashish']);
  });

  it('a handle is unique across GamePad', async () => {
    const db = family();
    await handleOf(db, 'anya@x');
    await expect(claimHandle(db, 'ash@x', 'anya')).rejects.toMatchObject({ status: 409 });
    await expect(claimHandle(db, 'ash@x', '  ')).rejects.toMatchObject({ status: 400 });
  });

  it("a game leaves out what any player has seen: a signed-in player's own memory, a guest's on the host", async () => {
    const db = family();
    await handleOf(db, 'ash@x');
    await handleOf(db, 'anya@x');
    expect((await seenBy(db, 'ash@x', ['Ashish', 'Nikhil'])).sort()).toEqual(['a1', 'a2', 'a3', 'k1']);
    // On Anya's account Nikhil is someone it has never seen.
    expect((await seenBy(db, 'anya@x', ['Nikhil']))).toEqual([]);
  });

  it("a game's questions go to each signed-in player's own memory, wherever they play", async () => {
    const db = family();
    await handleOf(db, 'anya@x');
    await remember(db, 'ash@x', ['Anya', 'Nikhil', 'Dilan'], ['q1']);
    expect(await seenBy(db, null, ['Anya'])).toContain('q1');
    expect(await seenBy(db, 'ash@x', ['Dilan'])).toEqual(['q1']);
    // A guest host keeps no guests, but the signed-in player keeps theirs.
    await remember(db, null, ['Anya', 'Stranger'], ['q2']);
    expect(await seenBy(db, null, ['Anya'])).toContain('q2');
    expect(await seenBy(db, 'ash@x', ['Stranger'])).toEqual([]);
  });

  it('changing a handle keeps the memory, and the links follow', async () => {
    const db = family();
    await handleOf(db, 'anya@x');
    await claimHandle(db, 'anya@x', 'Anya G');
    expect((await seenBy(db, 'ash@x', ['Anya G'])).sort()).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect((await listSeen(db, 'ash@x')).map((p) => p.name)).toContain('Anya G');
    // "Anya" is free again, and a guest of that name starts with nothing.
    expect(await seenBy(db, 'ash@x', ['Anya'])).toEqual([]);
  });

  it("forgetting a signed-in player clears their own memory; a guest's, just that one", async () => {
    const db = family();
    await handleOf(db, 'anya@x');
    await forget(db, 'ash@x', 'Anya');
    expect(await seenBy(db, null, ['Anya'])).toEqual([]);
    await forget(db, 'ash@x', 'Nikhil');
    expect(await seenBy(db, 'ash@x', ['Nikhil'])).toEqual([]);
  });
});
