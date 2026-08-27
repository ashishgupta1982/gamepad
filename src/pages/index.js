import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ChevronRight, Play, Save, Trophy, Users, History } from 'lucide-react';
import { SignInDialog } from '@aspiro/auth/ui';
import AppHeader from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { GAMES, GAME_TONES, GAME_BY_TYPE } from '@/data/games';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';

// The launcher, and the public landing page. Deliberately one thing.
//
// CookBook gates everything and uses /signin as its brochure, which is right for
// CookBook and wrong here: GamePad's whole point is that you can play without an
// account. So there is no wall, no "get started" funnel, and the games are the
// first thing on the page. Signing in is offered as an upgrade, below the games,
// phrased as what it adds rather than what it unlocks.

function GameCard({ game }) {
  const tone = GAME_TONES[game.tone];
  const Icon = game.icon;

  return (
    <Link
      href={game.href}
      className="press flex h-full items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-border/60 hover:bg-muted/40"
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
          tone.soft,
        )}
      >
        <Icon className={cn('h-6 w-6', tone.text)} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-foreground">{game.name}</span>
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          {game.description}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {game.meta.map((m) => (
            <Badge key={m}>{m}</Badge>
          ))}
        </span>
      </span>

      <ChevronRight
        className="mt-3 h-5 w-5 shrink-0 text-muted-foreground/60"
        aria-hidden="true"
      />
    </Link>
  );
}

// Only rendered for a signed-in user with saved games. A signed-out visitor is
// not shown an empty "your games" shell — an empty state for something you have
// not opted into reads as a nag, not a feature.
function ContinueStrip({ games }) {
  if (!games.length) return null;

  return (
    <section className="mb-8" aria-labelledby="continue-heading">
      <h2
        id="continue-heading"
        className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        Pick up where you left off
      </h2>

      <ul className="flex flex-col gap-2">
        {games.map((g) => {
          const meta = GAME_BY_TYPE[g.gameType];
          if (!meta) return null;
          const tone = GAME_TONES[meta.tone];
          const Icon = meta.icon;
          const names = (g.players || []).map((p) => p.name).filter(Boolean);

          return (
            <li key={g._id}>
              <Link
                href={meta.href}
                className="press flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    tone.soft,
                  )}
                >
                  <Icon className={cn('h-4 w-4', tone.text)} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {meta.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {names.length ? names.join(', ') : 'In progress'}
                  </span>
                </span>
                <Play className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const PERKS = [
  { icon: Save, text: 'Games save automatically' },
  { icon: Trophy, text: 'Scores and stats build up' },
  { icon: Users, text: 'Same account on every device' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recent, setRecent] = useState([]);

  const isAuthenticated = status === 'authenticated';

  // Saved games only exist for a signed-in user, so this never fires for a
  // guest. A failure is swallowed: the strip is a convenience, and a dead
  // network call must not stop someone reaching the games below it.
  useEffect(() => {
    if (!isAuthenticated) {
      setRecent([]);
      return;
    }
    let cancelled = false;
    fetch('/api/games')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.games) return;
        setRecent(data.games.filter((g) => g.status === 'active').slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      <Head>
        <title>GamePad — Fun games for the family</title>
        <link rel="canonical" href="https://gamepad.ashishgupta.co.uk/" />
      </Head>

      <div className="flex min-h-dvh flex-col bg-background">
        <AppHeader />

        <main className="flex-1 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {/* No time-of-day greeting. It would be computed on the server
                  and again on the client, and "Good evening" rendered against
                  "Good afternoon" is a hydration mismatch for no benefit. */}
              {isAuthenticated && session?.user?.name
                ? `Hi, ${session.user.name.split(' ')[0]}`
                : 'Pick a game'}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Four games, no setup. Start playing in a tap.
            </p>

            <div className="mt-8">
              <ContinueStrip games={recent} />

              <section aria-labelledby="games-heading">
                <h2 id="games-heading" className="sr-only">
                  Games
                </h2>
                {/* One column on a phone, two from sm. Two columns at 375px
                    would squeeze each description to about 18 characters a
                    line, which is how the old emoji tiles ended up hiding
                    their text on mobile entirely. */}
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {GAMES.map((game) => (
                    <li key={game.id}>
                      <GameCard game={game} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* The upgrade, not a gate. Below the games on purpose — a
                  first-time visitor should reach a game before they reach a
                  reason to sign up. Hidden entirely while the session is still
                  loading, so it cannot flash at someone already signed in. */}
              {status === 'unauthenticated' && (
                <section className="mt-8 rounded-lg border border-border bg-card p-5 shadow-sm">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Want it to stick around?
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Every game works as you are. Sign in and they stop
                    disappearing when you close the tab.
                  </p>

                  <ul className="mt-4 space-y-2.5">
                    {PERKS.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                        <span className="text-sm text-foreground">{text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    className="press mt-5 flex min-h-touch w-full items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
                  >
                    Sign in
                  </button>
                </section>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-border px-4 py-6 pb-safe">
          <p className="mx-auto max-w-3xl text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GamePad
          </p>
        </footer>
      </div>

      {/* Exactly one instance on the page. A sibling app once rendered its
          sign-in options twice and the two copies drifted, so the bottom of the
          page ended up offering fewer ways in than the top. */}
      <SignInDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Sign in to GamePad"
        description="Save your scores, stats and game history."
        appleEnabled={process.env.NEXT_PUBLIC_APPLE_ENABLED === 'true'}
        accent={BRAND.colour}
        onSignIn={(provider, callbackUrl) => signIn(provider, { callbackUrl: callbackUrl || '/' })}
      />
    </>
  );
}
