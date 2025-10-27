import React from 'react';

export default function WaitingScreen() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin text-purple-600 text-6xl mb-6">⚙️</div>
      <h2 className="text-3xl font-bold text-purple-600 mb-4">Preparing Your Quiz</h2>
      <p className="text-slate-600 text-lg">Creating amazing questions just for you...</p>
    </div>
  );
}

