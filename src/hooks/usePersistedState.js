import { useEffect, useState } from "react";

/**
 * useState that transparently persists to localStorage.
 * Reads the stored value lazily on first render; writes on every change.
 */
export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch {
      /* corrupted storage — fall back to initial */
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — keep in-memory state */
    }
  }, [key, state]);

  return [state, setState];
}
