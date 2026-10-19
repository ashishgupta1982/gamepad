/* eslint-disable @next/next/no-img-element -- previews of the family's own photos (data URLs) */
import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Camera, Loader2, Send, X } from 'lucide-react';
import { photoToDataUrl } from '@/lib/egypt/photo';
import { HIERO_STYLE } from './fonts';
import { cn } from '@/lib/cn';

// Ask the guide: type a question, or photograph anything and ask what it is.
//
// The guide (api/egypt/guide) knows which stop the family is at, so "what's
// that bit on his leg?" works without saying whose leg. The conversation is
// kept by the page while the game is open, not saved, and only the last few
// turns go back to the server with each question.
//
// Built on the Radix dialog directly rather than ui/sheet, because a chat needs
// a fixed-height column (messages scroll, the composer stays put) and the
// shared sheet scrolls as one piece.
const SUGGESTIONS = [
  'Tell us a secret about this',
  'What did it look like when it was new?',
  'Explain it like I’m 10',
  'What’s the strangest thing about ancient Egypt?',
];

export default function GuideSheet({ open, onOpenChange, trip, stop, signedIn, onSignIn, messages, setMessages, onAsked }) {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const list = useRef(null);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      setPhoto(await photoToDataUrl(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const ask = async (question) => {
    const q = (question ?? text).trim();
    if ((!q && !photo) || busy) return;
    const mine = { role: 'user', text: q || 'What is this?', image: photo };
    const history = [...messages, mine];
    setMessages(history);
    setText('');
    setPhoto(null);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/egypt/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip: trip.id,
          stopId: stop?.id,
          messages: history.map(({ role, text: t }) => ({ role, text: t })),
          image: mine.image,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The guide could not answer. Try again.');
      setMessages([...history, { role: 'assistant', text: data.reply }]);
      onAsked();
    } catch (err) {
      setError(err.message);
      // Give the question back so it can be sent again.
      setMessages(messages);
      setText(mine.text === 'What is this?' && mine.image ? '' : mine.text);
      setPhoto(mine.image);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-xs" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[88dvh] max-w-3xl animate-slide-up flex-col rounded-t-2xl border-t border-border bg-background shadow-lg outline-none">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lapis text-xl text-gold" style={HIERO_STYLE} aria-hidden="true">
              𓂀
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-lg font-semibold leading-tight text-foreground">Ask Nefer, your guide</DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-xs text-muted-foreground">
                {stop ? `At: ${stop.title}` : trip.name} · ask anything, or snap a photo
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="press flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div ref={list} className="scroll-contain flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!messages.length && (
              <div className="rounded-xl bg-papyrus p-4 text-papyrus-foreground">
                <p className="font-display text-lg font-semibold">Ask me anything</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Who made it, what it was for, how they built it. Or take a photo of anything in the museum and I’ll tell you what it is.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed',
                    m.role === 'user' ? 'rounded-br-md bg-lapis text-white' : 'rounded-bl-md bg-papyrus text-papyrus-foreground',
                  )}
                >
                  {m.image && <img src={m.image} alt="Your photo" className="mb-2 max-h-56 w-full rounded-xl object-cover" />}
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-papyrus px-3.5 py-2.5 text-sm text-papyrus-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Nefer is thinking…
                </div>
              </div>
            )}
          </div>

          {!signedIn ? (
            <div className="border-t border-border p-4 pb-safe">
              <p className="text-sm text-muted-foreground">The guide uses AI, so it needs you signed in. Everything else works as a guest.</p>
              <button
                type="button"
                onClick={onSignIn}
                className="press mt-3 flex min-h-touch w-full items-center justify-center rounded-lg bg-lapis px-4 text-base font-semibold text-white"
              >
                Sign in to ask the guide
              </button>
            </div>
          ) : (
            <div className="border-t border-border bg-card px-3 pt-2 pb-safe">
              {!messages.length && !photo && (
                <div className="scroll-contain -mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="press shrink-0 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {photo && (
                <div className="mb-2 flex items-center gap-2">
                  <img src={photo} alt="Photo to ask about" className="h-16 w-16 rounded-lg object-cover" />
                  <span className="flex-1 text-sm text-muted-foreground">Photo ready. Ask about it, or just send.</span>
                  <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo" className="press flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
              {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
              >
                <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  aria-label="Take a photo to ask about"
                  className="press flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full bg-gold text-lapis"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </button>
                <label htmlFor="guide-question" className="sr-only">Your question</label>
                <textarea
                  id="guide-question"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      ask();
                    }
                  }}
                  rows={1}
                  maxLength={600}
                  placeholder={photo ? 'What would you like to know?' : 'Ask a question…'}
                  className="max-h-28 min-h-touch flex-1 resize-none rounded-2xl border border-input bg-background px-3.5 py-2.5 text-base focus:border-lapis focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || (!text.trim() && !photo)}
                  aria-label="Send"
                  className="press flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full bg-lapis text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                </button>
              </form>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
