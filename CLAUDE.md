# Gamepad - AI Assistant Notes

Family game launcher: Scrabble Scorer, Quiz, Darts, Travel Bingo, Egypt Explorer. Next.js 15 (Pages Router) + React 19, MongoDB/Mongoose, shared `@aspiro/auth` (Google + email/password), Anthropic Claude SDK.

> **Active work:** `REDESIGN-PLAN.md` at the repo root is the agreed plan
> (2026-10-21) to rebuild GamePad as a **toy-box arcade**: a new landing page and
> every older game rebuilt on a shared arcade kit, Travel Bingo first. Read it
> before starting anything — it records Ash's decisions and what each game keeps,
> so you pick up context rather than re-deciding settled questions. (The August
> realignment plan it replaced is finished.)

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
│   │   ├── quiz/                 # index.js (home, setup, solo/shout, multi host), join.js (a player's phone)
│   │   ├── darts/                # index.js (home, setup, play)
│   │   ├── travel-bingo/         # index.js (lobby + play)
│   │   └── egypt-explorer/       # index.js (family, who is playing, trip picker, ?trip= and &stop=)
│   └── api/
│       ├── auth/                 # [...nextauth] + 6 @aspiro/auth re-exports
│       ├── claude.js             # Cached AI chat (rate-limited)
│       ├── user.js
│       ├── egypt/                # guide, quest (Claude), progress (merged per save), family
│       ├── games/                # CRUD for Game records
│       │   ├── index.js, [id].js
│       │   └── travel-bingo/     # create, by-code/[code], [id]/{index,join,submit-items,generate,mark-tile,comment}
│       └── quiz/
│           ├── questions.js, categories.js, history.js
│           └── live/
│               ├── index.js              # create a multi-phone quiz
│               └── [code]/{index,join,answer,host}.js   # index.js is the poll
├── components/
│   ├── ui/                       # button, card, alert, input, badge, sheet
│   ├── arcade/                   # sfx, feedback (buzz, confetti), Banner, MuteButton, caller (speech), players (avatars)
│   ├── layout/                   # AppHeader, GameShell
│   ├── game/                     # NumericKeypad, TurnIndicator
│   ├── quiz-show/                # the quiz as a game show: setup, screens, solo/shout runner, multi host + player
│   ├── darts/                    # the tappable Dartboard, scoreboards, setup, play, game over, saving (store.js)
│   ├── travel-bingo/             # Card, lobby, feed
│   ├── egypt/                    # Trip picker, trip, map, stop, quiz, quest, guide, passport, activities
│   ├── settings/
│   ├── ClaudeChat.js
├── models/                       # Mongoose (Game, EgyptFamily, ...)
├── hooks/                        # useWakeLock, useEgyptProgress, useEgyptFamily
├── lib/                          # auth, brand, cn, identity, mongodb, mongodb-adapter, travelBingo, egypt/
├── utils/                        # authHelper, playerIdentity, rateLimiter
├── data/                         # games (launcher metadata), gamesRoom (the home page's room), bingoPacks, dartsConstants, egypt/ (trips, photos)
└── styles/globals.css            # design tokens + base layer + utilities
```

`jsconfig.json` provides `@/*` absolute imports rooted at `src/`.

**There is no `src/config/`, no `src/context/`, and no Cloudinary anywhere.** An
earlier revision of this file documented all three. The photo feature that used
Cloudinary was removed in `60ad439`; nothing in GamePad stores media. Egypt
Explorer sends a photo to Claude and keeps nothing.

## Data Model

Two primary collections plus support.

### `Game` (polymorphic, src/models/Game.js)

One document per game session. `gameType` enum: `scrabble-scorer | quiz | darts | travel-bingo | egypt-explorer`. Type-specific sub-documents:

| Field | Used by |
|-------|---------|
| `players[]` (name, scores[], roundScores[]) | All games |
| `quizConfig` | quiz history: `mode` (solo, shout, multi), categories, `difficulty` (the level's name), totalQuestions, `result` (final standings). Older documents carry the pre-rebuild fields |
| `dartsConfig` | darts: `gameMode` and `match` (Mixed: the setup plus every dart thrown; see Darts). The other fields are the old scorer's, kept so its games still list |
| `travelBingoConfig` | travel-bingo (joinCode, hostUserId, phase, cars[] with card tiles + comments, categories) |
| `egyptConfig` | egypt-explorer (`trip`; `progress`, the whole client state, shape owned by `lib/egypt/progress.js`; `rev`, bumped per save; `v1Backup`, the record before version 2) |
| `status` | `active | completed` |

Pre-save hook updates `updatedAt`.

> **`Game.userId` is `session.user.id`** for a signed-in owner, or a
> `guest_…` id for a Travel Bingo game created by a guest. It used to hold an
> **email**; that moved in Phase 4 with **no backfill**, so games saved before
> then are orphaned by design.

### `QuizLive` (src/models/QuizLive.js)

A multi-phone quiz in progress, keyed by a 6-character `code`, expiring after 12 hours. `game` is the whole game object from `lib/quiz/machine.js`; `version` is the poll's cursor and the guard on concurrent writes; `hostToken` and `tokens` (one per player) are the passes that let the host run it and a dropped phone rejoin as itself. Replaced `QuizRoom` on 2026-10-21.

### `QuizQuestion` (src/models/QuizQuestion.js)

The quiz's question bank, one document per question keyed by `fingerprint`. Tagged with `category` (a catalogue id), `band` (`kids` or `adults`), `family` (fair in a mixed family game: Family mix draws these from both bands), `difficulty` 1 to 3, `dated` (left out of games a year after it was written), optional `media`. `source` is `seed` or `writer`; `stats` (served, answered, correct, up, down, wrong) and `status` (`active`, `review`, `retired`) are for the thumbs. Added 2026-10-21.

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

These are burst shields: in memory, they reset on every cold start. The real
AI budget is the durable per-account counter in `lib/egypt/ai.js` (Mongo
`RateLimit`), used by Egypt Explorer.

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
- Local, unsaved games use the sentinel `_id: 'guest'`. Scrabble uses it; never
  PATCH or DELETE a game with that id. Darts and the Quiz keep a guest's game on
  the device instead.
- **There is no guest→account adoption.** Saving starts at sign-in. That was
  already the de facto behaviour, and is now the stated one.
- `game/GuestNotice` says so before the game starts. Mount it on any new game's
  setup screen — it renders nothing for a signed-in user and nothing while the
  session is loading.

## Quiz

Rebuilt 2026-10-21 as a game show (`REDESIGN-PLAN.md`, Phase 3). Three modes: **solo** (one player, this phone), **shout** (one screen shows the question, everyone shouts, the quizmaster taps who got it right), **multi** (everyone answers on their own phone; the host's screen is the show, and on a laptop or TV it is TV mode).

- **One set of rules, `lib/quiz/machine.js`**: a game is a plain object and every move a pure function given the time (`start`, `answer`, `reveal`, `judge`, `next`, `tick`). The browser runs it for solo and shout and saves it to the device after every move (`quiz:local`), so a reload resumes. The server runs the same functions for multi. Scoring is still `lib/quizScoring.js`.
- **Questions come from the bank** (`QuizQuestion`, below), through `POST /api/quiz/questions`. The count is shared between the picks; each built-in pick is a random draw (`$sample`) from its categories for the level, leaving out what this device has played (`quiz:seen`). Where the bank is short for a category and level, the writer (`lib/quiz/writer.js#writeForBank`) writes more into it and the new questions are kept. A player's own categories are written live and not kept. Only writing counts against the durable budget per requester and site-wide, so a game served from the bank costs nothing. The rules are pure functions in `lib/quiz/bank.js` (what a pick draws from, `levelFilter`, `toBank`, `fromBank`); the database side is `lib/quiz/bankStore.js`. A game still asks for three first, then the rest.
- **The writer is Sonnet 5.5** (`quiz` in `lib/aiModels.js`, pinned), through a tool. **Sonnet 5.5 refuses a forced `tool_choice`** (400: `"tool" and "any" are not supported`), so it is `auto` and the system prompt asks for the tool; it thinks by default and the thinking counts toward `max_tokens`, so the call allows for it and sets `output_config.effort: 'low'`. Every question is checked (four distinct options, one answer among them), shuffled and positions balanced.
- **Pictures and emoji clues**: a question may carry `media`, `{kind:'image', src, alt, credit}` or `{kind:'emoji', text}` (`lib/quiz/questions.js#checkMedia`: a picture is `/quiz/…` or https). The question screen shows it above the question with the credit, the reveal shows it small.
- **Seeding**: `data/quiz-bank/<category>.json` (`{category, questions: [{band, question, options, answer, explanation, family, difficulty, dated, media?}]}`), loaded by `npm run quiz:import` (a dry run; `-- --apply` writes, insert-only, to the live database). `bank.test.js` fails on any seed question that would not load.
- **Categories are grouped** (`lib/quiz/catalogue.js`): Mixed bag plus 35 categories in 8 `GROUPS` (Screen & Music, Big Worlds, The World, Science & Nature, History & Myths, Sport, Books Words & Puzzles, Everyday). A pick is a category id, a whole group (`group:<id>`, one pick, sent to the writer as one topic) or a custom category; `togglePick` holds the rules (Mixed bag stands alone, taking one category off a picked group keeps the rest, picking a whole group one by one becomes the group, `MAX_TOPICS` 8). **Two bands, Kids (8 to 13) and Grown-ups, plus Family mix** (`LEVELS`), 2026-10-21; Little ones and Quiz buffs were dropped. Saved games are `v: 2`; older ones are ignored.
- **Custom categories are objects** `{id, name, description, emoji}` (`lib/quiz/catalogue.js`): on the account (`/api/quiz/categories`) when signed in, on the device otherwise. Old `"Name: description"` strings are read and rewritten.
- **Multi-phone is polled, not streamed.** Each client polls `GET /api/quiz/live/[code]?v=` once a second; the server answers `same` when nothing changed, and applies the clock on every poll (`lib/quiz/live.js#change`), so the game moves on even if the host's phone goes quiet. Every write is read-apply-write guarded by `version`, retried on a clash, so answers that arrive together all count. Answer times are measured on the server. A phone is sent only the question on screen, never the answer or anyone else's pick while it is open (`project`).
- **History**: finished quizzes for a signed-in player, `GET/POST /api/quiz/history`; delete is `DELETE /api/games/:id`.

## Darts

Rebuilt 2026-10-21 (`REDESIGN-PLAN.md`, Phase 4): you tap the board where each dart landed. X01 (with legs, double-in and double-out), Cricket, Around the Clock and Killer.

- **One set of rules, `lib/darts/rules.js`**: a match is its setup plus a log of throws (`{n, m}` per dart, or `{t}` for an X01 visit typed as a total), and `replay(match)` works out everything else: scores, whose turn, legs, the winner, standings with shared places, stats, and the `events` the last throw caused (bust, checkout, 180s via `visit`, killer, out). Undo is popping the log, so it works after a bust, across legs and after the winning dart. Moves (`throwDart`, `enterTotal`, `endTurn`, `undo`) return a new match.
- **The board, `components/darts/Dartboard.jsx`**: SVG, a "big-target" board: trebles, doubles and bull much wider than a real board's, taken from the inner single (`lib/darts/board.js#RINGS`). A press zooms the board ×2 around the finger inside a round window (a CSS scale on the SVG, origin at the press, so the point under the finger stays put and `getBoundingClientRect` keeps the hit maths right mid-zoom); the region lights, its name floats above the finger (HTML, outside the zoom), slide adjusts at half speed, lift scores; sliding off the window scores nothing (Miss is a button). It dims numbers that do not count, lights the checkout route (`lib/darts/checkout.js`: the chart for three darts, a search for fewer or for single-out) and marks Killer's numbers.
- **Saving, `components/darts/store.js`**: the match goes to the device after every dart (`darts:match`), so a reload offers "Carry on"; a signed-in player's goes to `/api/games` a moment later as `dartsConfig.match`, one save at a time. Games saved by the old scorer have no `match`; they are listed for deleting only.
- **The caller**, `components/arcade/caller.js`: `speechSynthesis` in en-GB calls each X01 visit, "One hundred and eighty!", bust and game shot. It follows the mute switch.
- The backdrop `public/darts/wall.webp` is Higgsfield (job id in `components/darts/ui.jsx`).

## Travel Bingo Flow

1. Host creates game (`POST /api/games/travel-bingo/create`) → gets join code.
2. Cars join (`POST /api/games/travel-bingo/[id]/join`) — each car is a sub-document on `Game.travelBingoConfig.cars`.
3. Each car submits suggested items (`submit-items`).
4. Host triggers `generate` to build per-car bingo cards from the merged pool.
5. Cars mark tiles found via `mark-tile`.
6. Cars can comment on each other's finds.
7. First to complete becomes `winnerCarId`.

Helpers in `src/lib/travelBingo.js`: `generateJoinCode`, `generateId`, `findCar`, `isHost`, `carCompletion`. Uses `crypto.randomInt` with a confusable-char-free alphabet.

## Egypt Explorer

A family game for days out on a holiday to Egypt, one **trip** at a time. Two
trips so far: the **Grand Egyptian Museum** (`gem`) and the **Pyramids of Giza**
(`giza`). Each has nine stops, each with a gallery of photos, a story, things to
look for, "did you know" facts, a photo quest and a quiz. **Everyone plays every
stop for themselves**: each person's quiz earns their own stamp, each person's
photo quest their own points. The family's rank counts a stop once somebody has
answered each of its questions. Pitched at 10 to 14 year olds and their
parents. Route `/games/egypt-explorer` asks for the family (once), then who is
playing on this phone, then opens a trip picker; `?trip=<id>` opens a trip and
`&stop=<id>` a stop (in the URL so the phone's back button walks back). A bare
`?stop=` link opens the GEM, from before there were two trips.

- **Content is data, written and fact-checked by hand.** `src/data/egypt/gem.js`
  and `giza.js` hold every story, fact, quest and question, with the sources and
  reasoning in each header, plus what the guide is told about the setting
  (`setting`, indoors or out). Nothing on a card is AI-written at play time. A
  new trip (Luxor, a Nile day) is a new data file plus one line in
  `src/data/egypt/index.js`; the screens do not change. `trips.test.js` checks
  every trip: answers in range, every photo key real, one hieroglyph stamp per
  stop, enough stops for the top rank, map pins for every stop.
- **A stop's `kind` adds an activity**: `cartouche` (your name in hieroglyphs,
  GEM), `scale` (how many of you stacked up to reach the top of the Great
  Pyramid, `HowBig.jsx`) and `builder` (blocks a day for a chosen build time,
  `PyramidMaths.jsx`). A trip with a `map` (Giza) gets a schematic plan with a
  pin per stop (`TripMap.jsx`), in metres from the Great Pyramid, north up.
- **The family, and who is playing.** The family is one list for every trip,
  on the phone and, signed in, on the account (`EgyptFamily` model,
  `/api/egypt/family`, `hooks/useEgyptFamily.js`; newest edit wins). Each
  phone remembers which of them is holding it (`gamepad:egypt:me`), shown in
  the header on every screen (`PlayerSwitch.jsx`, via `GameShell`'s
  `headerAside`); tap it to hand the phone over. A player's id is made from
  their name (`progress.js playerId`), so phones agree on ids without talking,
  and **renaming someone starts them afresh**. An account that played before
  the list existed gets one worked out from its latest trip.
- **Photos are hotlinked from Wikimedia Commons**, at Commons' 960px thumbnail
  size, listed in `src/data/egypt/photos.js` (one list for every trip, so a trip
  can borrow another's photo) with caption, photographer and Commons page. Not
  copied into `public/`: about 30 MB would sit in git.
  **"Get ready" on the trip screen saves that trip's photos on the phone** (Cache API,
  `components/egypt/useOfflinePhotos.js`), and `public/egypt-sw.js`, a service
  worker scoped to `/games/egypt-explorer` only, serves them from that cache, so
  the stops work without signal. The two share the cache name; change both.
  The CSP's `connect-src` allows the two Wikimedia hosts for that fetch.
- **State is one plain object per trip** (`lib/egypt/progress.js`, which owns
  every rule and is unit-tested), version 2: `play[playerId][stopId]` holds
  each person's answers, quest and ticks. **Points are never stored**: they are
  derived from that record, so totals cannot drift. `hooks/useEgyptProgress.js`
  keeps it in localStorage always and, signed in, in a `Game` document
  (`gameType: 'egypt-explorer'`, `egyptConfig.{trip, progress}`) via
  `/api/egypt/progress`. That is the save contract: guest = this phone, signed
  in = the account.
- **Several phones play on one account at once, so saves MERGE, never
  overwrite** (`mergeProgress`: answers and quests added together, the first
  answer to a question standing, ticks from whichever copy changed last). The
  route merges each save into the stored copy under an optimistic `rev` check
  and returns the result; each phone merges that back, and refreshes every 30
  seconds while a trip is open, so everyone's points move during the day.
  Because a merge only adds, **there is no "start the trip again"**: a reset on
  one phone would come straight back from the others.
- **Version 1** (the GEM's first day, 2026-10-19) kept one answer per question
  for the whole family. `upgrade` moves each answer and quest to whoever gave
  it, so their points stand and everyone else can still play that question;
  its "look closely" ticks had no owner and stay in `shared`, counting to the
  family total only. The original is kept in `egyptConfig.v1Backup` and in
  localStorage under `gamepad:egypt:<trip>:v1`. The route also accepts a v1
  save, from a phone still running the old page.
- **Everything is open to guests, the AI parts included.** Ask the guide
  (`/api/egypt/guide`: a question, a photo, or both, with the current stop as
  context) and photo quests (`/api/egypt/quest`: Claude judges the photo against
  the stop's `quest.target` and returns JSON). Both go through `@aspiro/ai`'s
  `callClaude` on the `egyptGuide` workload (the `balanced` tier, because
  naming a statue from a photo is the whole job), and both count against a
  **durable budget** (`lib/egypt/ai.js`, Mongo `RateLimit` collection with a
  TTL index), per account when signed in and per IP otherwise: guide 60/hour
  150/day, quests 40/hour 80/day, 200/day across both. A site-wide ceiling
  (1,500/day, every caller together) bounds the bill on a public URL, since
  there is no sign-in to stop a script. Prompts live in `lib/egypt/ai.js`.
- **Photos are shrunk on the phone and never stored.** `lib/egypt/photo.js`
  draws them to 1280px JPEG before upload (a raw phone photo is over Vercel's
  request limit); the routes accept up to 6 MB. The camera is a file input with
  `capture`, so no camera permission is needed and `Permissions-Policy:
  camera=()` stays as it is.
- **A quest counts only when the guide accepts the photo.** A parent could
  count one it turned down ("We found it really", stored as `override`) until
  2026-10-20, when it was taken out. `normalise` drops any quest an override
  counted, so those points went from every trip on every phone and the server
  at once, the stored record clears on its next save, and the player can find
  it again with a real photo. Don't remove a find in the database alone: a
  phone's old copy would merge it straight back.
- **Hieroglyphs need a font**: Noto Sans Egyptian Hieroglyphs, loaded in
  `components/egypt/fonts.js` and applied by `style` (not a CSS variable on a
  wrapper) because the passport and guide are portalled sheets.
  `lib/egypt/hieroglyphs.js` is the cartouche alphabet; every code point was
  checked against Unicode's data.
- Colours: `game-egypt` (gold into lapis) for the tile, and `papyrus`, `lapis`
  and `gold` tokens used only under `components/egypt/`.

## Claude AI

`/api/claude` caches by base64-truncated prompt key in `CachedResponse`. No streaming. Quiz questions come from `/api/quiz/questions` (see Quiz); `/api/claude` now serves only Scrabble's word check. Travel Bingo's `generate` route calls the SDK directly. **Egypt Explorer is the one game that calls Claude during play** (see above), through `@aspiro/ai/server` with its own durable budget, and with no sign-in. Models per workload are in `src/lib/aiModels.js` (`@aspiro/ai` v0.7.0).

## UI Conventions

- Tailwind against the token layer above. **Prefer tokens over raw palette
  classes** (`bg-brand`, not `bg-orange-600`) in anything new or touched.
- Existing game screens still hardcode orange/amber/teal inline — that is the
  debt Phases 5-8 clear, game by game. Don't bulk-rewrite them ad hoc.
- Icons: `lucide-react` for **UI affordances** — back arrows, the settings gear,
  the close button. Those must read as controls and carry an `aria-label`.
- **The game emoji on the launcher are deliberate and are not icons.** They
  are illustration. A pass replaced them with flat monochrome lucide glyphs and
  the launcher stopped looking like a games app — a family game launcher wants
  the colour and depth that platform emoji already have. Don't "fix" them back.
- **No meta pills on the launcher tiles.** Player counts and category counts were
  tried and removed: clutter on a short launcher, and nobody picks between
  Darts and Travel Bingo on player count.
- Mobile-first. The phone gets passed around a table: primary actions belong at
  the bottom, nothing may depend on hover, and touch targets are 44px minimum.
- Each game owns its component folder under `src/components/<game>/` — no
  cross-game sharing beyond `ui/` and the headers.

## Gotchas

- **One header: `layout/AppHeader.jsx`.** `Header.js` and `ProfessionalHeader.js` were near-identical duplicates and are deleted. Don't add a second. Its account menu is a bottom **sheet**, not a dropdown — this phone gets passed around, and a hover-anchored menu is meaningless on touch. **The email address is deliberately not in the header bar**; it lives one tap inside the sheet.
- **`src/pages/api/quiz/...` uses `@/...` absolute imports**, but some other files use relative paths (`../../../lib/mongodb`). Both work via `jsconfig.json` baseUrl=src.
- **`Game.gameType` enum is the source of truth** for which sub-config is populated. Polymorphic doc — be careful with mass projections.
- **The viewport meta is declared once, in `_app.js`.** Seven pages each carried their own copy, which overrode it (next/head dedupes by name, page wins) and would silently drop `viewport-fit=cover`. Don't reintroduce a per-page one.
- **`.eslintrc.json` is minimal** — lint is permissive.
- **Tests are `vitest` and cover `src/lib/` and `src/data/egypt/`** — the quiz room state machine, the scoring formula, and Egypt Explorer's progress rules (merging several phones' saves, upgrading version 1), hieroglyph spelling and every trip's data. No CI, no component or end-to-end coverage. `npm test`.
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
- 2026-10-19: **Egypt Explorer** added, the fifth game: the Grand Egyptian Museum trip, AI guide and photo quests; `@aspiro/ai` pin moved v0.1.0 → v0.7.0
- 2026-10-19: Egypt Explorer's second trip, **the Pyramids of Giza**, with a trip picker, a plateau map and two new activities
- 2026-10-19: Egypt Explorer: **everyone plays every stop for themselves**, a family list for every trip and phone, who is playing in the header, and saves merged across several phones on one account (progress version 2; today's GEM record upgraded with every point kept)
- 2026-10-20: Egypt Explorer: **no more "We found it really"**; a photo quest scores only when the guide accepts it, and the points from every find a parent counted were taken off
- 2026-08-27: **Phase 1** landed — migrated to `@aspiro/auth` v0.7.1; email/password added alongside Google; GamePad is no longer the suite's odd one out
