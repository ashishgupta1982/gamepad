import { useState } from 'react';

// "Could you build it?": pick how many years the Great Pyramid took, and see
// the pace that means, block by block.
//
// The inputs are the published estimates: about 2.3 million blocks averaging
// about 2.5 tonnes. Herodotus was told 20 years; the Diary of Merer shows the
// work still going on in Khufu's 27th year. The working day is an assumption,
// and the card says so.
const BLOCKS = 2_300_000;
const TONNES_PER_BLOCK = 2.5;
const HOURS_PER_DAY = 10;
const ELEPHANT_TONNES = 6;

const n = (x) => Math.round(x).toLocaleString('en-GB');

function every(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m} minute${m === 1 ? '' : 's'} ${s} seconds` : `${m} minute${m === 1 ? '' : 's'}`;
}

export default function PyramidMaths() {
  const [years, setYears] = useState(20);
  const perDay = BLOCKS / (years * 365);
  const seconds = (HOURS_PER_DAY * 3600) / perDay;
  const tonnes = perDay * TONNES_PER_BLOCK;

  return (
    <section className="rounded-2xl border border-gold/50 bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-label="Pyramid maths">
      <h3 className="font-display text-xl font-semibold">Pyramid maths: could you build it?</h3>
      <p className="mt-1 text-sm leading-relaxed">
        About 2.3 million blocks. The Greek historian Herodotus was told it took 20 years. Pick a number of years and see
        how fast the builders had to go.
      </p>

      <div className="mt-4 rounded-xl bg-white/70 p-3">
        <label htmlFor="pyramid-years" className="flex items-baseline justify-between text-sm font-semibold">
          Years to build it <span className="tnum font-display text-lg text-lapis">{years}</span>
        </label>
        <input
          id="pyramid-years"
          type="range"
          min="10"
          max="30"
          step="1"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="mt-2 w-full accent-lapis"
        />

        <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-papyrus p-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-papyrus-foreground/75">Blocks a day</dt>
            <dd className="tnum font-display text-2xl font-semibold text-game-egypt">{n(perDay)}</dd>
          </div>
          <div className="rounded-lg bg-papyrus p-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-papyrus-foreground/75">Tonnes a day</dt>
            <dd className="tnum font-display text-2xl font-semibold text-game-egypt">{n(tonnes)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-[15px] leading-relaxed">
          That is one block set in place every <strong>{every(seconds)}</strong>, ten hours a day, every day for {years} years.
          A day’s stone weighs as much as about <strong className="tnum">{n(tonnes / ELEPHANT_TONNES)}</strong> elephants.
        </p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-papyrus-foreground/75">
        This counts every day of the year with no days off, so the real pace on working days was even faster. Teams worked on
        many blocks at once, quarrying, dragging and lifting at the same time.
      </p>
    </section>
  );
}
