# Gamepad - AI Assistant Notes

Family game launcher: Scrabble Scorer, Quiz, Darts, Travel Bingo. Next.js 15 (Pages Router) + React 19, MongoDB/Mongoose, NextAuth (Google), Anthropic Claude SDK.

> **Active work:** `REDESIGN-PLAN.md` at the repo root is the agreed plan to
> realign GamePad with the Aspiro suite (shared `@aspiro/auth`) and redesign it
> mobile-first. **Phase 0 is done.** Read the plan before starting anything, so
> you pick up at the right phase rather than re-deciding settled questions.

## Quick Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run start
npm run lint
```

> `next build` currently fails on the Windows dev machine for every Next 15 app
> here — a machine problem, not a code problem. Verify via the dev server.

## Architecture

**Pages Router** (NOT App Router). File-based routes in `src/pages/`, API in `src/pages/api/`.

```
src/
├── pages/
│   ├── index.js                  # Game launcher grid
│   ├── signin.js, settings.js
│   ├── _app.js                   # fonts, SEO/OG defaults, SessionProvider
│   ├── _document.js              # icons, manifest, PWA meta, structured data
│   ├── games/
│   │   ├── scrabble-scorer/      # Local-only scoring
│   │   ├── quiz/                 # index.js (host), join.js (player)
│   │   ├── darts/                # index.js (mode picker + game)
│   │   └── travel-bingo/         # index.js (lobby + play)
│   └── api/
│       ├── auth/[...nextauth].js
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
│   ├── ui/                       # button, card, alert — 3 primitives only
│   ├── quiz/                     # Host + player screens, lobby, podium, etc.
│   ├── darts/                    # X01/Cricket/Clock/Killer boards + setup
│   ├── travel-bingo/             # Card, lobby, feed
│   ├── settings/
│   ├── ClaudeChat.js
│   ├── Header.js, ProfessionalHeader.js
├── models/                       # Mongoose
├── hooks/                        # useQuizRoom, useQuizScoring, useQuizTimer
├── lib/                          # mongodb, mongodb-adapter, travelBingo
├── utils/                        # authHelper, rateLimiter
├── data/                         # quizConstants, dartsConstants
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

> **`Game.userId` holds an email address**, while `quiz/rooms` and `quiz/stats`
> use `session.user.id`. That inconsistency is known and is Phase 4 of the
> redesign plan — it moves to `session.user.id` with **no backfill**. Don't
> "fix" half of it in passing.

### `QuizRoom` (src/models/QuizRoom.js)

Live multi-device quiz session keyed by 6-char `roomCode` (uppercase, unique). TTL-expires 24h via `expiresAt` index. Status flow: `lobby → playing → question → reveal → scores → finished`. `stateVersion` increments on every save and is the cursor used by the SSE stream (`/api/quiz/rooms/[roomCode]/stream`). Links to a `Game` doc via `gameId`.

### `PlayerStats` (src/models/PlayerStats.js)

Aggregated per-player quiz stats — gamesPlayed/Won, totalScore, bestStreak, avgResponseTime, categoryStats[], recentGames[]. Indexed by `householdId + playerName` and `totalScore`.

### `CachedResponse` (src/models/CachedResponse.js)

Generic cache for Claude responses, keyed off prompt hash. Used by `/api/claude`.

### `User` (src/models/User.js)

Minimal — `email`, `name`, `role`, `lastLoginAt`, `customQuizCategories`. No auth
fields yet; Phase 1 spreads `authFields` from `@aspiro/auth/model` into it.

## Auth

- Client: `useSession()` from `next-auth/react`
- API: `getAuthenticatedUser(req, res)` from `src/utils/authHelper.js`, or wrap with `withAuth(handler)` to 401 unauthenticated
- Providers: **Google only**, hand-rolled in `[...nextauth].js`
- MongoDB adapter via `@next-auth/mongodb-adapter`
- Guest play is supported — many game APIs work without a session (host gets a session id, players join by code)

