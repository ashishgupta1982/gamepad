import { useState } from 'react';
import { HIERO_STYLE } from './fonts';
import { spellName, ALPHABET } from '@/lib/egypt/hieroglyphs';
import { cn } from '@/lib/cn';

// Type a name, see it in a cartouche, with a key saying which sign is which.
//
// Drawn vertically, the way most royal names stand on a statue or an obelisk,
// which also suits a phone held upright. The tie at the bottom is the knot of
// the rope that makes the loop.
export default function CartoucheMaker({ players, me }) {
  const [name, setName] = useState(players.find((p) => p.id === me)?.name || players[0]?.name || '');
  const [showAll, setShowAll] = useState(false);
  const signs = spellName(name);

  return (
    <section className="rounded-2xl border border-gold/50 bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-label="Cartouche maker">
      <h3 className="font-display text-xl font-semibold">Your name in a cartouche</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setName(p.name)}
            className={cn(
              'press min-h-[36px] rounded-full px-3 text-sm font-semibold',
              name === p.name ? 'bg-lapis text-white' : 'bg-white/70 text-papyrus-foreground',
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <label htmlFor="cartouche-name" className="sr-only">Name</label>
      <input
        id="cartouche-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type any name"
        maxLength={20}
        autoComplete="off"
        className="mt-2 min-h-touch w-full rounded-lg border border-gold/50 bg-white px-3 text-base text-foreground focus:border-lapis focus:outline-none"
      />

      <div className="mt-5 flex justify-center">
        {signs.length ? (
          <div className="flex flex-col items-center">
            <div
              className="flex min-h-40 min-w-[84px] flex-col items-center justify-center gap-1 rounded-[999px] border-[5px] border-game-egypt bg-white px-4 py-6 shadow-inner"
              aria-label={`${name} in hieroglyphs`}
              role="img"
            >
              {signs.map((s, i) => (
                <span key={i} className="text-5xl leading-none text-lapis" style={HIERO_STYLE} aria-hidden="true">
                  {s.glyph}
                </span>
              ))}
            </div>
            <span className="-mt-1 h-3 w-16 rounded-sm bg-game-egypt" aria-hidden="true" />
          </div>
        ) : (
          <p className="py-10 text-sm text-papyrus-foreground/70">Pick a name to see it written like a pharaoh’s.</p>
        )}
      </div>

      {signs.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {signs.map((s, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-sm">
              <span className="text-2xl leading-none text-lapis" style={HIERO_STYLE} aria-hidden="true">{s.glyph}</span>
              <span>
                <span className="font-semibold">{s.letters ? s.letters.toUpperCase() : '+'}</span>{' '}
                <span className="text-papyrus-foreground/75">{s.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-papyrus-foreground/75">
        Spelt by sound, the way Egyptologists write modern names. Ancient scribes left out most vowels, so a real
        cartouche of your name could look shorter.
      </p>

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="press mt-3 min-h-touch text-sm font-semibold text-lapis underline-offset-2 hover:underline"
        aria-expanded={showAll}
      >
        {showAll ? 'Hide the hieroglyph alphabet' : 'Show the whole hieroglyph alphabet'}
      </button>
      {showAll && (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ALPHABET.map((s) => (
            <li key={s.glyph} className="flex flex-col items-center rounded-lg bg-white/70 p-2 text-center">
              <span className="text-3xl leading-none text-lapis" style={HIERO_STYLE} aria-hidden="true">{s.glyph}</span>
              <span className="mt-1 text-xs font-semibold">{s.sound}</span>
              <span className="text-[11px] text-papyrus-foreground/70">{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
