import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Brand + PWA */}
        <meta name="theme-color" content="#EA580C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Short home-screen name, not the long <title> (which iOS would otherwise use) */}
        <meta name="apple-mobile-web-app-title" content="GamePad" />
        <meta name="application-name" content="GamePad" />

        {/* Structured data — public games launcher */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GamePad",
              url: "https://gamepad.ashishgupta.co.uk",
              description:
                "Four ready-to-play family games — Scrabble Scorer, Quiz, Darts, and Travel Bingo. No setup, no scoring headaches.",
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
