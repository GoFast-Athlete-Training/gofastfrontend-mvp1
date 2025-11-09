import { LocalStorageAPI } from '../config/LocalStorageConfig';

export default function useHydratedAthlete() {
  const athlete = LocalStorageAPI.getAthleteProfile();
  const athleteId = athlete?.athleteId || athlete?.id || null;

  const storedCrew = LocalStorageAPI.getRunCrewData();
  const storedRunCrewId = LocalStorageAPI.getRunCrewId();
  const storedRunCrewAdminId = LocalStorageAPI.getRunCrewAdminId();

  const primaryCrew = storedCrew
    || (Array.isArray(athlete?.runCrews) && athlete.runCrews.length > 0 ? athlete.runCrews[0] : null);

  const runCrewId = storedRunCrewId || primaryCrew?.id || null;
  const runCrewAdminId = storedRunCrewAdminId
    || (primaryCrew?.isAdmin ? primaryCrew?.id || null : null);

  return {
    athlete,
    athleteId,
    runCrewId,
    runCrewAdminId,
    primaryCrew
  };
}
