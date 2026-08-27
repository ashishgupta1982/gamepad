# GamePad — Realignment & Redesign Plan

**Status:** proposed, awaiting go-ahead
**Written:** 2026-08-27

Two jobs in one pass:

1. **Realign** GamePad with the Aspiro suite so it can move as one with CookBook,
   ChessMaster, RunCoach, DoIt, MoneyHub and Tutor App.
2. **Redesign** it mobile-first, because it is used on phones, passed around a
   table, and the current UI was built desktop-first from a generic skeleton.

`aspiro-auth/README.md` lists GamePad in its "Out of scope" table with one word:
**deferred**. This plan is that deferral being paid off.

---

## 1. The guest → sign-in question, answered

**There is no adoption today, and there is no code that could do it.**

`src/pages/games/travel-bingo/index.js` holds the only identity logic in the app:

```js
function ensureUserId(session) {
  if (session?.user?.email) return `user:${session.user.email}`;
  // else: localStorage 'travel-bingo:guestId' -> `guest_xxxx`
}
```

When a guest signs in, `ensureUserId` simply starts returning a different string.
The previous `guest_…` id is still in `localStorage`, still attached to whatever
they played, and nothing ever looks at it again. Their games are silently
orphaned rather than migrated.

So the simpler rule you proposed — **saving starts at sign-in** — is already the
de-facto behaviour. We are not removing a feature; we are **stating an accidental
behaviour as an intentional one** and making it honest in the UI:

> Guest play is real play. Nothing is saved until you sign in, and we say so
> before the game starts rather than after it ends.

That is the whole decision. No migration code, no adoption prompt, no edge cases.

---

## 2. What is actually wrong

Measured, not assumed. GamePad is **~12,600 lines**, ~9,000 of it game UI.

### 2.1 Suite alignment

| Gap | Evidence |
|---|---|
| No `@aspiro/auth` | `[...nextauth].js` is hand-rolled, **Google only**, no email/password |
| No `lib/brand.js` | Suite convention: a no-imports file shared by email templates + dialog accent |
| `User` model missing `authFields` | `src/models/User.js` has five fields, none of them auth |
| `rateLimiter.js` | Defines `getClientIP` at line 45 but **never exports it**; no `AUTH_API` bucket |
| No `/reset-password`, `/verify-email` | Password-reset emails would 404 silently |
| `Game.userId` keyed on **email** | While `quiz/rooms` and `quiz/stats` use `session.user.id` — inconsistent within GamePad itself |

**GamePad is the easiest of the seven migrations.** Trap #10 in the auth README
("every app has a different way of eating the emailed links") does not apply
here: `_app.js` has no auth gate, no redirect and no `noLayoutPages` list, and
there is no `middleware.js`. Nothing will swallow the email links.

### 2.2 Design debt

| Problem | Evidence |
|---|---|
| **Dead palette** | `tailwind.config.mjs` defines a deep-blue skeleton palette (`#2d3f7b`) that no component uses. The real UI hardcodes orange/amber/teal everywhere. |
| **Config bug** | `tailwind.config.mjs` declares `background` **twice** in one object literal — `'#f0f9ff'`, then `hsl(var(--background))`. The first is silently dead. |
| **Two headers** | `Header.js` and `ProfessionalHeader.js` both live. `/signin` and `/settings` use one; all five other pages use the other. |
| **Desktop-first header** | `max-w-7xl px-6 py-4`, a **hover-positioned dropdown**, and the user's **email address rendered into the nav bar**. On a phone that is wasted height and a privacy leak when the device is passed over. |
| **No mobile nav** | Nothing at the bottom of the screen. Every primary action is top-of-screen, i.e. out of thumb reach. |
| **Emoji as icons** | The launcher tiles are `🎲 🧠 🎯 🚗`. `lucide-react` is already a dependency and goes unused on the landing page. |
| **No shell** | `_app.js` renders `<Component />` bare. Every page re-implements its own layout. |
| **Three UI primitives** | `alert`, `button`, `card` — 122 lines total. Everything else is bespoke inline Tailwind. |
| **Stale `CLAUDE.md`** | Documents Cloudinary photos, `src/config`, `src/context`, `cloudinaryUpload.js`, `cloudinary-signature.js`. **None exist** — the photo feature was removed in `60ad439`. |

