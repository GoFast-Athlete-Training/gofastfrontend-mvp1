import { LocalStorageAPI } from '../config/LocalStorageConfig';

/**
 * useHydratedAthlete - Local-only context reader (HYDRATION V2)
 * Reads athlete and crew context from LocalStorageAPI
 * Uses V2 keys (MyCrew, MyCrewManagerId) with legacy fallback
 * No derivation, no fallbacks - just reads what's there
 */
export default function useHydratedAthlete() {
  const athlete = LocalStorageAPI.getAthleteProfile();
  const athleteId = LocalStorageAPI.getAthleteId();
  
  // V2 keys (preferred) with legacy fallback
  const myCrew = LocalStorageAPI.getMyCrew();
  const myCrewManagerId = LocalStorageAPI.getMyCrewManagerId();
  const legacyRunCrewId = LocalStorageAPI.getRunCrewId();
  const legacyRunCrewManagerId = LocalStorageAPI.getRunCrewManagerId();
  
  // Use V2 keys if available, otherwise fall back to legacy
  const runCrewId = myCrew || legacyRunCrewId;
  const runCrewManagerId = myCrewManagerId || legacyRunCrewManagerId;
  
  const runCrew = LocalStorageAPI.getRunCrewData();

  return {
    athlete,
    athleteId,
    runCrewId,
    runCrewManagerId,
    runCrew
  };
}
