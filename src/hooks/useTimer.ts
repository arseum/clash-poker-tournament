import { useEffect, useRef } from 'react';
import { useTournamentStore } from '../store/tournamentStore';

export function useTimer() {
  const { tournament, tickTimer, updateSecondsRemaining } = useTournamentStore();
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tournament?.isRunning) {
        // Correct drift when tab comes back to foreground
        const now = Date.now();
        const elapsed = Math.floor((now - lastTickRef.current) / 1000);
        if (elapsed > 1) {
          const corrected = Math.max(0, (tournament.secondsRemaining) - elapsed);
          updateSecondsRemaining(corrected);
        }
        lastTickRef.current = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tournament?.isRunning, tournament?.secondsRemaining, updateSecondsRemaining]);

  useEffect(() => {
    if (tournament?.isRunning) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        lastTickRef.current = Date.now();
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tournament?.isRunning, tickTimer]);
}
