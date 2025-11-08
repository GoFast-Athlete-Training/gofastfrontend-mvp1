import { useMemo, useRef } from 'react';

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[WARN] useHydratedAthlete: Failed to parse value from localStorage', error);
    return null;
  }
};

const STORAGE_KEYS = {
  athlete: 'athleteProfile',
  runCrewId: 'runCrewId'
};

export default function useHydratedAthlete() {
  const cacheRef = useRef(null);

  return useMemo(() => {
    if (!cacheRef.current) {
      const athlete = safeParse(window.localStorage.getItem(STORAGE_KEYS.athlete));

      const athleteId = athlete?.athleteId || athlete?.id || null;

      const storedRunCrewId = window.localStorage.getItem(STORAGE_KEYS.runCrewId);
      const runCrewId = storedRunCrewId !== null
        ? (storedRunCrewId || null)
        : (athlete?.runCrewId || null);

      cacheRef.current = {
        athlete,
        athleteId,
        runCrewId
      };
    }

    return cacheRef.current;
  }, []);
}
