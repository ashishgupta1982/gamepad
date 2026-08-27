import { createAuth } from '@aspiro/auth';
import dbConnect from './mongodb';
import clientPromise from './mongodb-adapter';
import User from '../models/User';
import { checkRate, getClientIP } from '../utils/rateLimiter';
import { BRAND } from './brand';

// The whole of GamePad's auth, from one config object.
//
// Google, Apple and email + password all come from @aspiro/auth. Apple activates
// itself when its four env vars are present and stays dormant otherwise, so
// there is nothing to switch on in code if this app ever goes to the App Store.
//
// GamePad was the last app in the suite still hand-rolling auth — the package's
// README listed it as "deferred". What it had was Google only, with no password
// path at all, so email + password is genuinely new here rather than a port.

export const auth = createAuth({
  brand: BRAND,
  models: { User },
  dbConnect,
  clientPromise,
  rateLimit: { checkRate, getClientIP },

  // GamePad is casual and often signed into mid-game, so a missing name must not
  // block registration — the package falls back to the address local-part.
  // CookBook hard-fails instead, because a recipe card with no author name has
  // nothing to show; nothing in GamePad has that problem. Players type their own
  // display names per game anyway, which are unrelated to the account name.
  requireName: false,

  // Fields the client reads off the session. A field the UI reads but this never
  // sets renders as undefined, so the UI quietly disappears rather than erroring.
  //
  // `enrichFailed` distinguishes "no such document" from "the lookup failed".
  // This callback only decorates — it never provisions — so on a failed lookup
  // the right move is to return the session untouched and let it resolve from
  // the adapter's own user document.
  onSession: ({ session, dbUser, enrichFailed }) => {
    if (enrichFailed) return session;
    session.user.role = dbUser?.role ?? 'user';

    // Read by the quiz setup screen. Kept on the session because it is needed on
    // first paint of the category picker; a round trip there would show an empty
    // list before the custom categories appeared.
    session.user.customQuizCategories = dbUser?.customQuizCategories ?? [];
    return session;
  },
});

export const { authOptions } = auth;
