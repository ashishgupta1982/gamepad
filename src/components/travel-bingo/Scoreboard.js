export default function Scoreboard({ cars, winnerCarId, myCarId }) {
  const sorted = [...cars].sort((a, b) => {
    const fa = (a.card || []).filter(t => t.found).length;
    const fb = (b.card || []).filter(t => t.found).length;
    return fb - fa;
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-emerald-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Scoreboard</p>
      <ul className="space-y-2">
        {sorted.map((c) => {
          const total = c.card?.length || 9;
          const found = (c.card || []).filter(t => t.found).length;
          const pct = total ? Math.round((found / total) * 100) : 0;
          const isWinner = winnerCarId === c.carId;
          return (
            <li key={c.carId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 flex items-center gap-2">
                  {isWinner && <span>🏆</span>}
                  <span>{c.name}</span>
                  {c.carId === myCarId && <span className="text-xs text-emerald-700">(you)</span>}
                </span>
                <span className="font-mono text-xs text-slate-600">{found}/{total}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isWinner ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
