import Head from 'next/head';
import { useRouter } from 'next/router';
import useWakeLock from '@/hooks/useWakeLock';
import { Stage } from '@/components/quiz-show/ui';
import LivePlayer from '@/components/quiz-show/LivePlayer';

// A player's phone in a multi-phone quiz. The host's QR code links here with
// ?code= filled in.
export default function QuizJoinPage() {
  const router = useRouter();
  useWakeLock(true);
  if (!router.isReady) return null;
  return (
    <>
      <Head>
        <title>Join the quiz — GamePad</title>
        {/* Its own preview, since this is the link people are sent: an
            invitation, not the general GamePad card (keys as in _app.js). */}
        <meta name="description" content="You're invited to Quiz Night on GamePad. Tap to join on your phone." />
        <meta key="og:title" property="og:title" content="You're invited to Quiz Night" />
        <meta key="og:description" property="og:description" content="Tap to join the quiz on your phone. No app to install." />
        <meta key="og:url" property="og:url" content="https://gamepad.ashishgupta.co.uk/games/quiz/join" />
        <meta key="og:image" property="og:image" content="https://gamepad.ashishgupta.co.uk/og-quiz.png" />
        <meta key="twitter:title" name="twitter:title" content="You're invited to Quiz Night" />
        <meta key="twitter:description" name="twitter:description" content="Tap to join the quiz on your phone. No app to install." />
        <meta key="twitter:image" name="twitter:image" content="https://gamepad.ashishgupta.co.uk/og-quiz.png" />
      </Head>
      <Stage dim={0.5}>
        <LivePlayer initialCode={typeof router.query.code === 'string' ? router.query.code : ''} onLeave={() => router.push('/games/quiz')} />
      </Stage>
    </>
  );
}
