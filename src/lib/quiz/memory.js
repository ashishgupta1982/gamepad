// Handles, and who has seen which questions (models/QuizSeen.js, User.quizName).
// Works on the native database handle, `db`, so the routes (through
// seenStore.js) and the scripts (scripts/quiz-handle.mjs) share one set of
// rules. Relative imports only, for the scripts.
//
// A signed-in player has a handle, unique across GamePad (Ash, 2026-10-23).
// A name in a game that matches a handle is that player, so:
//   - a signed-in player's memory is their account's own (nameKey SELF), kept
//     wherever they play, whoever hosts;
//   - a guest's memory is kept under the host's account, by name, as before;
//   - a host's list (the quiz home's No repeats) holds a link for each
//     signed-in player who has played in its games (linkTo, no questions of
//     its own), so it can show them with their real count.
// Taking a handle adopts every guest memory of that name, on any account: the
// name now means that player, so what it had seen is theirs.
import { SELF, addSeen, cleanHandle, handleBase, nameKey, playerKeys } from './seen.js';

const seenCol = (db) => db.collection('quizseens');
const usersCol = (db) => db.collection('users');
const fail = (status, message) => Object.assign(new Error(message), { status });

/** The signed-in players among these name keys: key → {email, handle}. */
export async function handlesFor(db, keys) {
  if (!keys?.length) return new Map();
  const users = await usersCol(db).find({ quizNameKey: { $in: keys } }, { projection: { email: 1, quizName: 1, quizNameKey: 1 } }).toArray();
  return new Map(users.map((u) => [u.quizNameKey, { email: u.email, handle: u.quizName }]));
}

/** The names here that are someone else's handle (anyone's but `email`'s), as typed. */
export async function takenNames(db, names, email = null) {
  const list = (Array.isArray(names) ? names : []).map((n) => String(n ?? '')).filter((n) => nameKey(n));
  const users = await handlesFor(db, [...new Set(list.map(nameKey))]);
  return list.filter((n) => {
    const u = users.get(nameKey(n));
    return u && u.email !== email;
  });
}

/** Who has this name as their handle: their email, or null. */
export async function handleOwner(db, name) {
  const key = nameKey(name);
  return key ? (await handlesFor(db, [key])).get(key)?.email || null : null;
}

/** Every question any of these players has seen: guests on the host's account, signed-in players on their own. */
export async function seenBy(db, host, names) {
  const keys = playerKeys(names);
  if (!keys.length) return [];
  const users = await handlesFor(db, keys);
  const guests = keys.filter((k) => !users.has(k));
  const or = [];
  if (host && guests.length) or.push({ email: host, nameKey: { $in: guests }, linkTo: { $exists: false } });
  if (users.size) or.push({ email: { $in: [...users.values()].map((u) => u.email) }, nameKey: SELF });
  if (!or.length) return [];
  const docs = await seenCol(db).find({ $or: or }, { projection: { seen: 1 } }).toArray();
  return [...new Set(docs.flatMap((d) => d.seen || []))];
}

