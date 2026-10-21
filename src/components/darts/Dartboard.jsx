import { useMemo, useRef, useState } from 'react';
import { BULL, RINGS, SEGMENTS, angleOf, hitAt, label } from '@/lib/darts/board';
import { cn } from '@/lib/cn';

// The dartboard you score on: tap where the dart landed.
//
// The rings are drawn wider than a real board's (lib/darts/board.js) so a
// treble is a thumb's width, and a press works like a phone keyboard: while the
// finger is down the region under it lights up with its name above it, sliding
// moves it, and lifting the finger scores it. Lifting off the board scores
// nothing, so a slip is just slid away.
//
//   dim(n)   numbers that do not count in this game, drawn faded
//   glow     regions to light up: [{ n, m, strong }]; m 0 lights the whole
//            segment (Around the Clock's target)
//   tags     a coloured badge on a number, for Killer: [{ n, color }]
//   darts    where this visit's darts landed, as pins
//   onHit    called with { n, m }; without it the board is only a picture

const COLOURS = {
  dark: '#272334',
  cream: '#f3e7c8',
  red: '#e5484d',
  green: '#1f9d64',
  wire: '#cbbf9f',
  band: '#17141f',
  rim: '#8a5a2b',
};

const pt = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [+(r * Math.sin(a)).toFixed(2), +(-r * Math.cos(a)).toFixed(2)];
};

