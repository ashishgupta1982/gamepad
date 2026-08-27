import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Who is playing, on the server — the authoritative answer.
//
// ─── Why this exists ───────────────────────────────────────────────────────
//
// The Travel Bingo routes took identity straight from the request body and never
// looked at the session. `create` wrote whatever `hostUserId` it was handed
// onto the Game as its owner, and `join` matched cars by a body-supplied
// `userId` — and, being idempotent by design, returned the EXISTING car for
// that id rather than creating a new one.
//
// So a caller who knew or guessed another player's id could create games owned
// by that account, and could join a game as them and be handed their car.
// Nothing in the flow required a session, so being signed in was not even a
// prerequisite for claiming to be someone signed in.
//
// The rule here is the fix: **when a session exists it wins, unconditionally**.
// A client-supplied id is only ever consulted when there is no session at all,
// and even then it has to look like a guest id. It is not possible for a body
// field to name a real account.

// Must agree with the client's pattern in lib/identity.js. The `guest_` prefix
// is not decoration — it is what makes a supplied id structurally incapable of
// colliding with a Mongo ObjectId, so a guest can never name an account.
const GUEST_ID_PATTERN = /^guest_[a-z0-9]{4,48}$/;

/**
 * Resolve the acting player for a request.
 *
 * @param {object} req
 * @param {object} res
 * @param {object} [opts]
 * @param {boolean} [opts.allowGuest=true]  when false, an unauthenticated
 *   caller is rejected rather than being given a guest identity
 * @returns {Promise<{id: string, isGuest: boolean}|null>} null when the caller
 *   could not be identified — the caller should 400/401 as appropriate
 */
export async function resolvePlayer(req, res, { allowGuest = true } = {}) {
  const session = await getServerSession(req, res, authOptions);

  // Signed in: the session is the only source of truth. Anything in the body is
  // ignored, not merged, not preferred.
  if (session?.user?.id) {
    return { id: session.user.id, isGuest: false };
  }

  if (!allowGuest) return null;

  const supplied = req.body?.guestId;
  if (typeof supplied === 'string' && GUEST_ID_PATTERN.test(supplied)) {
    return { id: supplied, isGuest: true };
  }

  return null;
}

export { GUEST_ID_PATTERN };
