import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { SignInDialog } from '@aspiro/auth/ui';
import GamesRoom from '@/components/home/GamesRoom';
import { ROOM } from '@/data/gamesRoom';
import { BRAND } from '@/lib/brand';

// The launcher, and the public landing page: a games room where every game is
// an object (REDESIGN-PLAN.md, Phase 2).
//
// Still guest-first. There is no wall and no "get started" funnel; the games
// are the whole page. Signing in is offered on each game's card and from the
// account button, phrased as what it adds.
//
// "Carry on" lives on a game's own card, not over the room (Ash, 2026-10-21):
// a Travel Bingo game this phone is in is remembered on the phone, and a
// signed-in player's unfinished games come from /api/games, as the old
// "pick up where you left off" strip did.

export default function Home() {
  const { status } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [active, setActive] = useState({});

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    const found = {};
    try {
      if (localStorage.getItem('travel-bingo:active')) found['travel-bingo'] = { detail: 'You have a game going on this phone.' };
    } catch {}
    setActive((a) => ({ ...a, ...found }));
  }, []);

  // A failure is swallowed: carrying on is a convenience, and a dead network
  // call must not stop anyone reaching the games.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    fetch('/api/games')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.games) return;
        const found = {};
        for (const g of data.games) {
          if (g.status !== 'active' || found[g.gameType]) continue;
          const names = (g.players || []).map((p) => p.name).filter(Boolean);
          found[g.gameType] = { detail: names.length ? `In progress: ${names.join(', ')}` : 'A game in progress' };
        }
        setActive((a) => ({ ...found, ...a }));
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
        <link rel="preload" as="image" href={ROOM.src} />
      </Head>

      <GamesRoom active={active} isGuest={status === 'unauthenticated'} onSignIn={() => setDialogOpen(true)} />

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
