// Each car's colour and vehicle, by the order it joined. Written out as whole
// class names: Tailwind only generates classes it can literally see.
const CAR_TONES = [
  { emoji: '🚗', solid: 'bg-sky-500 text-white', soft: 'bg-sky-100 text-sky-800', text: 'text-sky-600', edge: '[--toy-edge:theme(colors.sky.700)]' },
  { emoji: '🚙', solid: 'bg-rose-500 text-white', soft: 'bg-rose-100 text-rose-800', text: 'text-rose-600', edge: '[--toy-edge:theme(colors.rose.700)]' },
  { emoji: '🚕', solid: 'bg-amber-400 text-amber-950', soft: 'bg-amber-100 text-amber-900', text: 'text-amber-600', edge: '[--toy-edge:theme(colors.amber.600)]' },
  { emoji: '🚐', solid: 'bg-violet-500 text-white', soft: 'bg-violet-100 text-violet-800', text: 'text-violet-600', edge: '[--toy-edge:theme(colors.violet.700)]' },
  { emoji: '🛻', solid: 'bg-emerald-500 text-white', soft: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-600', edge: '[--toy-edge:theme(colors.emerald.700)]' },
  { emoji: '🏎️', solid: 'bg-orange-500 text-white', soft: 'bg-orange-100 text-orange-800', text: 'text-orange-600', edge: '[--toy-edge:theme(colors.orange.700)]' },
];

export function carTone(cars, carId) {
  const i = Math.max(0, (cars || []).findIndex((c) => c.carId === carId));
  return CAR_TONES[i % CAR_TONES.length];
}