> **GamePad is the last app in the suite not on `@aspiro/auth`.** The package's
> README lists it as "deferred". Phase 1 of the redesign plan migrates it and
> adds email/password. Don't hand-roll more auth here in the meantime.

## Rate Limiting

`src/utils/rateLimiter.js` — in-memory sliding window, keyed by client IP. Buckets:

| Bucket | Limit |
|--------|-------|
| `CLAUDE_API` | 30/min |
| `STANDARD_API` | 60/min |
| `ADMIN_API` | 30/min |
| `READ_API` | 120/min |

`/api/claude` derives its `X-RateLimit-*` headers from `RATE_LIMITS.CLAUDE_API`
rather than hardcoding them, so the advertised limit cannot drift from the
enforced one again.

> `getClientIP` is defined in `rateLimiter.js` but **not exported**, so
> `/api/claude` carries a duplicate copy. Phase 1 exports it and adds the
> `AUTH_API` bucket (10 / 15 min / IP) that `@aspiro/auth` needs.

## Design System

Rebuilt in Phase 0. **Read `REDESIGN-PLAN.md` §3 before changing any of it.**

- **Tokens live in `src/styles/globals.css`** as HSL *channel triplets*
  (`21 90% 48%`), not `hsl()` strings. `tailwind.config.mjs` wraps them with an
  `<alpha-value>` placeholder, which is what makes `bg-brand/10` work. Add a
  colour in both places or not at all.
- **Brand is rust `#EA580C` + teal `#0D9488`.** Not arbitrary — `manifest.json`'s
  `theme_color`, the icons and the OG card were all built around it by the brand
  pass (`c4f1c91`). Changing it invalidates shipped assets.
- **Fonts:** Fredoka (display) + Nunito Sans (body), wired via `next/font` in
  `_app.js` and exposed on `:root` — *not* on a wrapper element, so portalled
  dialogs still resolve them.
- **Per-game colours** — `game-scrabble|quiz|darts|bingo` tokens, so a player can
  tell which game the phone is showing at a glance.
- **Mobile mechanics are in the base layer** and are load-bearing:
  `touch-action: manipulation` (kills the 300ms tap delay),
  `overscroll-behavior-y: contain` (stops pull-to-refresh binning a live game),
  `100dvh`, and `viewport-fit=cover` in `_app.js` so `env(safe-area-inset-*)`
  resolves. Utilities: `.press` `.tnum` `.pb-safe` `.pt-safe` `.px-safe`
  `.scroll-contain`, plus `min-h-touch` (44px).
- `prefers-reduced-motion` is handled globally — don't re-implement per component.

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
- Icons: `lucide-react` (already a dependency). **Emoji are not icons** — they
  are fine in copy, not as UI affordances.
- Mobile-first. The phone gets passed around a table: primary actions belong at
  the bottom, nothing may depend on hover, and touch targets are 44px minimum.
- Each game owns its component folder under `src/components/<game>/` — no
  cross-game sharing beyond `ui/` and the headers.

## Gotchas

- **Two headers exist.** `Header.js` (used by `/signin`, `/settings`) and `ProfessionalHeader.js` (everything else). Phase 2 collapses them into one. Don't add a third.
- **`src/pages/api/quiz/...` uses `@/...` absolute imports**, but some other files use relative paths (`../../../lib/mongodb`). Both work via `jsconfig.json` baseUrl=src.
- **`QuizRoom.pre('save')` always bumps `stateVersion`** — even on no-op saves. Don't rely on it as a change detector beyond SSE.
- **`Game.gameType` enum is the source of truth** for which sub-config is populated. Polymorphic doc — be careful with mass projections.
- **The viewport meta is declared once, in `_app.js`.** Seven pages each carried their own copy, which overrode it (next/head dedupes by name, page wins) and would silently drop `viewport-fit=cover`. Don't reintroduce a per-page one.
- **`.eslintrc.json` is minimal** — lint is permissive.
- **No tests** in the repo, and no CI. Phase 8 adds `vitest` coverage for the quiz room state machine before reskinning it.
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
