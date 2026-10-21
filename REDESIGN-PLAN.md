# GamePad — the toy-box arcade rebuild

**Status:** agreed with Ash 2026-10-21. Phase 1 (Travel Bingo) live 2026-10-21.
Phase 2 (the games room) live 2026-10-21. **Quiz moved up to Phase 3** at
Ash's request (it was last), live 2026-10-21. Phase 4 (Darts) built 2026-10-21.
Phase 5 (Scrabble) built 2026-10-21; Egypt Explorer, lightly, is last.
**Replaces** the August realignment plan, which is finished (every phase landed
2026-08-27; it is in git history at `934d2e5:REDESIGN-PLAN.md`). The decisions
from it that still bind are carried forward in §6.

## 1. Why

The August pass realigned GamePad with the suite and **recoloured** the four
older games without touching their structure, on purpose. They are still the
original screens: every game is a scorer that behaves like a form. You type into
boxes, there is no sound, almost no motion, and nothing marks a big moment (a
180, a checkout, a full house, a win). The landing page is a list of five
gradient cards.

Egypt Explorer is the one Ash loves, and it shows why: it has **its own world**
(photos, colours, a hieroglyph font), **progression** (passport, stamps, ranks,
a family scoreboard) and **a moment at every stop**. That is the bar for the
rest. Not its look; its sense of being a game.

The rule code is mostly worth keeping; the screens are not. A review on
2026-10-21 also found real defects, listed per game below, which each rebuild
fixes on the way through.

## 2. Ash's decisions (2026-10-21)

| Question | Decision |
|---|---|
| Look | **Toy-box arcade**: bright, chunky, tiles that look like toys and bounce and wobble. Not a dark neon cabinet. |
| Landing layout | **Every game visible at once, no swiping.** Then, from the mock-ups: **a games room** where each game is an object (Phase 2). |
| Quiz | **Three modes** (Ash, 2026-10-21): **solo** (one player, on their own); **shout** (one screen shows the question, everyone shouts, the quizmaster taps who got it right); **multi-phone** (everyone answers on their own phone). Plus a **TV mode**. |
| Quiz difficulty | Chosen **per game**, by age and difficulty. **Everyone in a game gets the same questions.** |
| Quiz resume | **Kept, and made reliable**: a lost connection, a reload or a dropped phone must not lose a game in action. Signed-in players can **delete old games**. |
| Quiz look | **A game show**: studio, lights, stings, fanfares. Higgsfield for the art. Upgraded massively, Ash's word. |
| TV mode | **Quiz only.** Not Darts. |
| Sound | **On by default, with a mute switch** that is remembered. Vibration where the phone supports it. |
| Games | All five stay. |
| Order | **Travel Bingo first**, because it is in use in the car now. |
| Brand colour, icon, share card | **Open.** The current set is built on `#EA580C`; decide when the landing page is designed. |

## 3. The arcade kit (`src/components/arcade/`)

Built **as each game needs it**, never ahead of a call site (the August plan's
rule: a primitive designed without a call site is a guess). Travel Bingo pulls
in the first pieces.

- **Toy-box tokens:** chunky radius, a hard "toy" shadow under every tile so it
  looks pressable, bright per-game colours on a warm light ground, a display face
  with more character than Outfit. Set in Phase 1, applied to the landing page in
  Phase 2.
- **Motion:** `motion` (Framer Motion) for springs, layout moves (rows
  overtaking each other) and enter/exit. Every animation respects
  `prefers-reduced-motion`.
- **Celebrate:** `canvas-confetti` plus a fanfare, one call. Bigger for a win
  than for a line.
- **Sound:** effects made in code with the Web Audio API (no audio files, nothing
  to license or download). One `sfx` module, a mute toggle in the header,
  remembered in `localStorage`. Browsers block sound until the first tap, which
  the first tap of any game provides.
- **Haptics:** `navigator.vibrate` where it exists (Android). iOS Safari has none,
  so it is never the only feedback.
