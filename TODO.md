# TODO — GamePad

Open items for this repo. Delete each once it's shipped.

## 1. Delete the stray `next` file

A 0-byte file literally named `next` sits at the repo root, dated October 2025 —
almost certainly an accidental shell redirect of `next` CLI output. It has been
flagged as safe to delete in `CLAUDE.md` for months and is still there. Delete
it.

## 2. `/api/claude` advertises a rate limit it doesn't enforce

The route sets `X-RateLimit-Limit: 10` in its response headers while the actual
`CLAUDE_API` bucket allows **30/min**. The header is simply stale.

Pick one and make them agree — either lower the bucket to 10/min or correct the
header. A response header that lies about the limit is worse than no header,
because a client written against it will back off at the wrong point.

## 3. Confirm the deployed `NEXTAUTH_SECRET`

`CLAUDE.md` notes the **local** `NEXTAUTH_SECRET` is a weak placeholder that
must be rotated before any deploy. GamePad is now live and listed on the Aspiro
homepage, so the question is whether the Vercel environment has a proper
generated secret or inherited the placeholder.

Check the Vercel env var. If it is the placeholder, rotate it — a guessable
NextAuth secret means forgeable session tokens. (Rotating invalidates existing
sessions; everyone signs in again, which is fine for a family app.)

## 4. No tests

There is no test framework in the repo and no CI. Not urgent for a family
utility, but the quiz SSE room-state machine (`lobby → playing → question →
reveal → scores → finished`, with `stateVersion` as the SSE cursor) is the one
piece with enough moving parts to be worth covering if this is ever extended.
