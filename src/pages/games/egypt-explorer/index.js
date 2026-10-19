import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, BookMarked, Loader2 } from 'lucide-react';
import GameShell from '@/components/layout/GameShell';
import TripPicker from '@/components/egypt/TripPicker';
import TripHome from '@/components/egypt/TripHome';
import StopView from '@/components/egypt/StopView';
import PlayerSetup from '@/components/egypt/PlayerSetup';
import GuideSheet from '@/components/egypt/GuideSheet';
import Passport from '@/components/egypt/Passport';
import useOfflinePhotos from '@/components/egypt/useOfflinePhotos';
import useEgyptProgress, { readLocal } from '@/hooks/useEgyptProgress';
import { TRIPS, getTrip } from '@/data/egypt';
import { PHOTOS } from '@/data/egypt/photos';
import {
  newProgress, setPlayers, recordAnswer, recordQuest, toggleLooked, countAsk, stopStatus,
} from '@/lib/egypt/progress';

// Egypt Explorer: a family game for days out in Egypt, one trip at a time.
//
// Which trip and stop are showing live in the URL (?trip=giza&stop=sphinx), so
// the phone's back button walks back through them and a stop can be shared or
// reopened. No trip means the trip picker. A link with only ?stop= dates from
// when the GEM was the only trip, so it still opens the GEM. Everything else is
// in each trip's progress object (lib/egypt/progress.js), saved by
// useEgyptProgress.
const PATH = '/games/egypt-explorer';
const DESCRIPTION =
  'A family game for the Grand Egyptian Museum and the pyramids of Giza: stories, photo quests, quizzes and a guide you can ask anything.';

/** The explorers from whichever other trip this phone played most recently. */
function namesFromOtherTrips(tripId) {
  const latest = TRIPS.filter((t) => t.id !== tripId)
    .map((t) => readLocal(t.id))
    .filter((p) => p?.players?.length)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  return latest ? latest.players.map((p) => p.name) : [];
}

function Loading() {
  return (
    <GameShell title="Egypt Explorer">
      <div className="flex min-h-[50dvh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </div>
    </GameShell>
  );
}

export default function EgyptExplorer() {
  const router = useRouter();
  const tripParam = typeof router.query.trip === 'string' ? router.query.trip : null;
  const stopParam = typeof router.query.stop === 'string' ? router.query.stop : null;
  const trip = getTrip(tripParam || (stopParam ? 'gem' : null));

  // In every state, including the server render (which never knows the
  // query), so a shared link still has a title.
  const head = (
    <Head>
      <title>{trip ? `${trip.name} · Egypt Explorer` : 'Egypt Explorer · GamePad'}</title>
      <meta name="description" content={trip ? trip.description : DESCRIPTION} />
    </Head>
  );

  if (!router.isReady) {
    return (
      <>
        {head}
        <Loading />
      </>
    );
  }

  if (!trip) {
    return (
      <>
        {head}
        <GameShell title="Egypt Explorer" onBack={() => router.push('/')}>
          <TripPicker
            trips={TRIPS}
            onPick={(id) => router.push({ pathname: PATH, query: { trip: id } }, undefined, { shallow: true })}
          />
        </GameShell>
      </>
    );
  }

  // Keyed by trip, so changing trip starts the guide chat and the screens afresh.
  return <TripGame key={trip.id} trip={trip} stopId={stopParam} />;
}

function TripGame({ trip, stopId }) {
  const router = useRouter();
  const { progress, ready, update } = useEgyptProgress(trip.id);
  // Only rendered in the browser (the router is ready), so localStorage is there.
  const [carried] = useState(() => namesFromOtherTrips(trip.id));

  const [editing, setEditing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const photoUrls = useMemo(() => {
    const ids = new Set([trip.cover, ...trip.stops.flatMap((s) => [...s.photos, ...s.quiz.map((q) => q.photo).filter(Boolean)])]);
    return [...ids].map((id) => PHOTOS[id]?.src).filter(Boolean);
  }, [trip]);
  const offline = useOfflinePhotos(photoUrls);

  const stopIndex = trip.stops.findIndex((s) => s.id === stopId);
  const stop = stopIndex >= 0 ? trip.stops[stopIndex] : null;

  const openStop = useCallback(
    (id) => router.push({ pathname: PATH, query: id ? { trip: trip.id, stop: id } : { trip: trip.id } }, undefined, { shallow: true }),
    [router, trip.id],
  );

  // A new stop starts at the top. GameShell's <main> is the scrolling element.
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [stopId]);

  const askGuide = () => setGuideOpen(true);

  const head = (
    <Head>
      <title>{stop ? `${stop.title} · Egypt Explorer` : `${trip.name} · Egypt Explorer`}</title>
      <meta name="description" content={trip.description} />
    </Head>
  );

  if (!ready) {
    return (
      <>
        {head}
        <Loading />
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
        editing={editing}
        initial={editing ? progress.players.map((p) => p.name) : carried}
        onCancel={editing ? () => setEditing(false) : null}
        onDone={(names) => {
          update((p) => (p ? setPlayers(p, names) : newProgress(trip.id, names)));
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
        title={stop ? stop.title : trip.shortName}
        onBack={() => (stop ? openStop(null) : router.push(PATH, undefined, { shallow: true }))}
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
          onReset={() => update((p) => newProgress(trip.id, p.players.map((x) => x.name)))}
        />
      )}
    </>
  );
}
