# Gamepad - AI Assistant Notes

Family game launcher: Scrabble Scorer, Quiz, Darts, Travel Bingo. Next.js 15 (Pages Router) + React 19, MongoDB/Mongoose, shared `@aspiro/auth` (Google + email/password), Anthropic Claude SDK.

> **Active work:** `REDESIGN-PLAN.md` at the repo root is the agreed plan to
> realign GamePad with the Aspiro suite (shared `@aspiro/auth`) and redesign it
> mobile-first. **All phases (0-8) are done.** Read the plan before starting
> anything — it records what was decided and why, so you pick up context rather
> than re-deciding settled questions.

## Quick Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run start
npm run lint
npm test         # vitest
```

> `next build` currently fails on the Windows dev machine for every Next 15 app
> here — a machine problem, not a code problem. Verify via the dev server.

## Architecture

**Pages Router** (NOT App Router). File-based routes in `src/pages/`, API in `src/pages/api/`.

```
src/
├── pages/
│   ├── index.js                  # Landing page AND launcher — public, not gated
│   ├── signin.js, settings.js
│   ├── reset-password.js, verify-email.js   # landing pages for emailed links
│   ├── _app.js                   # fonts, SEO/OG defaults, SessionProvider
│   ├── _document.js              # icons, manifest, PWA meta, structured data
│   ├── games/
│   │   ├── scrabble-scorer/      # Local-only scoring
│   │   ├── quiz/                 # index.js (host), join.js (player)
│   │   ├── darts/                # index.js (mode picker + game)
│   │   └── travel-bingo/         # index.js (lobby + play)
│   └── api/
│       ├── auth/                 # [...nextauth] + 6 @aspiro/auth re-exports
│       ├── claude.js             # Cached AI chat (rate-limited)
│       ├── user.js
│       ├── games/                # CRUD for Game records
│       │   ├── index.js, [id].js
│       │   └── travel-bingo/     # create, by-code/[code], [id]/{index,join,submit-items,generate,mark-tile,comment}
│       └── quiz/
│           ├── leaderboard.js
│           ├── stats/{index.js,[playerId].js}
│           └── rooms/
│               ├── index.js
│               └── [roomCode]/{index,join,answer,stream}.js   # stream.js = SSE
├── components/
│   ├── ui/                       # button, card, alert, input, badge, sheet
│   ├── layout/                   # AppHeader, GameShell
│   ├── game/                     # NumericKeypad, TurnIndicator
│   ├── quiz/                     # Host + player screens, lobby, podium, etc.
│   ├── darts/                    # X01/Cricket/Clock/Killer boards + setup
│   ├── travel-bingo/             # Card, lobby, feed
│   ├── settings/
│   ├── ClaudeChat.js
├── models/                       # Mongoose
├── hooks/                        # useQuizRoom, useQuizScoring, useQuizTimer, useWakeLock
├── lib/                          # auth, brand, cn, identity, mongodb, mongodb-adapter, travelBingo
├── utils/                        # authHelper, playerIdentity, rateLimiter
├── data/                         # games (launcher metadata), quizConstants, dartsConstants
└── styles/globals.css            # design tokens + base layer + utilities
```

`jsconfig.json` provides `@/*` absolute imports rooted at `src/`.

**There is no `src/config/`, no `src/context/`, and no Cloudinary anywhere.** An
earlier revision of this file documented all three. The photo feature that used
Cloudinary was removed in `60ad439`; nothing in GamePad uploads media now.

## Data Model

Two primary collections plus support.

### `Game` (polymorphic, src/models/Game.js)

One document per game session. `gameType` enum: `scrabble-scorer | quiz | darts | travel-bingo`. Type-specific sub-documents:

| Field | Used by |
|-------|---------|
| `players[]` (name, scores[], roundScores[]) | All games |
| `quizConfig` | quiz (rounds, questions, playerStats, mode, timePerQuestion, scoringType) |
| `dartsConfig` | darts (gameMode, startingScore, double-in/out, turns, cricketMarks, clockTargets, killerLives) |
| `travelBingoConfig` | travel-bingo (joinCode, hostUserId, phase, cars[] with card tiles + comments, categories) |
| `status` | `active | completed` |

Pre-save hook updates `updatedAt`.

> **`Game.userId` is `session.user.id`** for a signed-in owner, or a
> `guest_…` id for a Travel Bingo game created by a guest. It used to hold an
> **email**; that moved in Phase 4 with **no backfill**, so games saved before
> then are orphaned by design.

### `QuizRoom` (src/models/QuizRoom.js)

Live multi-device quiz session keyed by 6-char `roomCode` (uppercase, unique). TTL-expires 24h via `expiresAt` index. Status flow: `lobby → playing → question → reveal → scores → finished`. `stateVersion` increments on every save and is the cursor used by the SSE stream (`/api/quiz/rooms/[roomCode]/stream`). Links to a `Game` doc via `gameId`.

### `PlayerStats` (src/models/PlayerStats.js)

Aggregated per-player quiz stats — gamesPlayed/Won, totalScore, bestStreak, avgResponseTime, categoryStats[], recentGames[]. Indexed by `householdId + playerName` and `totalScore`.

### `CachedResponse` (src/models/CachedResponse.js)

Generic cache for Claude responses, keyed off prompt hash. Used by `/api/claude`.

### `User` (src/models/User.js)

`email`, `name`, `role`, `lastLoginAt`, `customQuizCategories`, plus `authFields`
spread in from `@aspiro/auth/model` (password hash, verification and reset
state). **`name` is deliberately not required** — GamePad registers with
`requireName: false`, so the package falls back to the address local-part, and a
required field here would reject that write and break sign-up from the inside.

## Auth — `@aspiro/auth`

All of it comes from the shared package (v0.7.1, pinned like the rest of the
suite). **`src/lib/auth.js` is the only auth code this app owns** — one
`createAuth({...})` call. Don't hand-roll auth here.

- **Providers: Google + email/password.** Apple ships dormant and activates
  itself when `APPLE_SERVICES_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` /
  `APPLE_PRIVATE_KEY` are all present — an env-var change, never a code change.
- **Email/password does not use a `CredentialsProvider`.** It is a custom DB
  session minted by the package's own `/api/auth/login` route, which is why
  `/api/auth/providers` correctly lists **only** Google. That is the suite
  pattern, not a bug.
- **Routes:** `src/pages/api/auth/` holds `[...nextauth].js` plus six three-line
  re-exports (`login`, `register`, `verify-email`, `forgot-password`,
  `reset-password`, `resend-verification`). In the pages router a static file
  beats the catch-all, which is why the split works and why they cannot collapse
  into one dispatcher.
- **Pages:** `/reset-password` and `/verify-email` serve the links the package
  emails. It generates those URLs, so the app must serve the pages or the link
  404s silently. **GamePad has no middleware and no signed-out redirect**, so
  nothing can eat them — keep that true if an auth gate is ever added.
- **`/signin` cannot be deleted**, however redundant it looks. `pages: { signIn,
  error }` points at it, the header links to it, and NextAuth lands there on
  failure with `?error=<code>` — which it now reads and displays.
- `src/lib/brand.js` has **no imports** on purpose: `auth.js` pulls in mongoose,
  the Mongo adapter and bcrypt, so a client component importing the brand from
  there would drag all of that into the browser bundle.
- Client: `useSession()`. API: `getAuthenticatedUser(req, res)` from
  `src/utils/authHelper.js`, or `withAuth(handler)` to 401 unauthenticated.
- Guest play is supported — many game APIs work without a session.

**Two config lines are load-bearing and fail silently if removed:**
`transpilePackages: ['@aspiro/auth']` in `next.config.mjs` (the package ships raw
JSX), and `'./node_modules/@aspiro/auth/src/**/*.{js,jsx}'` in the Tailwind
`content` array — without the latter none of the dialog's classes are generated,
so it renders unpositioned and invisible with nothing erroring.

