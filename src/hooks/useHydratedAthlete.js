import { useMemo, useRef } from 'react';
import { LocalStorageAPI } from '../config/LocalStorageConfig';

export default function useHydratedAthlete() {
  const cacheRef = useRef(null);

  return useMemo(() => {
    if (!cacheRef.current) {
      const athlete = LocalStorageAPI.getAthleteProfile();
      const athleteId = athlete?.athleteId || athlete?.id || null;

      const primaryCrew = Array.isArray(athlete?.runCrews) && athlete.runCrews.length > 0
        ? athlete.runCrews[0]
        : null;

      const runCrewId = primaryCrew?.id || null;
      const runCrewAdminId = primaryCrew?.isAdmin ? primaryCrew.id : null;

      cacheRef.current = {
        athlete,
        athleteId,
        runCrewId,
        runCrewAdminId,
        primaryCrew
      };
    }

    return cacheRef.current;
  }, []);
}
