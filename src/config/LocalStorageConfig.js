export const STORAGE_KEYS = {
  athleteProfile: 'athleteProfile',
  athleteId: 'athleteId',
  runCrewId: 'runCrewId',
  runCrewAdminId: 'runCrewAdminId'
};

export const LocalStorageAPI = {
  setAthleteProfile: (athlete) =>
    localStorage.setItem(STORAGE_KEYS.athleteProfile, JSON.stringify(athlete)),
  getAthleteProfile: () => {
    const data = localStorage.getItem(STORAGE_KEYS.athleteProfile);
    return data ? JSON.parse(data) : null;
  },
  setAthleteId: (id) => localStorage.setItem(STORAGE_KEYS.athleteId, id),
  getAthleteId: () => localStorage.getItem(STORAGE_KEYS.athleteId),
  setRunCrewId: (id) => localStorage.setItem(STORAGE_KEYS.runCrewId, id),
  getRunCrewId: () => localStorage.getItem(STORAGE_KEYS.runCrewId),
  setRunCrewAdminId: (id) =>
    localStorage.setItem(STORAGE_KEYS.runCrewAdminId, id),
  getRunCrewAdminId: () => localStorage.getItem(STORAGE_KEYS.runCrewAdminId),
  clearAll: () => localStorage.clear()
};
