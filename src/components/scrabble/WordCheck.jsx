import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { buzz } from '@/components/arcade/feedback';
import { cleanWord } from '@/lib/scrabble/rules';
import { cn } from '@/lib/cn';
import { BigButton, SHOW_FONT, Sheet, TileWord } from './ui';

// "Is that a word?", checked on the phone against a bundled word list: ENABLE,
// the public-domain list many word games use (public/scrabble/words.txt, about
// 173,000 words). It replaced a call to Claude through /api/claude, so a
// challenge is instant, free and works with no signal. The list is fetched
// the first time the checker opens, kept in memory, and never before: most
// games never need it. It is a list, not the official Collins or TWL
// dictionary, and the sheet says so.

let words = null;
function loadWords() {
  if (!words) {
    words = fetch('/scrabble/words.txt')
      .then((res) => {
        if (!res.ok) throw new Error(`The word list did not load (${res.status})`);
        return res.text();
      })
      .then((text) => new Set(text.split('\n').map((w) => w.trim()).filter(Boolean)))
      .catch((err) => {
        words = null; // so the next open tries again
        throw err;
      });
  }
  return words;
}

export default function WordCheck({ open, onClose, initial = '' }) {
  const [list, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setText(initial);
    setResult(null);
    setFailed(false);
    loadWords()
      .then(setList)
      .catch(() => setFailed(true));
  }, [open, initial]);

  const check = (e) => {
    e?.preventDefault();
    const word = cleanWord(text);
    if (!word || !list) return;
    const ok = list.has(word.toLowerCase());
    setResult({ word, ok });
    if (ok) play('correct');
    else {
      play('wrong');
      buzz(60);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Is that a word?">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 text-3xl" style={SHOW_FONT}>Is that a word?</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="press flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={check} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 15));
            setResult(null);
          }}
          placeholder="Type the word"
          aria-label="The word to check"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-2xl border-2 border-[#d9c39a] bg-white px-4 py-3 text-2xl uppercase tracking-wider outline-none focus:border-emerald-600"
          style={SHOW_FONT}
        />
      </form>

      <div className="mt-4 min-h-[124px]">
        {failed ? (
          <p className="rounded-2xl bg-rose-100 p-3 font-semibold text-rose-700">
            The word list did not load. It needs a connection the first time; try again in a moment.
          </p>
        ) : !list ? (
          <p className="p-3 text-center font-semibold text-[#7a5c3e]">Opening the word list…</p>
        ) : result ? (
          <div className={cn('rounded-2xl p-4 text-center', result.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700')} role="status">
            <TileWord word={result.word} size={result.word.length > 8 ? 'sm' : 'md'} />
            <p className="mt-3 text-2xl" style={SHOW_FONT}>
              {result.ok ? '✓ In the word list' : '✗ Not in our word list'}
            </p>
          </div>
        ) : (
          <p className="p-3 text-center text-sm font-semibold text-[#7a5c3e]">Type a word and check it. Works offline once it has opened.</p>
        )}
      </div>

      <BigButton className="mt-2" onClick={check} disabled={!list || !cleanWord(text)}>
        Check it
      </BigButton>
      <p className="mt-3 text-xs leading-relaxed text-[#7a5c3e]">
        Checked against ENABLE, a free list of about 173,000 English words. It is close to the official Scrabble dictionaries but not the same: some newer words and two-letter words like QI and ZA are missing. If the table disagrees, the table wins.
      </p>
    </Sheet>
  );
}
