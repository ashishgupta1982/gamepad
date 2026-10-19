import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowLeft, Save, Trophy, Users, AlertCircle } from 'lucide-react';
import { SignInDialog } from '@aspiro/auth/ui';
import { BRAND } from '../lib/brand';

// NextAuth reports failures by bouncing back here with ?error=<code>. Nothing
// read that before, so a failed provider sign-in looked like a silent no-op:
// the dialog closed, the page reloaded, and the user was still signed out with
// no explanation. Codes are NextAuth's own.
const ERRORS = {
  OAuthAccountNotLinked:
    'That email is already registered with a different sign-in method. Use the one you signed up with.',
  AccessDenied: 'That sign-in was cancelled or refused.',
  Verification: 'That link has expired or has already been used. Request a new one.',
  CredentialsSignin: 'Those details were not recognised.',
  Configuration: 'Sign-in is misconfigured on the server. This one is not your fault.',
  OAuthSignin: 'Could not reach the sign-in provider. Try again in a moment.',
  OAuthCallback: 'Could not reach the sign-in provider. Try again in a moment.',
  SessionRequired: 'Sign in to see that page.',
};

const PERKS = [
  { icon: Save, text: 'Your games save automatically' },
  { icon: Trophy, text: 'Scores and stats build up over time' },
  { icon: Users, text: 'Same account on every device' },
];

// GamePad's /signin is a fallback, not a front door.
//
// Every game is playable signed out, so nothing routes here to gate access —
// `pages: { signIn, error }` points at it, the header links to it, and NextAuth
// lands here on failure. That is why it cannot be deleted however redundant it
// looks once the landing page has its own dialog.
//
// It exists to do two things the dialog alone cannot: explain what signing in
// actually buys you, and say plainly that not signing in is a real option.
export default function SignIn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const code = typeof router.query.error === 'string' ? router.query.error : null;
  const error = code ? ERRORS[code] || 'Something went wrong signing in. Try again.' : null;

  // Open the dialog on arrival, but not on top of an error — someone bounced
  // back here needs to read what went wrong before being handed the same form.
  useEffect(() => {
    if (!router.isReady) return;
    if (!code) setOpen(true);
  }, [router.isReady, code]);

  // `?callbackUrl=/games/egypt-explorer` sends a provider sign-in back to that
  // page instead of the launcher, so a link into a game can say "sign in, then
  // carry on". Paths on this site only: anything else would make this page an
  // open redirect. (Email and password sign-in is @aspiro/auth's own panel,
  // which always lands on "/".)
  const back = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : '';
  const returnTo = back.startsWith('/') && !back.startsWith('//') && !back.startsWith('/\\') ? back : null;

  const handleSignIn = (provider, callbackUrl) =>
    signIn(provider, { callbackUrl: returnTo || callbackUrl || '/' });

  return (
    <>
      <Head>
        <title>Sign in — GamePad</title>
        <meta
          name="description"
          content="Sign in to GamePad to save your scores and stats — or keep playing as a guest."
        />
      </Head>

      <main className="flex min-h-dvh flex-col bg-background px-safe">
        <header className="pt-safe">
          <Link
            href="/"
            className="press inline-flex min-h-touch items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All games
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <img src="/logo.svg" alt="" aria-hidden="true" className="mb-6 h-14 w-14 rounded-2xl" />

          <h1 className="font-display text-3xl font-semibold text-foreground">
            Save your games
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Everything on GamePad works without an account. Signing in just means
            it sticks around afterwards.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                  <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                </span>
                <span className="text-sm text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press mt-8 min-h-touch w-full rounded-lg bg-brand px-6 text-base font-semibold text-brand-foreground shadow-sm transition-colors duration-200 hover:bg-brand/90"
          >
            {error ? 'Try again' : 'Sign in'}
          </button>

          <Link
            href="/"
            className="press mt-3 flex min-h-touch w-full items-center justify-center rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Keep playing as a guest
          </Link>
        </div>
      </main>

      {/* One dialog, one set of options. The page never renders provider buttons
          of its own — two copies of the same choices is how a sibling app ended
          up offering different options at the top and bottom of a page. */}
      <SignInDialog
        open={open}
        onOpenChange={setOpen}
        title="Sign in to GamePad"
        description="Save your scores, stats and game history."
        appleEnabled={process.env.NEXT_PUBLIC_APPLE_ENABLED === 'true'}
        accent={BRAND.colour}
        onSignIn={handleSignIn}
      />
    </>
  );
}
