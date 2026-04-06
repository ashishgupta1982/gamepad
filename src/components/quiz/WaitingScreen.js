import React, { useState, useEffect } from 'react';

const QUIZ_FACTS = [
  "The word 'quiz' was allegedly invented in 1791 by a Dublin theatre owner on a bet!",
  "The average person forgets 90% of what they learn within 30 days.",
  "Octopuses have three hearts and blue blood.",
  "Honey never spoils. Archaeologists found 3000-year-old honey that was still edible!",
  "A group of flamingos is called a 'flamboyance'.",
  "The shortest war in history lasted 38 to 45 minutes.",
  "Bananas are berries, but strawberries aren't!",
  "The first computer bug was an actual bug found in a Harvard computer in 1947."
];

export default function WaitingScreen({ message }) {
  const [factIndex, setFactIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex(prev => (prev + 1) % QUIZ_FACTS.length);
    }, 4000);

    const dotTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(factTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Animated loader */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {message || 'Preparing Your Quiz'}{dots}
      </h2>
      <p className="text-slate-500 text-sm mb-8">
        Our AI is crafting the perfect questions for you
      </p>

      {/* Fun fact */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-5 max-w-md shadow-sm border border-purple-100">
        <div className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">Did you know?</div>
        <p className="text-slate-600 text-sm leading-relaxed transition-all">
          {QUIZ_FACTS[factIndex]}
        </p>
      </div>
    </div>
  );
}
