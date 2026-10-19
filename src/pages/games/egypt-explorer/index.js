import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { SignInDialog } from '@aspiro/auth/ui';
import { ArrowRight, Camera, BookMarked, Loader2 } from 'lucide-react';
import GameShell from '@/components/layout/GameShell';
import TripHome from '@/components/egypt/TripHome';
import StopView from '@/components/egypt/StopView';
import PlayerSetup from '@/components/egypt/PlayerSetup';
import GuideSheet from '@/components/egypt/GuideSheet';
import Passport from '@/components/egypt/Passport';
import useOfflinePhotos from '@/components/egypt/useOfflinePhotos';
import useEgyptProgress from '@/hooks/useEgyptProgress';
import { getTrip } from '@/data/egypt';
import { PHOTOS } from '@/data/egypt/photos';
import {
  newProgress, setPlayers, recordAnswer, recordQuest, toggleLooked, countAsk, stopStatus,
} from '@/lib/egypt/progress';
import { BRAND } from '@/lib/brand';

// Egypt Explorer: a family museum game, one trip at a time.
//
// Which stop is showing lives in the URL (?stop=boat), so the phone's back
// button goes back to the route, and a stop can be shared or reopened.
// Everything else is in the progress object (lib/egypt/progress.js), saved by
// useEgyptProgress.
const TRIP_ID = 'gem';
const PATH = '/games/egypt-explorer';

export default function EgyptExplorer() {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const trip = getTrip(TRIP_ID);
  const { progress, ready, update } = useEgyptProgress(TRIP_ID);

  const [editing, setEditing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const photoUrls = useMemo(() => {
    const ids = new Set([trip.cover, ...trip.stops.flatMap((s) => [...s.photos, ...s.quiz.map((q) => q.photo).filter(Boolean)])]);
    return [...ids].map((id) => PHOTOS[id]?.src).filter(Boolean);
  }, [trip]);
  const offline = useOfflinePhotos(photoUrls);

  const stopId = typeof router.query.stop === 'string' ? router.query.stop : null;
  const stopIndex = trip.stops.findIndex((s) => s.id === stopId);
  const stop = stopIndex >= 0 ? trip.stops[stopIndex] : null;

  const openStop = useCallback(
    (id) => router.push({ pathname: PATH, query: id ? { stop: id } : {} }, undefined, { shallow: true }),
    [router],
  );

  // A new stop starts at the top. GameShell's <main> is the scrolling element.
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [stopId]);

  const askGuide = () => setGuideOpen(true);
  const openSignIn = () => setSignInOpen(true);

  // In every state, including the server render, which is always the loading
  // one (progress lives in localStorage), so a shared link still has a title.
  const head = (
    <Head>
      <title>{stop ? `${stop.title} · Egypt Explorer` : 'Egypt Explorer · GamePad'}</title>
      <meta name="description" content="A family game for the Grand Egyptian Museum: stories, photo quests, quizzes and a guide you can ask anything." />
    </Head>
  );

  if (!ready) {
    return (
      <>
        {head}
        <GameShell title="Egypt Explorer">
          <div className="flex min-h-[50dvh] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
          </div>
        </GameShell>
      </>
    );
  }

  const needsPlayers = !progress || !progress.players.length || editing;

  let body;
  let actions = null;
  if (needsPlayers) {
    body = (
      <PlayerSetup
        trip={trip}
        initial={editing ? progress.players.map((p) => p.name) : []}
        onCancel={editing ? () => setEditing(false) : null}
        onDone={(names) => {
          update((p) => (p ? setPlayers(p, names) : newProgress(TRIP_ID, names)));
          setEditing(false);
        }}
      />
    );
  } else if (stop) {
    const next = trip.stops[stopIndex + 1];
    body = (
      <StopView
        trip={trip}
        stop={stop}
        index={stopIndex}
        progress={progress}
        signedIn={signedIn}
        onSignIn={openSignIn}
        onAnswer={(qIndex, choice, by) => update((p) => recordAnswer(p, stop, qIndex, choice, by))}
        onQuest={(result) => update((p) => recordQuest(p, stop.id, result))}
        onLook={(i) => update((p) => toggleLooked(p, stop.id, i))}
      />
    );
    actions = (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={askGuide}
          className="press flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gold px-3 text-base font-semibold text-lapis"
        >
          <Camera className="h-5 w-5" aria-hidden="true" /> Ask the guide
        </button>
        <button
          type="button"
          onClick={() => openStop(next ? next.id : null)}
          className="press flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-lapis px-3 text-base font-semibold text-white"
        >
          {next ? 'Next stop' : 'The route'} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    );
  } else {
    const upNext = trip.stops.find((s) => !stopStatus(progress, s).stamped);
    body = (
      <TripHome
        trip={trip}
        progress={progress}
        offline={offline}
        onOpenStop={openStop}
        onOpenPassport={() => setPassportOpen(true)}
        onEditPlayers={() => setEditing(true)}
      />
    );
    actions = (
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          type="button"
          onClick={askGuide}
          aria-label="Ask the guide"
          className="press flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-gold px-3 text-lapis"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
        </button>
        {upNext ? (
          <button
            type="button"
            onClick={() => openStop(upNext.id)}
            className="press flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-lapis px-4 text-base font-semibold text-white"
          >
            <span className="truncate">
              {stopStatus(progress, upNext).started ? 'Carry on' : 'Go to'}: {upNext.title}
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPassportOpen(true)}
            className="press flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-lapis px-4 text-base font-semibold text-white"
          >
            <BookMarked className="h-5 w-5" aria-hidden="true" /> Every stamp! See your passport
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {head}

      <GameShell
        title={stop ? stop.title : 'Egypt Explorer'}
        onBack={() => (stop ? openStop(null) : router.push('/'))}
        actions={actions}
        keepAwake={!!stop}
      >
        {body}
      </GameShell>

      <GuideSheet
        open={guideOpen}
        onOpenChange={setGuideOpen}
        trip={trip}
        stop={stop}
        signedIn={signedIn}
        onSignIn={() => { setGuideOpen(false); openSignIn(); }}
        messages={messages}
        setMessages={setMessages}
        onAsked={() => update((p) => (p ? countAsk(p) : p))}
      />

      {progress && (
        <Passport
          open={passportOpen}
          onOpenChange={setPassportOpen}
          trip={trip}
          progress={progress}
          onOpenStop={openStop}
          onReset={() => update((p) => newProgress(TRIP_ID, p.players.map((x) => x.name)))}
        />
      )}

      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        title="Sign in to ask the guide"
        description="The guide and the photo quests use AI, so they need an account. Your trip is saved to it too."
        appleEnabled={process.env.NEXT_PUBLIC_APPLE_ENABLED === 'true'}
        accent={BRAND.colour}
        onSignIn={(provider, callbackUrl) => signIn(provider, { callbackUrl: callbackUrl || router.asPath })}
      />
    </>
  );
}
