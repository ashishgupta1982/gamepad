import React from 'react';

export default function CountdownTimer({ timeLeft, totalTime, size = 80 }) {
  const progress = timeLeft / totalTime;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return '#26890c';
    if (progress > 0.25) return '#d89e00';
    return '#e21b3c';
  };

  const isUrgent = timeLeft <= 5;

  return (
    <div className={`relative inline-flex items-center justify-center ${isUrgent ? 'animate-pulse' : ''}`}
         style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{
          fontSize: size * 0.35,
          color: getColor()
        }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
