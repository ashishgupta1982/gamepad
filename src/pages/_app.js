import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SessionSplashGate from '@aspiro/auth/splash';
import { Outfit, Inter } from 'next/font/google';
import '../styles/globals.css';

// Display face — headings, game names, scores.
//
// Third choice, and the reasoning is worth keeping. ui-ux-pro-max suggested
// Varela Round, rejected for shipping a single 400 weight when a scoring app
// needs weight contrast. Fredoka replaced it and was rejected on sight: too
// bubbly, reading as a children's app rather than a family one. Outfit is
// geometric and confident with a full weight range — modern without the
// roundness that made the last one feel juvenile.
const display = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// Body and UI face. Inter is the workhorse — neutral, and specifically drawn to
// stay legible at small sizes on screen, which is the whole job on a phone held
// across a table. Also what CookBook uses, so the suite reads as one family.
const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Site-wide defaults. Pages set their own <title> via next/head, which dedupes against
// these (page wins); pages without a description inherit this one.
const DESCRIPTION =
  'Five ready-to-play family games — Scrabble Scorer, Quiz, Darts, Travel Bingo and Egypt Explorer. No setup, no scoring headaches — play in seconds on any device.';
const OG_IMAGE = 'https://gamepad.ashishgupta.co.uk/og-card.png';

// GamePad is guest-first: every game is playable signed out, so nothing is
// gated behind a session and there is no in-place sign-in branch here. The
// splash covers only the two surfaces whose chrome differs by session — the
// home page (sign-in CTA vs signed-in state) and settings — so a signed-in
// visitor never sees the signed-out chrome flash on a cold load. Game routes
// are deliberately uncovered: a guest should be into the game instantly.
const SPLASH_ROUTES = ['/', '/settings'];

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  return (
    <>
      <SessionSplashGate
        active={SPLASH_ROUTES.includes(router.pathname)}
        iconSrc="/icon-192.png"
        wordmark={<span className="font-display text-2xl font-bold text-white">GamePad</span>}
        groundClassName="bg-orange-950"
      />
      <Component {...pageProps} />
    </>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>GamePad — Fun games for the family</title>
        <meta name="description" content={DESCRIPTION} />
        {/* Declared once, here. The seven pages that each carried their own copy
            overrode this one (next/head dedupes by name, page wins), which would
            have silently dropped viewport-fit and broken the safe-area insets.
            viewport-fit=cover is what lets env(safe-area-inset-*) resolve on iOS. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Social sharing — public app: unfurls in chat apps + rich results */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="GamePad" />
        <meta property="og:url" content="https://gamepad.ashishgupta.co.uk/" />
        <meta property="og:title" content="GamePad — Fun games for the family" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GamePad — Fun games for the family" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>

      {/* The font variables go on :root rather than a wrapper element so that
          portalled UI — dialogs, sheets, toasts, which render into <body> and
          not into the React tree here — still resolves them. A wrapper div
          would leave every modal rendering in the fallback system font. */}
      <style jsx global>{`
        :root {
          --font-display: ${display.style.fontFamily};
          --font-body: ${body.style.fontFamily};
        }
      `}</style>

      <SessionProvider session={session}>
        <AppContent Component={Component} pageProps={pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp;
