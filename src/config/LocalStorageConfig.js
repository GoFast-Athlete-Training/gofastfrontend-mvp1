export const STORAGE_KEYS = {
  athleteProfile: 'athleteProfile',
  athleteId: 'athleteId',
  // HYDRATION V2: Clean crew context keys
  MyCrew: 'MyCrew', // Primary crew ID (replaces runCrewId)
  MyCrewManagerId: 'MyCrewManagerId', // Manager record ID (replaces runCrewManagerId)
  // Legacy keys (for backward compatibility)
  runCrewId: 'runCrewId',
  runCrewManagerId: 'runCrewManagerId',
  runCrewData: 'runCrewData',
  runCrewMemberships: 'runCrewMemberships',
  runCrewManagers: 'runCrewManagers',
  weeklyActivities: 'weeklyActivities',
  weeklyTotals: 'weeklyTotals',
  hydrationVersion: 'hydrationVersion'
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
  setRunCrewManagerId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.runCrewManagerId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.runCrewManagerId);
    }
  },
  getRunCrewManagerId: () => localStorage.getItem(STORAGE_KEYS.runCrewManagerId),
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
    runCrewManagerId: LocalStorageAPI.getRunCrewManagerId()
  }),
  
  /**
   * setFullHydrationModel - Store the complete Prisma model from /api/athlete/hydrate
   * This captures the entire athlete object tree including all relations
   */
  setFullHydrationModel: (model) => {
    if (!model) return;

    const { athlete, weeklyActivities, weeklyTotals } = model;

    if (!athlete) {
      console.warn('⚠️ LocalStorageAPI: No athlete in model');
      return;
    }

    // Store the entire athlete object
    localStorage.setItem(STORAGE_KEYS.athleteProfile, JSON.stringify(athlete));
    localStorage.setItem(STORAGE_KEYS.athleteId, athlete.id || athlete.athleteId);

    // Cache run crews, managers, and admin crews if they exist
    if (athlete.runCrewMemberships) {
      localStorage.setItem(STORAGE_KEYS.runCrewMemberships, JSON.stringify(athlete.runCrewMemberships));
    }
    if (athlete.runCrewManagers) {
      localStorage.setItem(STORAGE_KEYS.runCrewManagers, JSON.stringify(athlete.runCrewManagers));
    }
    if (athlete.adminRunCrews) {
      localStorage.setItem(STORAGE_KEYS.adminRunCrews, JSON.stringify(athlete.adminRunCrews));
    }

    // HYDRATION V2: Use clean crew context from backend
    const MyCrew = athlete.MyCrew || '';
    const MyCrewManagerId = athlete.MyCrewManagerId || '';

    localStorage.setItem(STORAGE_KEYS.MyCrew, MyCrew);
    localStorage.setItem(STORAGE_KEYS.MyCrewManagerId, MyCrewManagerId);

    // Legacy keys for backward compatibility
    localStorage.setItem(STORAGE_KEYS.runCrewId, MyCrew);
    localStorage.setItem(STORAGE_KEYS.runCrewManagerId, MyCrewManagerId);

    console.log('✅ LocalStorageAPI: HYDRATION V2 - MyCrew:', MyCrew, 'MyCrewManagerId:', MyCrewManagerId);

    // Activities and totals
    if (weeklyActivities) {
      localStorage.setItem(STORAGE_KEYS.weeklyActivities, JSON.stringify(weeklyActivities));
    }
    if (weeklyTotals) {
      localStorage.setItem(STORAGE_KEYS.weeklyTotals, JSON.stringify(weeklyTotals));
    }

    // Version marker
    localStorage.setItem(STORAGE_KEYS.hydrationVersion, 'hydration-v2');

    console.log('✅ LocalStorageAPI: HYDRATION V2 model stored');
  },

  // HYDRATION V2: Getters for new keys
  getMyCrew: () => localStorage.getItem(STORAGE_KEYS.MyCrew),
  getMyCrewManagerId: () => localStorage.getItem(STORAGE_KEYS.MyCrewManagerId),

  /**
   * getFullHydrationModel - Retrieve the complete hydration model
   */
  getFullHydrationModel: () => {
    try {
      const athlete = JSON.parse(localStorage.getItem(STORAGE_KEYS.athleteProfile) || 'null');
      const weeklyActivities = JSON.parse(localStorage.getItem(STORAGE_KEYS.weeklyActivities) || '[]');
      const weeklyTotals = JSON.parse(localStorage.getItem(STORAGE_KEYS.weeklyTotals) || 'null');
      const runCrewMemberships = JSON.parse(localStorage.getItem(STORAGE_KEYS.runCrewMemberships) || '[]');
      const runCrewManagers = JSON.parse(localStorage.getItem(STORAGE_KEYS.runCrewManagers) || '[]');
      const adminRunCrews = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminRunCrews) || '[]');

      return {
        athlete,
        weeklyActivities,
        weeklyTotals,
        runCrewMemberships,
        runCrewManagers,
        adminRunCrews
      };
    } catch (error) {
      console.error('❌ LocalStorageAPI: Failed to parse hydration model', error);
      return {
        athlete: null,
        weeklyActivities: [],
        weeklyTotals: null,
        runCrewMemberships: [],
        runCrewManagers: [],
        adminRunCrews: []
      };
    }
  },

  clearAll: () => localStorage.clear()
};
