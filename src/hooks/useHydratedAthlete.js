import { useMemo, useRef } from 'react';
import { LocalStorageAPI } from '../config/LocalStorageConfig';

export default function useHydratedAthlete() {
  const cacheRef = useRef(null);

  return useMemo(() => {
    if (!cacheRef.current) {
      const athlete = LocalStorageAPI.getAthleteProfile();
      const athleteId = LocalStorageAPI.getAthleteId();
      const runCrewId = LocalStorageAPI.getRunCrewId();
      const runCrewAdminId = LocalStorageAPI.getRunCrewAdminId();

      cacheRef.current = {
        athlete,
        athleteId,
        runCrewId,
        runCrewAdminId
      };
    }

    return cacheRef.current;
  }, []);
}
