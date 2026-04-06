import { useState, useEffect, useRef, useCallback } from 'react';

export default function useQuizRoom(roomCode, enabled = true) {
  const [roomState, setRoomState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!roomCode || !enabled) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/quiz/rooms/${roomCode}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
      retryCountRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          return;
        }
        setRoomState(data);
      } catch (e) {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();

      // Retry with backoff
      if (retryCountRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        retryCountRef.current++;
        setTimeout(connect, delay);
      } else {
        setError('Connection lost. Please refresh.');
      }
    };
  }, [roomCode, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  return { roomState, connected, error, disconnect };
}
