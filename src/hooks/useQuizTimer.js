import { useState, useEffect, useCallback, useRef } from 'react';

export default function useQuizTimer(durationSeconds, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const start = useCallback(() => {
    setTimeLeft(durationSeconds);
    setStartTime(Date.now());
    setIsRunning(true);
  }, [durationSeconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(durationSeconds);
    setStartTime(null);
  }, [durationSeconds, stop]);

  const getElapsedMs = useCallback(() => {
    if (!startTime) return 0;
    return Date.now() - startTime;
  }, [startTime]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const progress = timeLeft / durationSeconds;

  return {
    timeLeft,
    isRunning,
    progress,
    start,
    stop,
    reset,
    getElapsedMs
  };
}
