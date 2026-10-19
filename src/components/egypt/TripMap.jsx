import { Check } from 'lucide-react';
import { HIERO_STYLE } from './fonts';
import { stopStatus } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// A rough plan of a trip's site, with a pin for every stop.
//
// Drawn from `trip.map` (see data/egypt/giza.js): plan coordinates in metres,
// north up, so the pyramids sit where they really are relative to each other.
// The pins are buttons laid over the drawing rather than SVG shapes, so they
// stay a tappable size however small the map is drawn.
const LABEL = 'fill-papyrus-foreground text-[44px] font-semibold';

function Pyramid({ x, y, size }) {
  const h = size / 2;
  const [l, r, t, b] = [x - h, x + h, -y - h, -y + h];
  const c = `${x},${-y}`;
  return (
    <g>
      <polygon points={`${l},${t} ${r},${t} ${c}`} className="fill-gold/60" />
      <polygon points={`${r},${t} ${r},${b} ${c}`} className="fill-gold/90" />
      <polygon points={`${l},${b} ${r},${b} ${c}`} className="fill-game-egypt/70" />
      <polygon points={`${l},${t} ${l},${b} ${c}`} className="fill-game-egypt/45" />
    </g>
  );
}

function Feature({ f }) {
  const label = f.label ? (
    <text
      x={f.labelAt ? f.labelAt[0] : f.x}
      y={f.labelAt ? -f.labelAt[1] : -f.y}
      textAnchor={f.anchor || 'middle'}
      className={LABEL}
      style={{ paintOrder: 'stroke', stroke: 'hsl(var(--papyrus))', strokeWidth: 10 }}
    >
      {f.label}
    </text>
  ) : null;

  switch (f.type) {
    case 'pyramid':
      return (
        <g>
          <Pyramid x={f.x} y={f.y} size={f.size} />
          {label}
        </g>
      );
    case 'road':
      return (
        <g>
          <polyline
            points={f.points.map(([px, py]) => `${px},${-py}`).join(' ')}
            fill="none"
            className="stroke-papyrus-foreground/35"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {label}
        </g>
      );
    case 'temple':
      return <rect x={f.x - f.w / 2} y={-f.y - f.h / 2} width={f.w} height={f.h} className="fill-papyrus-foreground/45" />;
    case 'sphinx':
      return (
        <g>
          <rect x={f.x - 40} y={-f.y - 10} width="66" height="20" rx="10" className="fill-game-egypt/80" />
          <circle cx={f.x + 30} cy={-f.y} r="14" className="fill-game-egypt" />
          {label}
        </g>
      );
    case 'area':
      return (
        <g>
          <rect
            x={f.x - f.w / 2}
            y={-f.y - f.h / 2}
            width={f.w}
            height={f.h}
            rx="12"
            fill="none"
            className="stroke-papyrus-foreground/40"
            strokeWidth="6"
            strokeDasharray="18 14"
          />
          {label}
        </g>
      );
    case 'arrow':
      return (
        <g>
          <line
            x1={f.from[0]}
            y1={-f.from[1]}
            x2={f.to[0]}
            y2={-f.to[1]}
            className="stroke-lapis/70"
            strokeWidth="10"
            strokeLinecap="round"
            markerEnd="url(#trip-map-arrow)"
          />
          {label}
        </g>
      );
    case 'label':
      return label;
    default:
      return null;
  }
}

// Gold pins are this phone's player's stamps; the ring is their next stop.
export default function TripMap({ trip, progress, me, onOpenStop }) {
  const { view, features, pins } = trip.map;
  const [minX, minY, w, h] = view;
  const next = trip.stops.find((s) => !stopStatus(progress, s, me).stamped);

  return (
    <figure className="overflow-hidden rounded-2xl border border-gold/50 bg-papyrus shadow-sm">
      <div className="relative w-full" style={{ aspectRatio: `${w} / ${h}` }}>
        <svg viewBox={`${minX} ${-(minY + h)} ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <marker id="trip-map-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lapis/70" />
            </marker>
          </defs>
          {features.map((f, i) => (
            <Feature key={i} f={f} />
          ))}
          <text x={minX + 30} y={-(minY + h) + 70} className={LABEL}>
            N ↑
          </text>
        </svg>

        {trip.stops.map((stop, i) => {
          const at = pins[stop.id];
          if (!at) return null;
          const status = stopStatus(progress, stop, me);
          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => onOpenStop(stop.id)}
              aria-label={`Stop ${i + 1}: ${stop.title}${status.stamped ? ', stamped' : ''}`}
              className={cn(
                'press absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-bold shadow-md',
                status.stamped ? 'border-gold bg-gold text-lapis' : 'border-white bg-lapis text-white',
                next?.id === stop.id && 'ring-4 ring-gold/60',
              )}
              style={{ left: `${((at[0] - minX) / w) * 100}%`, top: `${((minY + h - at[1]) / h) * 100}%` }}
            >
              {status.stamped ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </button>
          );
        })}
      </div>
      <figcaption className="flex items-center gap-2 border-t border-gold/40 px-3 py-2 text-xs text-papyrus-foreground/80">
        <span className="text-base leading-none text-game-egypt" style={HIERO_STYLE} aria-hidden="true">𓉴</span>
        A rough map, north at the top. Tap a number to go to that stop.
      </figcaption>
    </figure>
  );
}