async function addTo(db, email, key, name, ids, now) {
  const doc = await seenCol(db).findOne({ email, nameKey: key });
  await seenCol(db).updateOne(
    { email, nameKey: key },
    { $set: { name, seen: addSeen(doc?.seen, ids), updatedAt: now }, $unset: { linkTo: '' }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}

/** Add a game's questions to each player's memory. `host` may be null (a guest host): then only signed-in players keep them. */
export async function remember(db, host, names, ids) {
  const byKey = new Map();
  for (const raw of Array.isArray(names) ? names : []) {
    const key = nameKey(raw);
    if (key && !byKey.has(key)) byKey.set(key, String(raw).trim().slice(0, 40));
  }
  const users = await handlesFor(db, [...byKey.keys()]);
  const now = new Date();
  for (const [key, name] of byKey) {
    const u = users.get(key);
    if (!u) {
      if (host) await addTo(db, host, key, name, ids, now);
      continue;
    }
    await addTo(db, u.email, SELF, u.handle, ids, now);
    if (host && host !== u.email) {
      // A guest memory of this name here, from before it was a handle, is theirs.
      const old = await seenCol(db).findOne({ email: host, nameKey: key, linkTo: { $exists: false } });
      if (old?.seen?.length) await addTo(db, u.email, SELF, u.handle, old.seen, now);
      await seenCol(db).updateOne(
        { email: host, nameKey: key },
        { $set: { name: u.handle, linkTo: u.email, seen: [], updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    }
  }
}

/** The players a host remembers, most recent first: {name, count, signedIn, me}. */
export async function listSeen(db, host) {
  const docs = await seenCol(db).find({ email: host }).sort({ updatedAt: -1 }).toArray();
  const linked = docs.filter((d) => d.linkTo).map((d) => d.linkTo);
  const theirs = linked.length ? await seenCol(db).find({ email: { $in: linked }, nameKey: SELF }, { projection: { email: 1, seen: 1 } }).toArray() : [];
  const count = new Map(theirs.map((d) => [d.email, d.seen?.length || 0]));
  return docs.map((d) => ({
    name: d.name,
    count: d.linkTo ? count.get(d.linkTo) || 0 : d.seen?.length || 0,
    signedIn: d.nameKey === SELF || !!d.linkTo,
    me: d.nameKey === SELF,
  }));
}

/** Forget one player's questions: a guest's on this account, or a signed-in player's own. */
export async function forget(db, host, name) {
  const key = nameKey(name);
  const u = (await handlesFor(db, [key])).get(key);
  if (u) await seenCol(db).deleteOne({ email: u.email, nameKey: SELF });
  else await seenCol(db).deleteOne({ email: host, nameKey: key, linkTo: { $exists: false } });
}

/**
 * Give an account a handle, if it is free, and adopt every guest memory of
 * that name. A link left under the player's old handle follows the new one.
 * Throws with `status` 400 or 409 and a message fit to show.
 */
export async function claimHandle(db, email, wanted) {
  const handle = cleanHandle(wanted);
  if (!handle) throw fail(400, 'Pick a name with a letter or number in it.');
  const key = nameKey(handle);
  const me = await usersCol(db).findOne({ email });
  if (!me) throw fail(404, 'No account for that email.');
  if (await usersCol(db).findOne({ quizNameKey: key, email: { $ne: email } })) throw fail(409, `${handle} is someone else’s name. Try another.`);
  await usersCol(db).updateOne({ _id: me._id }, { $set: { quizName: handle, quizNameKey: key } });

  const now = new Date();
  const guests = await seenCol(db).find({ nameKey: key, linkTo: { $exists: false } }).sort({ updatedAt: 1 }).toArray();
  const own = await seenCol(db).findOne({ email, nameKey: SELF });
  let seen = own?.seen || [];
  for (const g of guests) seen = addSeen(seen, g.seen);
  if (own || seen.length) {
    await seenCol(db).updateOne({ email, nameKey: SELF }, { $set: { name: handle, seen, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  }
  for (const g of guests) {
    if (g.email === email) await seenCol(db).deleteOne({ _id: g._id });
    else await seenCol(db).updateOne({ _id: g._id }, { $set: { name: handle, linkTo: email, seen: [], updatedAt: now } });
  }
  for (const l of await seenCol(db).find({ linkTo: email }).toArray()) {
    if (l.nameKey === key) {
      await seenCol(db).updateOne({ _id: l._id }, { $set: { name: handle } });
    } else if (await seenCol(db).findOne({ email: l.email, nameKey: key })) {
      await seenCol(db).deleteOne({ _id: l._id });
    } else {
      await seenCol(db).updateOne({ _id: l._id }, { $set: { nameKey: key, name: handle } });
    }
  }
  return { handle, adopted: guests.map((g) => ({ account: g.email, seen: g.seen?.length || 0 })) };
}

/** An account's handle, giving it one first if it has none: its first name, or the first free numbered one. */
export async function handleOf(db, email) {
  const me = await usersCol(db).findOne({ email }, { projection: { name: 1, quizName: 1 } });
  if (!me) return null;
  if (me.quizName) return me.quizName;
  const base = handleBase(me.name, email);
  for (let n = 1; n < 100; n++) {
    const tryName = n === 1 ? base : `${base.slice(0, 18)}${n}`;
    if (!(await usersCol(db).findOne({ quizNameKey: nameKey(tryName) }))) return (await claimHandle(db, email, tryName)).handle;
  }
  return null;
}