## Environment

See `.env.example` (committed — `.gitignore` blanket-ignores `.env*` with an
explicit `!.env.example` opt-in). Google uses `GOOGLE_ID` / `GOOGLE_SECRET`; the
package expects exactly those names, so don't rename them to `GOOGLE_CLIENT_ID`.

> **`RESEND_API_KEY` + `EMAIL_FROM` must be set in Vercel.** If they are missing,
> the package logs the verification/reset link to the server console and carries
> on — nothing throws and nothing warns. A missing env var is therefore the most
> likely cause of "email isn't sending", not a bug in the flow.

## Rate Limiting

`src/utils/rateLimiter.js` — in-memory sliding window, keyed by client IP. Buckets:

| Bucket | Limit |
|--------|-------|
| `CLAUDE_API` | 30/min |
| `STANDARD_API` | 60/min |
| `ADMIN_API` | 30/min |
| `READ_API` | 120/min |
| `AUTH_API` | 10 / 15 min |

`/api/claude` derives its `X-RateLimit-*` headers from `RATE_LIMITS.CLAUDE_API`
rather than hardcoding them, so the advertised limit cannot drift from the
enforced one again.

`getClientIP` is exported — `@aspiro/auth` takes it as config, rate-limiting its
routes through this limiter rather than shipping a second one. The `AUTH_API`
bucket (10 / 15 min / IP) is deliberately a much longer window than the others:
it exists to make online password guessing impractical, not to smooth bursts.

