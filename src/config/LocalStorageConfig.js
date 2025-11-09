export const STORAGE_KEYS = {
  athleteProfile: 'athleteProfile',
  athleteId: 'athleteId',
  runCrewId: 'runCrewId',
  runCrewAdminId: 'runCrewAdminId',
  runCrewData: 'runCrewData'
};

export const LocalStorageAPI = {
  setAthleteProfile: (athlete) => {
    if (athlete) {
      localStorage.setItem(STORAGE_KEYS.athleteProfile, JSON.stringify(athlete));
    } else {
      localStorage.removeItem(STORAGE_KEYS.athleteProfile);
    }
  },
  getAthleteProfile: () => {
    const data = localStorage.getItem(STORAGE_KEYS.athleteProfile);
    return data ? JSON.parse(data) : null;
  },
  setAthleteId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.athleteId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.athleteId);
    }
  },
  getAthleteId: () => localStorage.getItem(STORAGE_KEYS.athleteId),
  setRunCrewId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.runCrewId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.runCrewId);
    }
  },
  getRunCrewId: () => localStorage.getItem(STORAGE_KEYS.runCrewId),
  setRunCrewAdminId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.runCrewAdminId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.runCrewAdminId);
    }
  },
  getRunCrewAdminId: () => localStorage.getItem(STORAGE_KEYS.runCrewAdminId),
  setRunCrewData: (crew) => {
    if (crew) {
      localStorage.setItem(STORAGE_KEYS.runCrewData, JSON.stringify(crew));
    } else {
      localStorage.removeItem(STORAGE_KEYS.runCrewData);
    }
  },
  getRunCrewData: () => {
    const data = localStorage.getItem(STORAGE_KEYS.runCrewData);
    return data ? JSON.parse(data) : null;
  },
  getContext: () => ({
    athleteId: LocalStorageAPI.getAthleteId(),
    runCrewId: LocalStorageAPI.getRunCrewId(),
    runCrewAdminId: LocalStorageAPI.getRunCrewAdminId()
  }),
  clearAll: () => localStorage.clear()
};
