import { useRef, useCallback } from 'react';

/**
 * Hook to debounce analysis calls and prevent rapid re-analysis
 * Enforces 2-second cooldown between analysis requests
 */
export function useAnalysisDebounce(delay: number = 2000) {
  const lastCallTimeRef = useRef<number>(0);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounce = useCallback((fn: () => void) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // Clear any pending timeout
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
    }

    // If enough time has passed, execute immediately
    if (timeSinceLastCall >= delay) {
      lastCallTimeRef.current = now;
      fn();
      return;
    }

    // Otherwise, schedule for later
    const remainingTime = delay - timeSinceLastCall;
    pendingTimeoutRef.current = setTimeout(() => {
      lastCallTimeRef.current = Date.now();
      fn();
    }, remainingTime);
  }, [delay]);

  const canAnalyze = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    return timeSinceLastCall >= delay;
  }, [delay]);

  return { debounce, canAnalyze };
}