---

## 3. Design direction

Run through `ui-ux-pro-max`. Its first-pass generated system was **rejected in
part**, and the reasoning is recorded here so it is not silently re-litigated:

| Generated | Verdict |
|---|---|
| Pattern: *App Store Style Landing* | ✗ **Rejected.** GamePad is not a download. Screenshots-and-star-ratings is a pattern for convincing strangers to install something; our landing page's job is to get a family into a game in one tap. |
| Style: *Y2K Aesthetic* (neon pink, chrome, iridescent) | ✗ **Rejected.** Wrong audience entirely, and flagged "⚠ Check contrast" — bad for a screen being read across a table. |
| Style: *Tactile Digital / Deformable UI* | ✓ **Adopted.** Jelly press-deformation, spring bounce-back, haptic-like feedback. Rated best-for "gaming UI, modern mobile apps". The right register for a game app driven by thumbs. |
| Type: *Baloo 2 / Comic Neue* | ✗ **Rejected.** Comic Neue is a poor body face at small sizes. |
| Type: *Soft Rounded* — Varela Round / Nunito Sans | ✓ **Adopted.** Friendly and rounded without being childish; Nunito Sans is a genuinely good body face. |
| Palette: indigo `#4F46E5` + orange CTA `#F97316` | ~ **Partly.** Keep the structure; keep GamePad's existing rust/teal identity. `theme_color` is already `#EA580C`, and the icons, OG card and manifest are all built around it — changing the brand colour would invalidate the brand pass (`c4f1c91`). |

### 3.1 The principle that drives everything

> **The phone gets passed around.**

That single fact decides most of the layout:

- **Primary actions live at the bottom.** One-handed reach. The current design
  puts everything at the top.
- **Nothing may depend on hover.** A device being handed over has no hover state.
  The current header dropdown is hover-positioned.
- **Whose turn it is must be unmissable** — readable at arm's length, across a
  table, by someone who has just picked the phone up.
- **No personal data in chrome.** The email address comes out of the nav bar.
- **Score entry is the hot path** in three of four games (Scrabble, Darts, Quiz).
  One shared numeric keypad is the highest-leverage component we build.

### 3.2 Non-negotiable mobile mechanics

Cheap to add, and their absence is exactly what makes the app feel clunky:

- `touch-action: manipulation` — kills the 300ms tap delay.
- `overscroll-behavior: contain` — stops pull-to-refresh **binning a live game**
  when someone taps scores near the top of the screen. A real hazard today.
- `env(safe-area-inset-*)` — the bottom bar must clear the iOS home indicator.
- Minimum **44×44px** touch targets, **8px** minimum gap.
- **Screen wake lock during play.** CookBook already does this in `_app.js` for
  cook mode — steal it. A darts leg should not blank the screen mid-throw.
- `prefers-reduced-motion` respected on every spring animation.

---

## 4. Phases

Ordered so each phase is independently shippable and de-risks the next.

### Phase 0 — Foundation & cleanup ✅ **DONE** (2026-08-27)

*Small, mechanical, unblocks everything.*

- ✅ Deleted the stray 0-byte `next` file (TODO.md item 1, flagged for months).
- ✅ Fixed the duplicate `background` key in `tailwind.config.mjs`.
- ✅ Replaced the dead skeleton palette with real design tokens (rust/teal, kept),
  plus per-game identity colours and a `card-foreground` token — `card.jsx` had
  always asked for `text-card-foreground`, but it was never defined, so the class
  generated nothing.
- ✅ Wired the display + body faces via `next/font/google`, set on `:root` rather
  than a wrapper element so portalled dialogs resolve them.
- ✅ Added the §3.2 mobile mechanics to the `globals.css` base layer, and
  `viewport-fit=cover` to the viewport meta.
- ✅ Rewrote `CLAUDE.md` to match reality (dropped Cloudinary, `src/config`,
  `src/context`, and a `cloudinary-signature.js` route that does not exist).
