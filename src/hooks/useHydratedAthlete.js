import { LocalStorageAPI } from '../config/LocalStorageConfig';

/**
 * useHydratedAthlete - Local-only context reader
 * Reads athlete and crew context from LocalStorageAPI
 * No derivation, no fallbacks - just reads what's there
 */
export default function useHydratedAthlete() {
  const athlete = LocalStorageAPI.getAthleteProfile();
  const athleteId = LocalStorageAPI.getAthleteId();
  const runCrewId = LocalStorageAPI.getRunCrewId();
  const runCrewManagerId = LocalStorageAPI.getRunCrewManagerId();
  const runCrew = LocalStorageAPI.getRunCrewData();

  return {
    athlete,
    athleteId,
    runCrewId,
    runCrewManagerId,
    runCrew
  };
}