function sector(r1, r2, a1, a2) {
  const [x1, y1] = pt(r2, a1);
  const [x2, y2] = pt(r2, a2);
  const [x3, y3] = pt(r1, a2);
  const [x4, y4] = pt(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

const disc = (r) => `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`;
// An annulus: drawn with fill-rule evenodd, the inner disc is the hole.
const ring = (r1, r2) => `${disc(r2)}${disc(r1)}`;

/** The outline of one scoring region, for highlights. */
function regionPath({ n, m }) {
  if (n === BULL) return m === 2 ? disc(RINGS.bull) : ring(RINGS.bull, RINGS.outerBull);
  const a = angleOf(n);
  const [a1, a2] = [a - 9, a + 9];
  if (!m) return sector(RINGS.outerBull, RINGS.double, a1, a2);
  if (m === 3) return sector(RINGS.innerSingle, RINGS.treble, a1, a2);
  if (m === 2) return sector(RINGS.outerSingle, RINGS.double, a1, a2);
  return sector(RINGS.outerBull, RINGS.innerSingle, a1, a2) + sector(RINGS.treble, RINGS.outerSingle, a1, a2);
}

/** Where a pin goes for a dart in a region. */
function pinAt({ n, m }, k) {
  if (n === BULL) return pt(m === 2 ? 4 + k * 3 : 17, k * 120);
  const r = { 1: 60 + k * 14, 2: 162, 3: 106 }[m];
  return pt(r, angleOf(n) + (k - 1) * 5);
}

// The board's fixed shapes, built once.
const SEGMENT_SHAPES = SEGMENTS.map((n, k) => {
  const a = k * 18;
  const [a1, a2] = [a - 9, a + 9];
  const even = k % 2 === 0;
  return {
    n,
    single: even ? COLOURS.dark : COLOURS.cream,
    ring: even ? COLOURS.red : COLOURS.green,
    paths: {
      inner: sector(RINGS.outerBull, RINGS.innerSingle, a1, a2),
      treble: sector(RINGS.innerSingle, RINGS.treble, a1, a2),
      outer: sector(RINGS.treble, RINGS.outerSingle, a1, a2),
      double: sector(RINGS.outerSingle, RINGS.double, a1, a2),
    },
    number: pt(188, a),
  };
});

export default function Dartboard({ onHit, dim, glow = [], tags = [], darts = [], className, font }) {
  const svgRef = useRef(null);
  const [aim, setAim] = useState(null); // { dart, x, y } while a finger is down
  const tagByNumber = useMemo(() => Object.fromEntries(tags.map((t) => [t.n, t])), [tags]);

  const locate = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400 - 200;
    const y = ((e.clientY - rect.top) / rect.height) * 400 - 200;
    return { dart: hitAt(x, y), x, y };
  };

  const handlers = onHit
    ? {
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setAim(locate(e));
        },
        onPointerMove: (e) => {
          if (aim) setAim(locate(e));
        },
        onPointerUp: (e) => {
          const { dart } = locate(e);
          setAim(null);
          if (dart) onHit(dart);
        },
        onPointerCancel: () => setAim(null),
      }
    : {};

  const faded = (n) => (dim ? dim(n) : false);
  // The name above the finger, kept on the board.
  const loupe = aim?.dart && { x: Math.max(-150, Math.min(150, aim.x)), y: Math.max(-170, aim.y - 70) };

  return (
    <svg
      ref={svgRef}
      viewBox="-200 -200 400 400"
      className={cn('block aspect-square w-full select-none', onHit && 'cursor-crosshair touch-none', className)}
      role={onHit ? 'application' : 'img'}
      aria-label={onHit ? 'Dartboard: tap where the dart landed' : 'Dartboard'}
      {...handlers}
    >
      <circle r="199" fill={COLOURS.band} stroke={COLOURS.rim} strokeWidth="6" />

      {SEGMENT_SHAPES.map((seg) => (
        <g key={seg.n} opacity={faded(seg.n) ? 0.28 : 1}>
          <path d={seg.paths.inner} fill={seg.single} />
          <path d={seg.paths.treble} fill={seg.ring} />
          <path d={seg.paths.outer} fill={seg.single} />
          <path d={seg.paths.double} fill={seg.ring} />
        </g>
      ))}
      {/* The wires. */}
      <g fill="none" stroke={COLOURS.wire} strokeWidth="1.2" opacity="0.7" pointerEvents="none">
        {[RINGS.outerBull, RINGS.innerSingle, RINGS.treble, RINGS.outerSingle, RINGS.double].map((r) => (
          <circle key={r} r={r} />
        ))}
        {SEGMENTS.map((_, k) => {
          const [x1, y1] = pt(RINGS.outerBull, k * 18 + 9);
          const [x2, y2] = pt(RINGS.double, k * 18 + 9);
          return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <g opacity={faded(BULL) ? 0.28 : 1}>
        <circle r={RINGS.outerBull} fill={COLOURS.green} stroke={COLOURS.wire} strokeWidth="1.2" />
        <circle r={RINGS.bull} fill={COLOURS.red} stroke={COLOURS.wire} strokeWidth="1.2" />
      </g>

      {/* Killer's numbers: the player's colour on their double and badge. */}
      {tags.map((t) => (
        <path key={`tag${t.n}`} d={regionPath({ n: t.n, m: 2 })} fill="none" fillRule="evenodd" stroke={t.color} strokeWidth="5" pointerEvents="none" />
      ))}

      {glow.map((g, i) => (
        <path
          key={`glow${i}`}
          d={regionPath(g)}
          fillRule="evenodd"
          fill="#fde68a"
          fillOpacity={g.strong ? 0.75 : 0.35}
          stroke="#fbbf24"
          strokeWidth={g.strong ? 4 : 2}
          className={g.strong ? 'animate-pulse' : undefined}
          pointerEvents="none"
        />
      ))}

      {SEGMENT_SHAPES.map((seg) => {
        const tag = tagByNumber[seg.n];
        return (
          <g key={`n${seg.n}`} pointerEvents="none" opacity={faded(seg.n) && !tag ? 0.4 : 1}>
            {tag && <circle cx={seg.number[0]} cy={seg.number[1]} r="13" fill={tag.color} stroke="#fff" strokeWidth="2" />}
            <text
              x={seg.number[0]}
              y={seg.number[1]}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="17"
              fill="#fff"
              style={font}
            >
              {seg.n}
            </text>
          </g>
        );
      })}

      {darts.map((d, k) =>
        d.n ? (
          <g key={`pin${k}`} pointerEvents="none">
            <circle cx={pinAt(d, k)[0]} cy={pinAt(d, k)[1]} r="7" fill="#fff" stroke="#111" strokeWidth="2.5" />
            <circle cx={pinAt(d, k)[0]} cy={pinAt(d, k)[1]} r="2.5" fill="#111" />
          </g>
        ) : null,
      )}

      {aim?.dart && (
        <g pointerEvents="none">
          <path d={regionPath(aim.dart)} fillRule="evenodd" fill="#ffffff" fillOpacity="0.55" stroke="#fff" strokeWidth="3" />
          <rect x={loupe.x - 46} y={loupe.y - 24} width="92" height="44" rx="14" fill="#111827" opacity="0.92" />
          <text x={loupe.x} y={loupe.y - 1} textAnchor="middle" dominantBaseline="central" fontSize="26" fill="#fde68a" style={font}>
            {label(aim.dart)}
          </text>
        </g>
      )}
    </svg>
  );
}
