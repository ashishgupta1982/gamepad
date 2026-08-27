import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import { Fredoka, Nunito_Sans } from 'next/font/google';
import '../styles/globals.css';

// Display face — headings, scores, game titles.
//
// ui-ux-pro-max recommended Varela Round here. Rejected: it ships a single 400
// weight, and a scoring app needs weight contrast between a player's name and
// their score. Fredoka is the same friendly rounded geometry with a real
// 300-700 range.
const display = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// Body and UI face. Rounded terminals so it sits with Fredoka, but a proper
// text design that stays readable at 14px on a phone held across a table.
const body = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Site-wide defaults. Pages set their own <title> via next/head, which dedupes against
// these (page wins); pages without a description inherit this one.
const DESCRIPTION =
  'Four ready-to-play family games — Scrabble Scorer, Quiz, Darts, and Travel Bingo. No setup, no scoring headaches — play in seconds on any device.';
const OG_IMAGE = 'https://gamepad.ashishgupta.co.uk/og-card.png';

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
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp;
