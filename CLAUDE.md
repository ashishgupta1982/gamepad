# Gamepad - AI Assistant Notes

Family game launcher: Scrabble Scorer, Quiz, Darts, Travel Bingo. Next.js 15 (Pages Router) + React 19, MongoDB/Mongoose, NextAuth (Google), Anthropic Claude SDK, Cloudinary for photos.

## Quick Commands

```bash
npm run dev      # localhost:3000
npm run build
npm run start
npm run lint
```

## Architecture

**Pages Router** (NOT App Router). File-based routes in `src/pages/`, API in `src/pages/api/`.

```
src/
├── pages/
│   ├── index.js                  # Game launcher grid
│   ├── signin.js, settings.js
│   ├── games/
│   │   ├── scrabble-scorer/      # Local-only scoring
│   │   ├── quiz/                 # index.js (host), join.js (player)
│   │   ├── darts/                # index.js (mode picker + game)
│   │   └── travel-bingo/         # index.js (lobby + play)
│   └── api/
│       ├── auth/[...nextauth].js
│       ├── claude.js             # Cached AI chat (rate-limited)
│       ├── cloudinary-signature.js
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
│   ├── ui/                       # ShadCN primitives
│   ├── quiz/                     # Host + player screens, lobby, podium, etc.
│   ├── darts/                    # X01/Cricket/Clock/Killer boards + setup
│   ├── travel-bingo/             # Card, lobby, photo upload, feed
│   ├── settings/
│   ├── ClaudeChat.js
│   ├── Header.js, ProfessionalHeader.js
├── models/                       # Mongoose
├── hooks/                        # useQuizRoom, useQuizScoring, useQuizTimer
├── lib/                          # mongodb, mongodb-adapter, cloudinaryUpload, travelBingo
├── utils/                        # authHelper, rateLimiter
├── data/                         # quizConstants, dartsConstants
└── styles/globals.css
```

`jsconfig.json` provides `@/*` absolute imports rooted at `src/`.

## Data Model

Two primary collections plus support.

### `Game` (polymorphic, src/models/Game.js)

One document per game session. `gameType` enum: `scrabble-scorer | quiz | darts | travel-bingo`. Type-specific sub-documents:

| Field | Used by |
|-------|---------|
| `players[]` (name, scores[], roundScores[]) | All games |
| `quizConfig` | quiz (rounds, questions, playerStats, mode, timePerQuestion, scoringType) |
| `dartsConfig` | darts (gameMode, startingScore, double-in/out, turns, cricketMarks, clockTargets, killerLives) |
| `travelBingoConfig` | travel-bingo (joinCode, hostUserId, phase, cars[] with card tiles + photos + comments, categories) |
| `status` | `active | completed` |

Pre-save hook updates `updatedAt`.

### `QuizRoom` (src/models/QuizRoom.js)

Live multi-device quiz session keyed by 6-char `roomCode` (uppercase, unique). TTL-expires 24h via `expiresAt` index. Status flow: `lobby → playing → question → reveal → scores → finished`. `stateVersion` increments on every save and is the cursor used by the SSE stream (`/api/quiz/rooms/[roomCode]/stream`). Links to a `Game` doc via `gameId`.

### `PlayerStats` (src/models/PlayerStats.js)

Aggregated per-player quiz stats — gamesPlayed/Won, totalScore, bestStreak, avgResponseTime, categoryStats[], recentGames[]. Indexed by `householdId + playerName` and `totalScore`.

### `CachedResponse` (src/models/CachedResponse.js)

Generic cache for Claude responses, keyed off prompt hash. Used by `/api/claude`.

### `User` (src/models/User.js)

Standard NextAuth user with `role`.

## Auth

- Client: `useSession()` from `next-auth/react`
- API: `getAuthenticatedUser(req, res)` from `src/utils/authHelper.js`, or wrap with `withAuth(handler)` to 401 unauthenticated
- Providers: Google only (configured in `[...nextauth].js`)
- MongoDB adapter via `@next-auth/mongodb-adapter`
- Guest play is supported — many game APIs work without a session (host gets a session id, players join by code)

