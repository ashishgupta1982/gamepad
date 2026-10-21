import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { SHOW_FONT } from '@/components/quiz-show/ui';
import { PLACES } from '@/data/worldExplorer';

// World Explorer's front door: a card for each place (data/worldExplorer.js).
//
// ONE PLACE: there is nothing to choose, so the page sends the player straight
// on to it (router.replace, so back returns to the games room, not here) and
// shows nothing first. No extra tap while Egypt is the only place.
// TWO OR MORE: the picker below shows. Nothing else changes when a place is added.
const ONLY = PLACES.length === 1 ? PLACES[0] : null;

const DESCRIPTION = 'Family guides for days out around the world: stories, photo quests, quizzes and a guide you can ask anything.';

// Written out, never interpolated: Tailwind only emits classes it can see.
const TONES = [
  'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]',
  'bg-sky-400 text-sky-950 [--toy-edge:theme(colors.sky.700)]',
  'bg-emerald-400 text-emerald-950 [--toy-edge:theme(colors.emerald.700)]',
  'bg-rose-400 text-rose-950 [--toy-edge:theme(colors.rose.700)]',
];

export default function WorldExplorer() {
  const router = useRouter();

  useEffect(() => {
    if (ONLY) router.replace(ONLY.href);
  }, [router]);

  const head = (
    <Head>
      <title>World Explorer · GamePad</title>
      <meta name="description" content={DESCRIPTION} />
    </Head>
  );

  if (ONLY) return head;

  return (
    <>
      {head}
      <div className="relative min-h-dvh overflow-x-hidden bg-[#15204a] text-white">
        {/* The games room's pyramid corner, blurred, so this reads as stepping
            closer to the object that was tapped. */}
        <img
          src="/home/room.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 h-full w-full scale-110 select-none object-cover blur-md"
          style={{ objectPosition: '88% 32%' }}
        />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#15204a]/40 via-[#15204a]/70 to-[#15204a]/95" />

        <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                play('back');
                router.push('/');
              }}
              aria-label="Back to the games room"
              className="toy flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#15204a] [--toy-edge:rgba(0,0,0,0.3)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="rounded-full bg-white/85 text-[#15204a]">
              <MuteButton />
            </span>
          </div>

          <motion.div
            className="mt-10 text-center"
            initial={{ scale: 0.6, rotate: -5, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 14 }}
          >
            <h1 className="text-5xl leading-none text-amber-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]" style={SHOW_FONT}>
              World Explorer
            </h1>
            <p className="mt-3 text-lg font-semibold text-white/90">Where are we off to?</p>
          </motion.div>

          {/* grid-cols-1 is minmax(0, 1fr), so a long line truncates rather
              than pushing the cards off a phone. */}
          <ul className="mt-auto grid grid-cols-1 gap-3 pt-10">
            {PLACES.map((place, i) => (
              <motion.li
                key={place.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    play('whoosh');
                    router.push(place.href);
                  }}
                  className={`toy flex w-full min-w-0 items-center gap-4 rounded-3xl px-5 py-5 text-left ${TONES[i % TONES.length]}`}
                >
                  <span className="text-5xl" aria-hidden="true">{place.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-3xl leading-tight" style={SHOW_FONT}>{place.name}</span>
                    <span className="block text-sm font-semibold opacity-85">{place.line}</span>
                  </span>
                  <ArrowRight className="h-6 w-6 shrink-0" aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
