// Who is playing, on the client.
//
// One identity for the whole app. Travel Bingo used to own this privately, with
// a `travel-bingo:guestId` key and a `user:<email>` string that matched nothing
// else in the codebase — so a guest's identity was per-game, and a signed-in
// user's was a different shape from the `session.user.id` every other endpoint
// keys on.
//
// The save contract this supports:
//
//   guest      — plays everything. Multiplayer still works, because a Travel
//                Bingo game lives on the server against a join code. What a
//                guest does not get is history: nothing is attributed to an
//                account, because there is no account.
//   signed in  — games are attributed to session.user.id and show up in
//                "pick up where you left off".
//
// There is deliberately no adoption step when a guest signs in. Saving starts at
// sign-in and earlier guest games are not migrated — that was already the de
// facto behaviour, and this makes it the stated one.

export const GUEST_ID_KEY = 'gamepad:guestId';

// Must agree with the server's guard in utils/playerIdentity.js.
const GUEST_ID_PATTERN = /^guest_[a-z0-9]{4,48}$/;

function readStoredGuestId() {
  try {
    const stored = window.localStorage.getItem(GUEST_ID_KEY);
    return stored && GUEST_ID_PATTERN.test(stored) ? stored : null;
  } catch {
    // Private mode, or storage disabled.
    return null;
  }
}

// A stable id for an unauthenticated player, created on first use.
//
// Returns null during SSR: there is no browser storage to read, and inventing
// one on the server would hand every prerendered visitor the same identity.
// Callers must therefore treat null as "not ready yet", not as an error.
export function getGuestId() {
  if (typeof window === 'undefined') return null;

  const existing = readStoredGuestId();
  if (existing) return existing;

  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  const guestId = `guest_${random}${stamp}`.toLowerCase().replace(/[^a-z0-9_]/g, '');

  try {
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  } catch {
    // Not persisted — the id still works for this page's lifetime, which is
    // enough to finish the game in front of you.
  }
  return guestId;
}

/**
 * The current player's identity.
 *
 * @param {object|null} session  from useSession()
 * @returns {{id: string|null, isGuest: boolean}}
 */
export function getPlayerIdentity(session) {
  if (session?.user?.id) {
    return { id: session.user.id, isGuest: false };
  }
  return { id: getGuestId(), isGuest: true };
}

// What a guest sends with a request so the server can identify them. A signed-in
// client sends it too and the server ignores it — see the note in
// utils/playerIdentity.js about why the session always wins.
export function guestIdForRequest(session) {
  if (session?.user?.id) return undefined;
  return getGuestId() || undefined;
}
