import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MAX_CUSTOM, normaliseCustomList } from '@/lib/quiz/catalogue';

// The quiz's client-side data: questions from the server, the memory of who
// has seen what, the thumbs, and the player's custom categories.

const CUSTOM_KEY = 'quiz:categories';
// The thumbs this phone has given, so it votes once a question.
const VOTES_KEY = 'quiz:votes';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const makeId = () => `c_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

/** A game's picks as the question route takes them: built-in ids, custom categories whole. */
export const picksForServer = (picks) =>
  (picks || []).map((p) => (typeof p === 'string' ? p : { name: p.name, description: p.description }));

/**
 * Ask the server for questions. Throws with a message fit to show.
 * `exclude` are questions already in this game, so a second batch cannot
 * repeat the first. `players` are the names playing: on a signed-in account
 * the server also leaves out whatever any of them has seen before.
 */
export async function fetchQuestions({ picks, level, count, exclude = [], players = [] }) {
  const res = await fetch('/api/quiz/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      picks: picksForServer(picks),
      level,
      count,
      avoid: exclude.map((q) => q.id),
      recent: exclude.map((q) => q.question.slice(0, 120)).slice(-30),
      players,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not get the questions. Try again?');
  return data.questions || [];
}

/**
 * Add a game's questions to each player's memory, on a signed-in account
 * (models/QuizSeen.js). Called at the end, or for the questions played so far
 * when a game is ended early. Never in the way of the game.
 */
export function rememberSeen(names, questions) {
  const ids = (questions || []).filter(Boolean).map((q) => q.id);
  if (!ids.length || !names?.length) return;
  fetch('/api/quiz/seen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names, ids }),
  }).catch(() => {});
}

// The handle last fetched on this page, so a screen opened later shows it at once.
let knownHandle = null;

/**
 * This phone's signed-in player: their quiz name, unique across GamePad
 * (lib/quiz/memory.js), given one on first use. `change` throws with a
 * message fit to show when the name is taken.
 */
export function useHandle() {
  const { status } = useSession();
  const [handle, setHandle] = useState(knownHandle);
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/quiz/handle')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        if (!d.handle) return;
        knownHandle = d.handle;
        setHandle(d.handle);
      })
      .catch(() => {});
  }, [status]);
  const change = useCallback(async (name) => {
    const res = await fetch('/api/quiz/handle', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not change it just now. Try again?');
    knownHandle = data.handle;
    setHandle(data.handle);
    return data.handle;
  }, []);
  return { handle: status === 'authenticated' ? handle : null, status, change };
}

/** The players this account remembers, and forgetting one. Signed in only. */
export function useSeenPlayers() {
  const { status } = useSession();
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/quiz/seen')
      .then((r) => (r.ok ? r.json() : { players: [] }))
      .then((d) => setPlayers(d.players || []))
      .catch(() => {});
  }, [status]);
  const forget = useCallback(async (name) => {
    const res = await fetch('/api/quiz/seen', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!res.ok) throw new Error('Could not do that just now. Try again?');
    setPlayers((await res.json()).players || []);
  }, []);
  return { players: status === 'authenticated' ? players : [], forget };
}

/** This phone's vote on a question: 'up', 'down', or undefined; `wrong` once flagged. */
export const myVote = (id) => read(VOTES_KEY, {})[id];

/**
 * A thumb, or "the answer's wrong". Remembered on the phone (the last few
 * hundred), so each phone votes once and can change its mind.
 */
export function rateQuestion(id, { vote, wrong } = {}) {
  const all = read(VOTES_KEY, {});
  const had = all[id] || {};
  const next = { ...had, ...(vote ? { vote } : {}), ...(wrong ? { wrong: true } : {}) };
  const keys = Object.keys(all).filter((k) => k !== id).slice(-300);
  write(VOTES_KEY, { ...Object.fromEntries(keys.map((k) => [k, all[k]])), [id]: next });
  fetch('/api/quiz/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wrong ? { id, wrong: true } : { id, vote, from: had.vote }),
  }).catch(() => {});
  return next;
}

/**
 * The player's own categories: on the account when signed in, on the device
 * otherwise. Signing in carries the device's over to the account once.
 */
export function useCustomCategories() {
  const { status } = useSession();
  const [list, setList] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const local = normaliseCustomList(read(CUSTOM_KEY, []), makeId);
    if (status !== 'authenticated') {
      setList(local);
      setReady(true);
      return;
    }
    fetch('/api/quiz/categories')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then(async ({ categories }) => {
        const names = new Set(categories.map((c) => c.name.toLowerCase()));
        const extra = local.filter((c) => !names.has(c.name.toLowerCase()));
        let merged = categories;
        if (extra.length) {
          merged = normaliseCustomList([...categories, ...extra], makeId).slice(0, MAX_CUSTOM);
          await save(merged, true).catch(() => {});
          write(CUSTOM_KEY, []);
        }
        setList(merged);
      })
      .catch(() => setList(local))
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const save = useCallback(
    async (next, signedIn = status === 'authenticated') => {
      const clean = normaliseCustomList(next, makeId);
      if (signedIn) {
        const res = await fetch('/api/quiz/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: clean }),
        });
        if (!res.ok) throw new Error('Could not save that category. Try again?');
        const data = await res.json();
        setList(data.categories);
        return data.categories;
      }
      write(CUSTOM_KEY, clean);
      setList(clean);
      return clean;
    },
    [status],
  );

  const upsert = (cat) => {
    const withId = { ...cat, id: cat.id || makeId() };
    const exists = list.some((c) => c.id === withId.id);
    return save(exists ? list.map((c) => (c.id === withId.id ? withId : c)) : [...list, withId]);
  };
  const remove = (id) => save(list.filter((c) => c.id !== id));

  return { list, ready, upsert, remove, full: list.length >= MAX_CUSTOM };
}
