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
  athleteData: 'athleteData',
  crews: 'myCrews',
  onboarding: 'onboardingState'
};

export default function useHydratedAthlete() {
  const cacheRef = useRef(null);

  return useMemo(() => {
    if (!cacheRef.current) {
      const athlete = safeParse(window.localStorage.getItem(STORAGE_KEYS.athlete));
      const athleteData = safeParse(window.localStorage.getItem(STORAGE_KEYS.athleteData));
      const crews = safeParse(window.localStorage.getItem(STORAGE_KEYS.crews)) || [];
      const onboardingState = safeParse(window.localStorage.getItem(STORAGE_KEYS.onboarding));

      cacheRef.current = {
        athlete,
        athleteData,
        crews,
        onboardingState
      };
    }

    return cacheRef.current;
  }, []);
}