- **Banner:** a big animated message across the screen ("LINE!", "Your go,
  Priya", "The Smiths spotted a red tractor").
- **Counter:** a score that rolls up like an arcade counter.
- **Podium:** the winner moment, shared by every game.
- **Guest saves:** a guest's game kept in `localStorage`, so a refresh no longer
  loses it (Scrabble and Darts lose it today).

## 4. Phases

Each game is rebuilt the same way: **pull its rules into a pure, tested module
first** (as Quiz's scoring and room logic were in August), then build the new
screens on top. Tests written before describe what the game did; tests written
after describe whatever the rebuild left behind.

### Phase 1 — Travel Bingo *(first: in use now)*

Keep: all 8 API routes, `lib/travelBingo.js`, the `travelBingoConfig` schema,
the AI card generation and its fence-stripping parser, the server win check.

Rebuild:
- **One tap marks a tile**, at once on screen (optimistic), with an ink-stamp
  splat, a thunk and a buzz. A failed mark rolls back and says so.
- **Lines:** each row, column and diagonal flashes **LINE!** on the way to the
  full house, which gets the full celebration.
- **Convoy race:** the scoreboard is a road with each car moving along it. When
  the poll brings in another car's find, a banner slides in with a honk.
- **Faster setup:** ready-made packs (motorway, countryside, town) as tappable
  chips instead of typing every item, with typing still there for your own.
- **Fixes:** a game stuck on "generating" when the AI times out (it can never
  recover today); a failed mark that shows nothing; the "Spot it, snap it" copy
  for a photo feature that no longer exists; the tile panel moved onto the
  shared Radix sheet.

To decide during the phase, not before: whether one car can play on its own
(today it needs two), and whether line wins score.

**Known security defect, fixed in this phase:** a game's public GET returns
every car's `userId`, and a guest's id is what `resolvePlayer` accepts from the
request body, so anyone in a game can act as another guest car (mark its tiles,
or generate as host). The serializer must stop returning ids.

### Phase 2 — Landing page: the games room

Three tile-grid mock-ups were shown, then Ash asked for a room instead, and a
clickable mock-up of it settled it: **one painted room in a soft 3D toy style,
every game an object in it.** The plane is Travel Bingo, the dartboard Darts,
the TV the Quiz (its TV mode's screen), the map with the gold pyramid Egypt
Explorer, and the cupboard opens onto shelves of board-game boxes (Scrabble,
and room for more). Tap an object and the camera pushes in; a card rises with
that game's choices.

Ash's calls on the mock-up: **nothing drawn over the picture.** Name labels
show for a few seconds on arrival and when the empty room is tapped, then fade.
**Carry on, new and join live on each game's card**, not on the room. Sign-in is
the account button in the corner and a line on each card for a guest.

The plane, a dart and the TV screen are layered over the picture so they move:
the plane sways on its strings, a dart lands in the board now and then, the TV
cycles through the quiz's answer shapes. Where the art came from is in
`src/data/gamesRoom.js`. The brand colour stays: the wordmark is ink and orange
on the room's ceiling.

### Phase 3 — Quiz, with TV mode *(moved up from last, 2026-10-21)*

The decisions are in §2. Built in this order: the question engine and the
shared rules first (the parts everything else rests on), then the screens,
then TV mode. The detail below is from the first review; the 2026-10-21 look at
question creation added: questions are generated in the browser and sent
through the open `/api/claude` proxy on the fastest model, parsed out of free
text with a regex, never validated (count, distinct options, answer index),
never shuffled (so the answer's position is the model's habit), never
de-duplicated across games; custom categories are strings like
`custom:Name: description` that a colon breaks, saved only for signed-in
players, with no edit, and the picker is written twice (setup and next round).

Keep: `quizScoring.js` and `quizRoom.js` with their 34 tests, the `QuizRoom`
model, the safe projection that hides the answer until reveal, auto-advance,
custom categories.

Rebuild:
- **TV mode:** the host screen on a laptop or TV — big question, dramatic timer,
  "answers in" counter, reveal sting, race-bar leaderboard. Join by **QR code**.
- **Phones as buzzers:** four giant shapes, personal "+850, three in a row"
  feedback, haptics.
- **One phone, fairly:** players take turns with their pick hidden, in place of
  four tiny answer zones everyone can see.
- **Instant start:** a ready-made question pack plays at once while the AI writes
  more in the background.
- **The prompt moves to the server**, so `/api/claude` stops being an open proxy.

Fixes: saved quizzes cannot be resumed (a save replaces `quizConfig` and wipes
the questions); multi-device games never reach history; the room state machine
exists but nothing enforces it, and answer times come from the client; answers
can be lost on concurrent saves; a guest's leaderboard shows every household's
names; the SSE stream polls Mongo every second and the join page opens two.
Replace the 1,393-line `index.js` and the duplicate join flow with one host and
one player path.

### Phase 4 — Darts

Keep: the checkout chart and rules text (`dartsConstants.js`), `getCheckout`,
the Cricket marks and points rules (pulled into one pure reducer that undo
replays; it is written twice today), the `dartsConfig` shape.

Rebuild: **tap the dartboard** (segment, then ring) instead of typing; three
dart slots fill as you throw; the suggested checkout lights up on the board; a
spoken "ONE HUNDRED AND EIGHTY!" (`speechSynthesis`); a buzzer and shake on a
bust; Killer lives as hearts; scores large enough to read from the oche.

Fixes: **Cricket never saves for a signed-in player** (its darts are objects;
the schema says `darts: [Number]`, so the save is rejected and the 500 is never
shown); Killer and Clock turn fields dropped on save; double-in not enforced;
undo after a won leg; the game-over screen always crowning row 0; the progress
bar assuming 501.

### Phase 5 — Scrabble *(built 2026-10-21)*

Keep: `lib/scrabble.js` (standings with shared places, turn extremes, next
player), the single write path, `/api/games`.

Rebuild: tile-style number entry; the total rolling up; rows overtaking each
other with an **OVERTAKE!** banner; a **+50** key for using all seven tiles; a
big undo for the last score; a pass-the-phone card; a podium with awards (best
word, wooden spoon) at the end, where today there is no end screen at all.
Word challenge from a bundled word list, instant and offline, in place of the
Claude call.

Fixes: editing a turn can save the wrong value over another (uncontrolled
inputs keyed by position); out-of-order saves; the word sent to Claude
unescaped.

As built: Ash said to redesign it freely, with no backward compatibility, so
old games are not read. `lib/scrabble.js` was replaced by `lib/scrabble/rules.js`
(a match and a log of turns, everything derived by `replay`, as Darts). Turn
editing is gone; undo pops the last turn, which is what fixes the wrong-turn
bug. Saves go one at a time per match (`components/scrabble/store.js`), which
fixes the out-of-order saves. The word check is the ENABLE list bundled in
`public/scrabble/words.txt`, so `/api/claude`, its last caller gone, was
deleted with `CachedResponse` and the unused `ClaudeChat`.

### Phase 6 — Egypt Explorer, lightly *(done 2026-10-21)*

It keeps its own world. It takes the new launcher tile and the shared
celebrations, and nothing else changes.

As built: `components/egypt/moments.js` plays the kit at Egypt's real moments
(an answer, a look-closely tick, a quest accepted, a stamp, a new rank, the
last stamp of a trip), with a mute switch beside who is playing. It had no
celebration code of its own to replace. On the home screen it is World
Explorer, whose front page (`/games/world-explorer`, places in
`data/worldExplorer.js`) goes straight to Egypt until a second place exists.

## 5. Verifying

Ash starts the dev server; sessions do not. `next build` fails on this Windows
machine for every Next 15 app, a machine fault, not a code one. Each phase:
lint, the tests, then Ash on his own phone. A game Ash is about to use can go to
a **Vercel preview** from a branch first, on his go, so it is tried before it
reaches the live site.

## 6. Carried forward from the August plan

- **Guest play is real play.** No wall; signing in is an upgrade, below the
  games.
- **The phone gets passed around.** Primary actions at the bottom, nothing
  depends on hover, whose turn it is must read across a table, no personal data
  in the chrome.
- The mobile mechanics stay: `touch-action: manipulation`,
  `overscroll-behavior: contain`, safe-area insets, 44px targets, wake lock
  during play.
- Tailwind classes are never interpolated (`text-${tone}` generates nothing);
  use explicit maps.
- The `@aspiro/auth` content entry in `tailwind.config.mjs` stays, or the
  sign-in dialog renders invisible.
- Nothing is pushed without Ash's go.