## Design System

Rebuilt in Phase 0. **Read `REDESIGN-PLAN.md` §3 before changing any of it.**

- **Tokens live in `src/styles/globals.css`** as HSL *channel triplets*
  (`21 90% 48%`), not `hsl()` strings. `tailwind.config.mjs` wraps them with an
  `<alpha-value>` placeholder, which is what makes `bg-brand/10` work. Add a
  colour in both places or not at all.
- **Brand is rust `#EA580C` + teal `#0D9488`.** Not arbitrary — `manifest.json`'s
  `theme_color`, the icons and the OG card were all built around it by the brand
  pass (`c4f1c91`). Changing it invalidates shipped assets.
- **Fonts:** Outfit (display) + Inter (body), wired via `next/font` in `_app.js`
  and exposed on `:root` — *not* on a wrapper element, so portalled dialogs still
  resolve them. Two earlier picks were rejected: Varela Round (single 400 weight,
  no contrast for scores) and Fredoka (too bubbly — read as a children's app).
  **Don't reach for a rounded display face here.**
- **Per-game colours** — `game-scrabble|quiz|darts|bingo` tokens, so a player can
  tell which game the phone is showing at a glance.
- **Mobile mechanics are in the base layer** and are load-bearing:
  `touch-action: manipulation` (kills the 300ms tap delay),
  `overscroll-behavior-y: contain` (stops pull-to-refresh binning a live game),
  `100dvh`, and `viewport-fit=cover` in `_app.js` so `env(safe-area-inset-*)`
  resolves. Utilities: `.press` `.tnum` `.pb-safe` `.pt-safe` `.px-safe`
  `.scroll-contain`, plus `min-h-touch` (44px).
- `prefers-reduced-motion` is handled globally — don't re-implement per component.

**Components** — build on these rather than hand-rolling:

| | |
|---|---|
| `ui/button`, `ui/card`, `ui/alert`, `ui/input`, `ui/badge` | token-backed primitives; `cn()` from `lib/cn` merges classes so a caller's `className` genuinely wins |
| `ui/sheet` | Radix-backed. `side="bottom"` (default) is a bottom sheet — the right shape on a phone, since it opens under the thumb; `side="center"` for short confirms |
| `layout/AppHeader` | the one header |
| `layout/GameShell` | header + scrolling body + **bottom action bar**. Primary actions belong in `actions`, not at the top of the screen |
| `game/NumericKeypad` | shared score entry. Controlled, holds `value` as a **string** so an empty pad and a typed `0` stay distinguishable. Does not own the display — that is where the games genuinely differ |
| `game/TurnIndicator` | whose turn it is, readable at arm's length |
| `hooks/useWakeLock` | opt in via `GameShell keepAwake` |

> **Never build a class name by interpolation** (`` `text-${tone}` ``). Tailwind
> generates only what it can literally see, so an interpolated class is never
> emitted and the element silently renders unstyled — no error, no warning. Use
> an explicit lookup map, as `TurnIndicator` does.

## Landing page (`/`)

**It is the launcher and the public landing page, deliberately one thing.** Do
not gate it. CookBook gates everything and uses `/signin` as its brochure — right
for CookBook, wrong here, because GamePad's whole point is that you can play
without an account.

- The four games come from `src/data/games.js`, not inline in the page. Adding a
  fifth game is one entry, not an edit in three places.
- **Sign-in sits *below* the games**, framed as what it adds. A first-time
  visitor should reach a game before they reach a reason to sign up.
- Exactly **one** `SignInDialog` instance per page. Rendering the options twice
  is how a sibling app ended up offering fewer ways in at the bottom of a page
  than at the top.
- The upsell card and the continue strip are gated on `status`, so they render
  **after hydration**, not in the SSR HTML. That is intentional: gating on
  `'unauthenticated'` rather than `!session` means the card cannot flash at
  someone who is already signed in. The games themselves are in the server HTML.
- A signed-out visitor gets **no** empty "your games" shell. An empty state for
  something you never opted into reads as a nag.

## Identity & the save contract

**One rule, all four games: guest = local only, signed in = saved.**

| | |
|---|---|
| `lib/identity.js` | client. `getPlayerIdentity(session)` and `guestIdForRequest(session)`. Guest ids live in `localStorage` under `gamepad:guestId` and look like `guest_<base36>` |
| `utils/playerIdentity.js` | **server, authoritative.** `resolvePlayer(req, res)` |

**`resolvePlayer` is the security boundary — do not bypass it.** When a session
exists it wins unconditionally and any body field is ignored. A client-supplied
id is consulted only when there is no session, and must match
`/^guest_[a-z0-9]{4,48}$/` — which is what makes it structurally incapable of
naming a Mongo ObjectId, and therefore a real account.

This replaced routes that read identity straight from the request body. See the
Phase 4 notes in `REDESIGN-PLAN.md` for what that allowed.

- **Guests still play everything**, including multiplayer Travel Bingo — those
  games live on the server against a join code. What a guest does not get is
  *history*, because there is no account to attribute it to.
- Local, unsaved games use the sentinel `_id: 'guest'`. All of Scrabble, Quiz and
  Darts use it; never PATCH or DELETE a game with that id.
- **There is no guest→account adoption.** Saving starts at sign-in. That was
  already the de facto behaviour, and is now the stated one.
- `game/GuestNotice` says so before the game starts. Mount it on any new game's
  setup screen — it renders nothing for a signed-in user and nothing while the
  session is loading.

## Quiz internals

- **`lib/quizScoring.js` is the only scoring formula.** It used to exist twice —
  in `hooks/useQuizScoring.js` for same-device play and inline in the answer API
  route for multi-device. They were identical by coincidence, with nothing
  keeping them so, and a tuning change to one would have made the same quiz score
  differently depending on how it was played. Both now call the shared module.
- **`lib/quizRoom.js` states the room state machine** — `canTransition`,
  `nextStatus`, `allAnswered`, `canAnswer`. The statuses were on the model but
  the legal *transitions* lived only in the order the UI happened to call things.
- Both are covered by `npm test`. The tests were written against the behaviour as
  it stood **before** the reskin, so they describe what the game already did.
- `answer.js` bumps `stateVersion` manually **and** the model's `pre('save')`
  hook bumps it again, so an answer advances it by two. Harmless — the SSE cursor
  only needs it to increase — but don't read it as a count of anything.

## Realtime (Quiz)

Multi-device quiz uses SSE, not WebSockets. Client opens `GET /api/quiz/rooms/[roomCode]/stream`; server polls the room and pushes when `stateVersion` increments. Players submit answers via `POST /api/quiz/rooms/[roomCode]/answer`. Hook: `src/hooks/useQuizRoom.js`.

## Travel Bingo Flow

1. Host creates game (`POST /api/games/travel-bingo/create`) → gets join code.
2. Cars join (`POST /api/games/travel-bingo/[id]/join`) — each car is a sub-document on `Game.travelBingoConfig.cars`.
3. Each car submits suggested items (`submit-items`).
4. Host triggers `generate` to build per-car bingo cards from the merged pool.
5. Cars mark tiles found via `mark-tile`.
6. Cars can comment on each other's finds.
7. First to complete becomes `winnerCarId`.

Helpers in `src/lib/travelBingo.js`: `generateJoinCode`, `generateId`, `findCar`, `isHost`, `carCompletion`. Uses `crypto.randomInt` with a confusable-char-free alphabet.

## Claude AI

`/api/claude` is the only AI chat endpoint. Caches by base64-truncated prompt key in `CachedResponse`. No streaming. Used sparingly — the games themselves do not call Claude during play; quiz questions are static (`src/data/quizConstants.js`). Travel Bingo's `generate` route calls the SDK directly.

## UI Conventions

- Tailwind against the token layer above. **Prefer tokens over raw palette
  classes** (`bg-brand`, not `bg-orange-600`) in anything new or touched.
- Existing game screens still hardcode orange/amber/teal inline — that is the
  debt Phases 5-8 clear, game by game. Don't bulk-rewrite them ad hoc.
- Icons: `lucide-react` for **UI affordances** — back arrows, the settings gear,
  the close button. Those must read as controls and carry an `aria-label`.
- **The four game emoji on the launcher are deliberate and are not icons.** They
  are illustration. A pass replaced them with flat monochrome lucide glyphs and
  the launcher stopped looking like a games app — a family game launcher wants
  the colour and depth that platform emoji already have. Don't "fix" them back.
- **No meta pills on the launcher tiles.** Player counts and category counts were
  tried and removed: clutter on a four-item screen, and nobody picks between
  Darts and Travel Bingo on player count.
- Mobile-first. The phone gets passed around a table: primary actions belong at
  the bottom, nothing may depend on hover, and touch targets are 44px minimum.
- Each game owns its component folder under `src/components/<game>/` — no
  cross-game sharing beyond `ui/` and the headers.

## Gotchas

- **One header: `layout/AppHeader.jsx`.** `Header.js` and `ProfessionalHeader.js` were near-identical duplicates and are deleted. Don't add a second. Its account menu is a bottom **sheet**, not a dropdown — this phone gets passed around, and a hover-anchored menu is meaningless on touch. **The email address is deliberately not in the header bar**; it lives one tap inside the sheet.
- **`src/pages/api/quiz/...` uses `@/...` absolute imports**, but some other files use relative paths (`../../../lib/mongodb`). Both work via `jsconfig.json` baseUrl=src.
- **`QuizRoom.pre('save')` always bumps `stateVersion`** — even on no-op saves. Don't rely on it as a change detector beyond SSE.
- **`Game.gameType` enum is the source of truth** for which sub-config is populated. Polymorphic doc — be careful with mass projections.
- **The viewport meta is declared once, in `_app.js`.** Seven pages each carried their own copy, which overrode it (next/head dedupes by name, page wins) and would silently drop `viewport-fit=cover`. Don't reintroduce a per-page one.
- **`.eslintrc.json` is minimal** — lint is permissive.
- **Tests are `vitest` and cover `src/lib/` only** — the quiz room state machine and the scoring formula, the two pieces that break quietly. No CI, no component or end-to-end coverage. `npm test`.
- **`.env.local` contains live secrets** (Mongo, Google, Anthropic) and is untracked. Do not echo or paste them. The local `NEXTAUTH_SECRET` is a weak placeholder — rotate before/with the Phase 1 deploy.

## Brand & SEO surface

The app has a real public identity — don't reintroduce skeleton defaults when copying files in from a sibling project. `public/` carries `icon.svg`, `logo.svg`, `apple-touch-icon.png`, `icon-192.png` / `icon-512.png`, `og-card.png`, `manifest.json`, `robots.txt` and `sitemap.xml`, with OG/Twitter meta and structured data wired through `_app.js` / `_document.js`. The brand pass (`c4f1c91`) deleted `next.svg` and `vercel.svg` and renamed the package — if those reappear, they came from a copied file.

## Working across machines

`GIT_SYNC_GUIDE.md` at the repo root documents keeping this repo in sync when work happens in more than one place, and `sync-check.ps1` is the pre-flight check it describes — run it before starting work to see whether local and remote have diverged.

## History

- Built as a full game launcher from a generic Next.js skeleton (from 2025-10-24)
- Scrabble Scorer → Quiz (rebuilt Kahoot-style with SSE multi-device) → Darts (X01/Cricket/Clock/Killer) → Travel Bingo
- Last gameplay feature: Travel Bingo (`45a5fbb`, 2026-05-02)
- Since then: brand/SEO pass, git sync guide, Travel Bingo photo feature removed (`60ad439`)
- 2026-08-27: redesign plan agreed; **Phase 0** landed — design tokens, fonts, mobile base layer, config-bug fixes, doc accuracy
- 2026-08-27: **Phase 4** landed — one identity, `session.user.id` ownership, Travel Bingo authorisation fixed, Darts guest play fixed
- 2026-08-27: **Phases 5-8** landed — all four games reskinned; first tests in the repo
- 2026-08-27: **Phase 3** landed — landing page rebuilt as a public launcher
- 2026-08-27: **Phase 2** landed — design system, one app shell, shared keypad/turn primitives
- 2026-08-27: **Phase 1** landed — migrated to `@aspiro/auth` v0.7.1; email/password added alongside Google; GamePad is no longer the suite's odd one out
