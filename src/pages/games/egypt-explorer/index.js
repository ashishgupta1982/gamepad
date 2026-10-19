import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, BookMarked, Loader2 } from 'lucide-react';
import GameShell from '@/components/layout/GameShell';
import TripPicker from '@/components/egypt/TripPicker';
import TripHome from '@/components/egypt/TripHome';
import StopView from '@/components/egypt/StopView';
import PlayerSetup from '@/components/egypt/PlayerSetup';
import PlayerSwitch from '@/components/egypt/PlayerSwitch';
import WhoAreYou from '@/components/egypt/WhoAreYou';
import GuideSheet from '@/components/egypt/GuideSheet';
import Passport from '@/components/egypt/Passport';
import useOfflinePhotos from '@/components/egypt/useOfflinePhotos';
import useEgyptProgress from '@/hooks/useEgyptProgress';
import useEgyptFamily from '@/hooks/useEgyptFamily';
import { TRIPS, getTrip } from '@/data/egypt';
import { PHOTOS } from '@/data/egypt/photos';
import {
  newProgress, withPlayers, recordAnswer, recordQuest, toggleLooked, countAsk, stopStatus, nextStop,
} from '@/lib/egypt/progress';

// Egypt Explorer: a family game for days out in Egypt, one trip at a time.
//
// Before any trip: the family (everyone playing, set up once for every trip and
// every phone on the account, hooks/useEgyptFamily.js), then who is playing on
// THIS phone. That name sits in the header from then on, and everything done
// counts for them; tapping it hands the phone to someone else. Each person
// plays every stop for themselves, so a family can play on one phone, passing
// it round, or on a phone each, signed in to the same account, with the scores
// merging as they go (hooks/useEgyptProgress.js).
//
// Which trip and stop are showing live in the URL (?trip=giza&stop=sphinx), so
// the phone's back button walks back through them and a stop can be shared or
// reopened. No trip means the trip picker. A link with only ?stop= dates from
// when the GEM was the only trip, so it still opens the GEM.
const PATH = '/games/egypt-explorer';
const DESCRIPTION =
  'A family game for the Grand Egyptian Museum and the pyramids of Giza: stories, photo quests, quizzes and a guide you can ask anything.';

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
  const family = useEgyptFamily();
  const [editingFamily, setEditingFamily] = useState(false);
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

  if (!router.isReady || !family.ready) {
    return (
      <>
        {head}
        <Loading />
      </>
    );
  }

  if (!family.players.length || editingFamily) {
    return (
      <>
        {head}
        <GameShell title="Egypt Explorer" onBack={() => (editingFamily ? setEditingFamily(false) : router.push('/'))}>
          <PlayerSetup
            cover={(trip || TRIPS[0]).cover}
            editing={editingFamily}
            initial={family.players.map((p) => p.name)}
            onCancel={editingFamily ? () => setEditingFamily(false) : null}
            onDone={(names) => {
              family.setFamily(names);
              setEditingFamily(false);
            }}
          />
        </GameShell>
      </>
    );
  }

  if (!family.me) {
    return (
      <>
        {head}
        <GameShell title="Egypt Explorer" onBack={() => router.push('/')}>
          <WhoAreYou players={family.players} onPick={family.setMe} onEditFamily={() => setEditingFamily(true)} />
        </GameShell>
      </>
    );
  }

  const playingAs = (
    <PlayerSwitch
      players={family.players}
      me={family.me}
      onPick={family.setMe}
      onEditFamily={() => setEditingFamily(true)}
    />
  );

  if (!trip) {
    return (
      <>
        {head}
        <GameShell title="Egypt Explorer" onBack={() => router.push('/')} headerAside={playingAs}>
          <TripPicker
            trips={TRIPS}
            me={family.me}
            players={family.players}
            onPick={(id) => router.push({ pathname: PATH, query: { trip: id } }, undefined, { shallow: true })}
          />
        </GameShell>
      </>
    );
  }

  // Keyed by trip, so changing trip starts the guide chat and the screens afresh.
  return (
    <TripGame
      key={trip.id}
      trip={trip}
      stopId={stopParam}
      me={family.me}
      players={family.players}
      headerAside={playingAs}
    />
  );
}

function TripGame({ trip, stopId, me, players, headerAside }) {
  const router = useRouter();
  const { progress: saved, ready, update } = useEgyptProgress(trip.id);

  const [guideOpen, setGuideOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Nothing saved yet reads as a fresh trip; the first change saves one.
  const progress = useMemo(() => saved || newProgress(trip.id, players), [saved, trip.id, players]);
  const change = useCallback(
    (fn) => update((p) => withPlayers(fn(p || newProgress(trip.id, players)), players)),
    [update, trip.id, players],
  );

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

  let body;
  let actions = null;
  if (stop) {
    const next = trip.stops[stopIndex + 1];
    body = (
      <StopView
        trip={trip}
        stop={stop}
        index={stopIndex}
        progress={progress}
        me={me}
        players={players}
        onAnswer={(qIndex, choice) => change((p) => recordAnswer(p, stop, qIndex, choice, me))}
        onQuest={(result) => change((p) => recordQuest(p, stop.id, me, result))}
        onLook={(i) => change((p) => toggleLooked(p, stop.id, me, i))}
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
    const upNext = nextStop(progress, trip, me);
    body = (
      <TripHome
        trip={trip}
        progress={progress}
        me={me}
        players={players}
        offline={offline}
        onOpenStop={openStop}
        onOpenPassport={() => setPassportOpen(true)}
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
              {stopStatus(progress, upNext, me).started ? 'Carry on' : 'Go to'}: {upNext.title}
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
        headerAside={headerAside}
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
        onAsked={() => change((p) => countAsk(p))}
      />

      <Passport
        open={passportOpen}
        onOpenChange={setPassportOpen}
        trip={trip}
        progress={progress}
        me={me}
        players={players}
        onOpenStop={openStop}
      />
    </>
  );
}
