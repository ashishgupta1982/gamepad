import Head from 'next/head';
import { useState } from 'react';
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
// The room is only the way into each game (Ash, 2026-10-21). Carrying on,
// starting and joining are chosen inside the game itself.

export default function Home() {
  const { status } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Head>
        <title>GamePad — Fun games for the family</title>
        <link rel="canonical" href="https://gamepad.ashishgupta.co.uk/" />
        <link rel="preload" as="image" href={ROOM.src} />
      </Head>

      <GamesRoom isGuest={status === 'unauthenticated'} onSignIn={() => setDialogOpen(true)} />

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