- ✅ Resolved TODO.md item 2 — `/api/claude` now derives its `X-RateLimit-*`
  headers *and* its 429 body from `RATE_LIMITS.CLAUDE_API`, so the advertised
  limit cannot drift from the enforced one again.

**Two deviations from this plan, both deliberate:**

1. **Fredoka, not Varela Round, for the display face.** Varela Round ships a
   single 400 weight. A scoring app needs weight contrast between a player's
   name and their score, so the skill's recommendation would have forced fake
   bolding or a second family. Fredoka is the same friendly rounded geometry
   with a real 300–700 range. Nunito Sans for body is unchanged.
2. **The viewport meta was deduplicated.** Not in the original scope, but seven
   pages each carried their own copy, and `next/head` dedupes by name with the
   *page* winning — so `viewport-fit=cover` set only in `_app.js` would have been
   silently overridden on every route, and the safe-area insets would never have
   resolved. It is now declared once, in `_app.js`.

**Verified:** lint clean (two pre-existing `<img>` warnings in the headers Phase
2 replaces); all eight routes return 200 on the dev server with no compile
errors; tokens and every new utility confirmed present in the compiled
stylesheet, with `<alpha-value>` wiring correct so `bg-brand/10` works.

### Phase 1 — Shared auth (`@aspiro/auth`) ✅ **DONE** (2026-08-27)

*Mechanical. Follow the README's eleven traps literally.*

**Landed as specified.** GamePad is no longer the suite's odd one out — the
package's "Out of scope: GamePad (deferred)" line is now stale.

Trap-by-trap outcome, since these are the parts that fail silently:

| Trap | Outcome |
|---|---|
| 1 — Tailwind must scan the package | Added. **Verified**, not assumed: the compiled stylesheet grew 79.4 KB → 86.2 KB from that glob alone, and `.sm\:max-w-md` (used only by the dialog) is present inside its media query. |
| 2 — `transpilePackages` | Added. |
| 3 — unresolved peers pass lint, fail deploy | Installed `bcryptjs`, `jsonwebtoken`, `cookie`, `@radix-ui/react-dialog`. **All nine bare imports resolved via `require.resolve` before committing** — lint does not do this. |
| 4 — auth gate eats the emailed links | Not applicable, and confirmed so: no `middleware.js`, no signed-out redirect in `_app.js`, no bare-pages list. GamePad was the easiest of the seven for exactly this reason. |
| 5 — `/signin` is load-bearing | Kept and rebuilt around `SignInDialog`. It now reads `?error=` and maps NextAuth's codes to real sentences — nothing read that before, so a failed provider sign-in was a silent no-op. |
| 6 — brand in its own file | `src/lib/brand.js`, no imports. |
| 7 — no `file:` linking | Pinned to the `v0.7.1` tarball, matching all six sibling apps. |
| 8 — the second app audits the first | Nothing to send back; `verifyNote` carries GamePad's own copy. |
| 9 — provisioning belongs in `onSession` | N/A — GamePad's callback only decorates. It returns early on `enrichFailed`. |
| 10 — env var names | **Checked before installing.** The package expects `GOOGLE_ID` / `GOOGLE_SECRET`, which is exactly what GamePad already had, so Google sign-in was untouched. |
| 11 — don't promote an app's local fix | Nothing promoted. |

**Beyond the checklist:**

- Removed the duplicate `getClientIP` from `/api/claude`. It only existed because
  the copy in `rateLimiter.js` was never exported — which is the same fact trap 3
  is about.
- `User.name` is deliberately **not** `required`. With `requireName: false` the
  package falls back to the address local-part, and a required field would have
  rejected that write and broken sign-up from the inside.
- Added `.env.example` and opted it out of the blanket `.env*` ignore, because
  the new email vars fail silently when missing and the list needs to live
  somewhere a new machine can find.
- Confirmed nothing depended on the old session shape: the previous callback set
  `session.userId`, which **no code in the repo ever read**. The five real
  readers all use `session.user.id`, which the package sets.

