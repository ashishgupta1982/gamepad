# TODO — GamePad

Open items for this repo. Delete each once it's shipped.

Most of what was here is now sequenced in **`REDESIGN-PLAN.md`** rather than
tracked loose. What remains below is what that plan does *not* cover on its own,
plus the phase that will close each one.

## 1. Confirm the deployed `NEXTAUTH_SECRET`

The **local** `NEXTAUTH_SECRET` is a weak placeholder that must be rotated before
any deploy. GamePad is live and listed on the Aspiro homepage, so the question is
whether the Vercel environment has a proper generated secret or inherited the
placeholder.

Check the Vercel env var. If it is the placeholder, rotate it — a guessable
NextAuth secret means forgeable session tokens. Rotating invalidates existing
sessions; everyone signs in again, which is fine for a family app.

**Closes in:** redesign Phase 1, which touches auth end to end anyway.

## 2. Test coverage is narrow

`vitest` is in, with 34 tests over the quiz room state machine and the scoring
formula (`src/lib/*.test.js`). Nothing else is covered and there is no CI.

That was the deliberate scope — those two are the pieces that break quietly.
Component and end-to-end coverage remain unwritten; worth revisiting only if
GamePad grows beyond a family utility.

---

## Done

- ~~**Delete the stray `next` file.**~~ 0-byte file at the repo root dated
  October 2025, an accidental shell redirect of `next` CLI output. Deleted in
  Phase 0.
- ~~**`/api/claude` advertises a rate limit it doesn't enforce.**~~ The route set
  `X-RateLimit-Limit: 10` while the `CLAUDE_API` bucket allowed 30/min. Both the
  header and the 429 body now derive from `RATE_LIMITS.CLAUDE_API`, so they
  cannot drift apart again. Fixed in Phase 0.