## Rate Limiting

`src/utils/rateLimiter.js` — in-memory sliding window, keyed by client IP. Buckets:

| Bucket | Limit |
|--------|-------|
| `CLAUDE_API` | 30/min |
| `STANDARD_API` | 60/min |
| `ADMIN_API` | 30/min |
| `READ_API` | 120/min |

Note: `/api/claude` sets `X-RateLimit-Limit: 10` in response headers but the actual bucket allows 30/min. Header value is stale.

## Realtime (Quiz)

Multi-device quiz uses SSE, not WebSockets. Client opens `GET /api/quiz/rooms/[roomCode]/stream`; server polls the room and pushes when `stateVersion` increments. Players submit answers via `POST /api/quiz/rooms/[roomCode]/answer`. Hook: `src/hooks/useQuizRoom.js`.

## Travel Bingo Flow

1. Host creates game (`POST /api/games/travel-bingo/create`) → gets join code.
2. Cars join (`POST /api/games/travel-bingo/[id]/join`) — each car is a sub-document on `Game.travelBingoConfig.cars`.
3. Each car submits suggested items (`submit-items`).
4. Host triggers `generate` to build per-car bingo cards from the merged pool.
5. Cars mark tiles found via `mark-tile` (uploads photo to Cloudinary using signed upload from `/api/cloudinary-signature`).
6. Cars can comment on each other's finds.
7. First to complete becomes `winnerCarId`.

Helpers in `src/lib/travelBingo.js`: `generateJoinCode`, `generateId`, `findCar`, `isHost`, `carCompletion`. Uses `crypto.randomInt` with confusable-char-free alphabet.

## Claude AI

`/api/claude` is the only AI endpoint. Caches by base64-truncated prompt key in `CachedResponse`. No streaming. Used sparingly — the games themselves do not call Claude during play; quiz questions are static (`src/data/quizConstants.js`).

## UI Conventions

- Tailwind utility classes; ShadCN primitives in `src/components/ui/`
- Home page: vivid gradient game tiles (purple/pink/blue/red/emerald) on a soft gradient background
- Each game owns its own component folder under `src/components/<game>/` — no cross-game sharing beyond `ui/` and `Header`/`ProfessionalHeader`
- Mobile-first, no bottom nav (different from sibling DoIt app)
- Emojis are used in the launcher copy (Scrabble, Quiz, Darts, Bingo icons) — fine to keep, do not need to add more

## Gotchas

- **`src/pages/api/quiz/...` uses `@/...` absolute imports**, but some other files use relative paths (`../../../lib/mongodb`). Both work via `jsconfig.json` baseUrl=src.
- **`QuizRoom.pre('save')` always bumps `stateVersion`** — even on no-op saves. Don't rely on it as a change detector beyond SSE.
- **`Game.gameType` enum is the source of truth** for which sub-config is populated. Polymorphic doc — be careful with mass projections.
- **Travel Bingo photos use signed Cloudinary uploads from the client**, not server-side upload. Server only signs.
- **A stray empty file named `next`** sits at the repo root (likely an accidental redirect of `next` CLI output). Safe to delete; do not edit.
- **`.eslintrc.json` is minimal** — lint is permissive.
- **No tests** in the repo. Don't assume CI.
- **`.env.local` contains live secrets** (Mongo, Google, Anthropic, Cloudinary) and is untracked. Do not echo or paste them. The local `NEXTAUTH_SECRET` is a weak placeholder — must be rotated before any deploy.

## Recent Work (since 2025-10-24)

- Built full game launcher (was a generic Next.js skeleton)
- Added Scrabble Scorer, then quiz (rebuilt Kahoot-style with SSE multi-device), darts (X01/Cricket/Clock/Killer), Travel Bingo
- Quiz: multi-device host-can-play, per-question scores, SSE answer tracking, new round continuation, same-device scoring fixes
- Darts: setup screen + rules modal, fixed back-button crash and start-game bug
- Last feature commit `45a5fbb` — Travel Bingo (2026-05-02)
