import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        {/* Load Microsoft Teams JavaScript SDK */}
        <script src="https://res.cdn.office.net/teams-js/2.31.1/js/MicrosoftTeams.min.js"
                integrity="sha384-xxx"
                crossOrigin="anonymous"
                defer>
        </script>
      </Head>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp;