/* eslint-disable @next/next/no-img-element -- previews a local photo (data URL) */
import { useRef, useState } from 'react';
import { Camera, Loader2, Star, RotateCcw, Lightbulb } from 'lucide-react';
import { photoToDataUrl } from '@/lib/egypt/photo';
import { nextPlayer, POINTS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The stop's photo quest: find a thing, photograph it, the guide checks it.
//
// The camera is a plain file input with `capture`, which opens the phone's own
// camera app. That needs no camera permission (GamePad's Permissions-Policy
// turns getUserMedia off) and works the same on iOS and Android. The photo is
// shrunk on the phone (lib/egypt/photo.js) and sent once; it is not kept.
//
// If the guide is not convinced, a parent can count it anyway: glass cases,
// crowds and reflections should not cost anyone their points.
export default function QuestCard({ trip, stop, progress, signedIn, onSignIn, onRecord }) {
  const quest = progress.stops[stop.id]?.quest;
  const input = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [who, setWho] = useState(() => nextPlayer(progress)?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const playerName = (id) => progress.players.find((p) => p.id === id)?.name || 'Someone';

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult(null);
    try {
      setPhoto(await photoToDataUrl(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/egypt/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: trip.id, stopId: stop.id, image: photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      setResult(data);
      if (data.found) {
        onRecord({ by: who, found: true, says: data.says });
        setPhoto(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const countAnyway = () => {
    onRecord({ by: who, found: false, override: true, says: result?.says || '' });
    setPhoto(null);
    setResult(null);
  };

  const done = quest?.found;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Photo quest">
      <div className="flex items-center justify-between bg-gradient-to-r from-game-egypt to-game-egypt-deep px-4 py-2.5 text-white">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Camera className="h-4 w-4 text-gold" aria-hidden="true" /> Photo quest
        </span>
        <span className="text-sm text-white/85">+{POINTS.quest} points</span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-xl font-semibold text-foreground">{stop.quest.title}</h3>
        <p className="mt-1 text-base leading-relaxed text-foreground">{stop.quest.ask}</p>
        <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          {stop.quest.hint}
        </p>

        {done && !photo && (
          <div className="mt-4 rounded-xl bg-papyrus p-3 text-papyrus-foreground">
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              <Star className="h-5 w-5 fill-gold text-gold" aria-hidden="true" />
              Found by {playerName(quest.by)}{quest.override ? ' (counted by the grown-ups)' : ''}
            </p>
            {quest.says && <p className="mt-1 text-sm leading-relaxed">{quest.says}</p>}
          </div>
        )}

        {!signedIn ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            The guide checks quest photos, so this needs you signed in.
            <button type="button" onClick={onSignIn} className="ml-1 font-semibold text-lapis underline-offset-2 hover:underline">
              Sign in
            </button>
          </div>
        ) : (
          <>
            <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />

            {photo && (
              <div className="mt-4 space-y-3">
                <img src={photo} alt="Your quest photo" className="max-h-80 w-full rounded-xl object-cover" />
                {progress.players.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-foreground">Who found it?</p>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Who found it">
                      {progress.players.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={who === p.id}
                          onClick={() => setWho(p.id)}
                          className={cn(
                            'press min-h-[36px] rounded-full px-3 text-sm font-semibold',
                            who === p.id ? 'bg-gold text-lapis' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!result && (
                  <button
                    type="button"
                    onClick={check}
                    disabled={busy}
                    className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-lapis px-4 text-base font-semibold text-white disabled:opacity-70"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Star className="h-5 w-5 text-gold" aria-hidden="true" />}
                    {busy ? 'The guide is looking…' : 'Did we find it?'}
                  </button>
                )}
              </div>
            )}

            {result && !result.found && (
              <div className="mt-3 animate-slide-up rounded-xl bg-papyrus p-3 text-papyrus-foreground">
                <p className="font-display text-lg font-semibold">Not quite, says the guide</p>
                {result.says && <p className="mt-1 text-sm leading-relaxed">{result.says}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => input.current?.click()}
                    className="press flex min-h-touch items-center justify-center gap-1.5 rounded-lg bg-lapis px-3 text-sm font-semibold text-white"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
                  </button>
                  <button
                    type="button"
                    onClick={countAnyway}
                    className="press flex min-h-touch items-center justify-center rounded-lg border-2 border-lapis/30 px-3 text-sm font-semibold text-lapis"
                  >
                    We found it really
                  </button>
                </div>
              </div>
            )}

            {result?.found && !photo && (
              <p className="mt-3 animate-pop-in text-center font-display text-lg font-semibold text-success">
                Found it! +{POINTS.quest} to {playerName(who)}
              </p>
            )}

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {!photo && (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className={cn(
                  'press mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold',
                  done ? 'border-2 border-border text-foreground' : 'bg-lapis text-white',
                )}
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                {done ? 'Take another' : 'Take the photo'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
