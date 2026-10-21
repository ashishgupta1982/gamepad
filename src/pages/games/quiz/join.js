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
      </Head>
      <Stage dim={0.5}>
        <LivePlayer initialCode={typeof router.query.code === 'string' ? router.query.code : ''} onLeave={() => router.push('/games/quiz')} />
      </Stage>
    </>
  );
}