**Verified:** lint clean; `/`, `/signin`, `/signin?error=…`, `/reset-password`,
`/verify-email`, `/settings` and the game routes all 200; the six auth routes
return 405 to a GET (handler mounted, method-guarded) rather than 500;
`/api/games` and `/api/user` still 401 unauthenticated.

> `/api/auth/providers` lists **only Google**, and that is correct — email/password
> is a custom DB-session route, not a `CredentialsProvider`. Don't "fix" it.

**Still outstanding, needs Ashish:** `RESEND_API_KEY` + `EMAIL_FROM` in Vercel.
Without them the package logs verification/reset links to the server console and
carries on, so email silently never arrives in production. Local dev is fine.

- `npm i @aspiro/auth` — pin a tag, as the rest of the suite does (**not** `file:`, trap 7).
- `next.config.mjs` → `transpilePackages: ['@aspiro/auth']` (trap 2).
- `tailwind.config.mjs` → add `'./node_modules/@aspiro/auth/src/**/*.{js,jsx}'`
  to `content` (trap 1 — skip it and the dialog renders **invisible**, with nothing
  erroring and nothing warning).
- `src/lib/brand.js` — no imports (trap 6).
- `src/lib/auth.js` — one `createAuth({...})` call. `requireName: false`
  (GamePad is casual; fall back to the email local-part, as ChessMaster does).
- Seven route re-exports: `[...nextauth]`, `login`, `register`, `verify-email`,
  `forgot-password`, `reset-password`, `resend-verification`.
- `User` model — spread `authFields` from `@aspiro/auth/model`.
- `rateLimiter.js` — **export** `getClientIP`, add the `AUTH_API` bucket
  (10 per 15 min per IP). Add to the existing file; do not replace it.
- New pages `/reset-password` and `/verify-email` — the package generates those
  URLs, so the app must serve the pages, or the emailed link 404s silently.
- Rebuild `/signin` around `SignInDialog`, and **surface `?error=`** — nothing
  reads it today, so a failed Google sign-in is currently a silent no-op.
- Resolve every peer import before pushing (trap 3 — `bcryptjs`, `jsonwebtoken`).
- Set `RESEND_API_KEY` + `EMAIL_FROM` in Vercel, or email silently no-ops.
- **Also settles TODO.md item 3** — rotate `NEXTAUTH_SECRET` while we are in here.

**Result: Google + email/password.** Apple comes later for free — it registers
itself once its four env vars appear, with no code change.

### Phase 2 — Design system & app shell

*The leverage phase. Everything after this is mechanical reskinning.*

- Token layer: colour, spacing, radius, elevation, motion curves.
- Grow `components/ui/` into a real primitive set — button, card, dialog, sheet,
  input, keypad, badge, avatar, tabs, toast.
- **`<GameShell>`** — one layout: compact sticky top bar (back + title + menu),
  scrollable body, **bottom action bar** in the safe area.
- Kill the `Header` / `ProfessionalHeader` split. One header. No email in it.
- **`<NumericKeypad>`** — shared score entry for Scrabble, Darts and Quiz.
- **`<TurnIndicator>`** — the pass-the-phone component.
- Tactile motion primitives: press-deform + spring bounce, reduced-motion aware.
- Icons: `lucide-react` throughout. Emoji stay in *copy*, never as *icons*.

### Phase 3 — Landing page `/`

*Public, playable, and the launcher. Not gated.*

- Four real game cards — icon, name, what it does, how many players, how long.
- **Guest play is the default path.** Sign-in is a visible upgrade
  ("Sign in to save scores"), never a wall.
- Signed in: recent games and continue-where-you-left-off surface here.
- `SignInDialog` from `@aspiro/auth` — exactly one instance on the page.
  CookBook's `signin.js` documents why duplicating it caused the two copies to
  drift apart.
- **Do not copy CookBook's shape.** CookBook gates everything and uses `/signin`
  as its brochure page. GamePad's whole point is that you can play without an
  account. `/signin` still cannot be deleted (trap 5) — `pages: { signIn, error }`
  points at it — but it becomes a fallback, not the front door.

### Phase 4 — Identity & the save contract

*You confirmed: no legacy data concerns, do it right.*

