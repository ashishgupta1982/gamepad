import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MAX_CUSTOM, normaliseCustomList } from '@/lib/quiz/catalogue';

// The quiz's client-side data: questions from the server, the memory of what
// has been asked, and the player's custom categories.

const SEEN_KEY = 'quiz:seen';
const CUSTOM_KEY = 'quiz:categories';

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

/** What has been asked on this device: fingerprints to filter, recent texts to steer away from. */
export function seenMemory() {
  const s = read(SEEN_KEY, { fps: [], texts: [] });
  return { avoid: (s.fps || []).slice(-500), recent: (s.texts || []).slice(-30) };
}
export function rememberAsked(questions) {
  const s = read(SEEN_KEY, { fps: [], texts: [] });
  const fps = [...(s.fps || []), ...questions.map((q) => q.id)];
  const texts = [...(s.texts || []), ...questions.map((q) => q.question.slice(0, 120))];
  write(SEEN_KEY, { fps: fps.slice(-500), texts: texts.slice(-60) });
}

/** A game's picks as the question route takes them: built-in ids, custom categories whole. */
export const picksForServer = (picks) =>
  (picks || []).map((p) => (typeof p === 'string' ? p : { name: p.name, description: p.description }));

/**
 * Ask the server for questions. Throws with a message fit to show.
 * `exclude` are questions already in this game, so a second batch cannot
 * repeat the first.
 */
export async function fetchQuestions({ picks, level, count, exclude = [] }) {
  const { avoid, recent } = seenMemory();
  const res = await fetch('/api/quiz/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      picks: picksForServer(picks),
      level,
      count,
      avoid: [...avoid, ...exclude.map((q) => q.id)],
      recent: [...recent, ...exclude.map((q) => q.question.slice(0, 120))].slice(-30),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not get the questions. Try again?');
  return data.questions || [];
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
