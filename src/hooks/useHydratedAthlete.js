import { LocalStorageAPI } from '../config/LocalStorageConfig';

export default function useHydratedAthlete() {
  const athlete = LocalStorageAPI.getAthleteProfile();
  const athleteId = athlete?.athleteId || athlete?.id || null;

  const storedCrew = LocalStorageAPI.getRunCrewData();
  const storedRunCrewId = LocalStorageAPI.getRunCrewId();
  const storedRunCrewManagerId = LocalStorageAPI.getRunCrewManagerId();

  const primaryCrew = storedCrew
    || (Array.isArray(athlete?.runCrews) && athlete.runCrews.length > 0 ? athlete.runCrews[0] : null);

  const runCrewId = storedRunCrewId || primaryCrew?.id || null;
  const runCrewManagerId = storedRunCrewManagerId || null;

  return {
    athlete,
    athleteId,
    runCrewId,
    runCrewManagerId,
    primaryCrew
  };
}
