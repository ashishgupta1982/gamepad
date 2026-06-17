import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import '../styles/globals.css';

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp;