- `Game.userId` → `session.user.id`. **No backfill, no compatibility shim.**
  Existing saved games are abandoned by design; a user signing in sees an empty
  history, and that is the accepted outcome.
- One rule, applied in all four games: **guest = local only, signed-in = saved.**
- Retire travel-bingo's bespoke `guest_…` identity in favour of the shared one.
- Consistent, honest empty states, replacing three improvised behaviours
  (hard 401 / localStorage / `userId: null`).

### Phase 5 — Reskin: Scrabble Scorer *(pilot)*

864 lines, one file, self-contained, simplest domain. If the design system
survives this, it survives the rest. Splits into components on the way through.

### Phase 6 — Reskin: Darts

16 components, 2,051 lines, plus a 395-line page. Four modes (X01, Cricket,
Clock, Killer). The biggest beneficiary of the shared keypad.

### Phase 7 — Reskin: Travel Bingo

8 components, 647 lines, plus a 388-line page. Smallest surface, and already the
most mobile-native game in the app.

### Phase 8 — Reskin: Quiz *(last, deliberately)* + first tests

24 components, 3,107 lines, plus a **1,348-line page** — the largest, and the
only one with live multi-device state. The SSE room machine
(`lobby → playing → question → reveal → scores → finished`, with `stateVersion`
as the cursor) is the one piece carrying real behavioural risk. It goes last,
when the design system is proven and nothing else is in flight.

**Tests come first within this phase, not after it.** GamePad has no test
framework and no CI (TODO.md item 4). Reskinning the one stateful game with no
safety net is the single riskiest thing in this plan, so the order inside Phase 8
is: write the tests against the *current* behaviour, watch them pass, then
reskin, then watch them still pass. Tests written afterwards would only encode
whatever the redesign happened to leave behind.

- **`vitest`** — matches the suite; CookBook already runs `vitest` + `playwright`,
  so this is alignment rather than a new choice. Adds `npm test`.
- Cover the room state machine: every legal transition, and that illegal ones are
  rejected. This is the contract the SSE stream depends on.
- Cover `stateVersion` as an SSE cursor — specifically that it increments on
  every save. **`QuizRoom.pre('save')` bumps it even on no-op saves**, which is
  already documented as a gotcha; pin that behaviour down before touching it.
- Cover scoring (`useQuizScoring`) and the join/answer paths — pure logic, cheap
  to test, and where a silent regression would be least visible.
- Not in scope: Playwright end-to-end. Multi-device SSE is expensive to drive and
  the unit layer catches the regressions that actually matter here.

**This resolves TODO.md item 4**, which can be deleted when the phase lands.

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| **Tailwind doesn't scan `@aspiro/auth`** → dialog renders invisible, nothing errors | Trap 1. Verify the dialog visually before moving on. It has caught previous migrations. |
| **Missing peer dep passes lint, fails deploy** | Trap 3 — `next lint` does not resolve imports. Two ChessMaster deploys died here. Resolve every bare import, and confirm the deploy reached READY. |
| **`next build` is broken on this machine** | Known, affects all Next 15 apps here. Verify via the dev server; do not read a local build failure as a code fault. |
| **Quiz SSE regression** | Phase 8, isolated, last — and the room state machine is now covered by tests written *before* the reskin, against current behaviour. |
| **Scope creep into new games** | This plan reskins four games. It adds none. |

---

## 6. Explicitly out of scope

- **New games.** Redesign only.
- **`@aspiro/media` / Cloudinary.** The photo feature was removed in `60ad439`;
  nothing in GamePad uploads media any more.
- **Capacitor / App Store.** A natural follow-on once the UI is genuinely
  mobile-first — CookBook and ChessMaster have the playbook — but not this pass.
- **Apple sign-in.** Ships dormant in Phase 1; activated later by env vars alone.

---

## 7. Sequencing note

Phases 0–4 are the realignment and are worth shipping as a unit — after Phase 4,
GamePad is a suite citizen with a proper landing page, even with four
old-looking games behind it. Phases 5–8 are then independently shippable, one
game at a time, with no pressure to land together.
