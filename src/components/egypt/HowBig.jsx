import { useState } from 'react';
import { cn } from '@/lib/cn';

// "How big is it?": the Great Pyramid beside things the family knows, then how
// many of you it would take, standing on each other's heads, to reach the top.
//
// The heights are the published ones: the pyramid as built (it has lost about
// 8 m off the top since), Blackpool Tower, the London Eye, the Elizabeth Tower
// (Big Ben) and the Statue of Liberty from the ground to the torch.
const PYRAMID_NEW = 146.6;
const PYRAMID_NOW = 138.5;
const PYRAMID_SIDE = 230.3;

const THINGS = [
  { name: 'Blackpool Tower', m: 158 },
  { name: 'Great Pyramid', m: PYRAMID_NEW, pyramid: true },
  { name: 'London Eye', m: 135 },
  { name: 'Big Ben', m: 96 },
  { name: 'Statue of Liberty', m: 93 },
];

const TOP = 165; // metres the chart reaches
const W = 300;
const H = 190;
const BASE_Y = 160;
const scale = (m) => (m / TOP) * (BASE_Y - 10);

export default function HowBig() {
  const [cm, setCm] = useState(150);
  const metres = cm / 100;
  const stack = Math.ceil(PYRAMID_NEW / metres);
  const along = Math.round(PYRAMID_SIDE / metres);
  const slot = W / THINGS.length;

  return (
    <section className="rounded-2xl border border-gold/50 bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-label="How big is it?">
      <h3 className="font-display text-xl font-semibold">How big is it?</h3>
      <p className="mt-1 text-sm leading-relaxed">The Great Pyramid as it was built, next to some things you might know.</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="The Great Pyramid at 146.6 metres, between Blackpool Tower at 158 metres and the London Eye at 135 metres, and much taller than Big Ben and the Statue of Liberty">
        <line x1="0" y1={BASE_Y} x2={W} y2={BASE_Y} className="stroke-papyrus-foreground/40" strokeWidth="1" />
        {THINGS.map((t, i) => {
          const cx = slot * i + slot / 2;
          const h = scale(t.m);
          const top = BASE_Y - h;
          return (
            <g key={t.name}>
              {t.pyramid ? (
                <>
                  <polygon points={`${cx - slot / 2 + 2},${BASE_Y} ${cx},${top} ${cx + slot / 2 - 2},${BASE_Y}`} className="fill-gold" />
                  {/* What it has lost off the top since. */}
                  <polygon
                    points={`${cx - ((PYRAMID_NEW - PYRAMID_NOW) / PYRAMID_NEW) * (slot / 2 - 2)},${BASE_Y - scale(PYRAMID_NOW)} ${cx},${top} ${cx + ((PYRAMID_NEW - PYRAMID_NOW) / PYRAMID_NEW) * (slot / 2 - 2)},${BASE_Y - scale(PYRAMID_NOW)}`}
                    className="fill-white/70"
                  />
                </>
              ) : (
                <rect x={cx - 7} y={top} width="14" height={h} rx="3" className="fill-lapis/70" />
              )}
              <text x={cx} y={top - 5} textAnchor="middle" className={cn('fill-current text-[10px] font-semibold', t.pyramid && 'fill-game-egypt')}>
                {t.m} m
              </text>
              <text x={cx} y={BASE_Y + 14} textAnchor="middle" className="fill-current text-[8.5px]">
                {t.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-papyrus-foreground/75">The pale tip is the 8 metres or so it has lost since. Today it is about {PYRAMID_NOW} m.</p>

      <div className="mt-5 rounded-xl bg-white/70 p-3">
        <label htmlFor="howbig-height" className="flex items-baseline justify-between text-sm font-semibold">
          How tall are you? <span className="tnum font-display text-lg text-lapis">{cm} cm</span>
        </label>
        <input
          id="howbig-height"
          type="range"
          min="100"
          max="200"
          step="1"
          value={cm}
          onChange={(e) => setCm(Number(e.target.value))}
          className="mt-2 w-full accent-lapis"
        />
        <p className="mt-3 text-[15px] leading-relaxed">
          It would take <strong className="tnum font-display text-xl text-game-egypt">{stack}</strong> of you, standing on each
          other’s heads, to reach the top when it was new.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed">
          And <strong className="tnum font-display text-xl text-game-egypt">{along}</strong> of you lying head to toe to cross one
          side of the base.
        </p>
      </div>
    </section>
  );
}
