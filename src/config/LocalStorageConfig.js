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
  clearRunCrewData: () => {
    localStorage.removeItem(STORAGE_KEYS.runCrewData);
    localStorage.removeItem(STORAGE_KEYS.runCrewId);
    localStorage.removeItem(STORAGE_KEYS.MyCrew);
    localStorage.removeItem(STORAGE_KEYS.runCrewManagerId);
    localStorage.removeItem(STORAGE_KEYS.MyCrewManagerId);
    console.log('✅ LocalStorageAPI: Cleared all crew data');
  },
  setCrewHydration: (runCrewId, crewData) => {
    if (!runCrewId || !crewData) return;

    try {
      const safeName = (athlete) => {
        if (!athlete) return '';
        const first = athlete.firstName ? athlete.firstName.trim() : '';
        const lastInitial = athlete.lastName ? `${athlete.lastName.trim().charAt(0)}.` : '';
        return `${first} ${lastInitial}`.trim();
      };

      const normalizeLeaderboard = (entries) => {
        if (!Array.isArray(entries)) return [];
        return entries
          .map((entry) => ({
            athleteId: entry.athleteId || entry.athlete?.id || null,
            firstName: entry.firstName || entry.athlete?.firstName || null,
            lastName: entry.lastName || entry.athlete?.lastName || null,
            photoURL: entry.photoURL || entry.athlete?.photoURL || null,
            totalDistanceMiles: Number(entry.totalDistanceMiles ?? 0),
            totalDuration: Number(entry.totalDuration ?? 0),
            totalCalories: Number(entry.totalCalories ?? 0),
            activityCount: Number(entry.activityCount ?? 0)
          }))
          .filter((entry) => entry.athleteId);
      };

      const normalizeRsvps = (rsvps) => {
        if (!Array.isArray(rsvps)) return [];
        return rsvps
          .map((rsvp) => ({
            athleteId: rsvp.athleteId || rsvp.athlete?.id || null,
            name: rsvp.name || safeName(rsvp.athlete),
            photoURL: rsvp.photoURL || rsvp.athlete?.photoURL || null,
            status: rsvp.status || 'going'
          }))
          .filter((rsvp) => rsvp.athleteId);
      };

      const safeRuns = Array.isArray(crewData.runs)
        ? crewData.runs.slice(0, 5).map((run) => ({
            id: run.id,
            title: run.title,
            date: run.date,
            time: run.time || run.startTime,
            meetUpPoint: run.meetUpPoint,
            meetUpAddress: run.meetUpAddress,
            totalMiles: run.totalMiles,
            pace: run.pace,
            description: run.description,
            stravaMapUrl: run.stravaMapUrl,
            rsvps: normalizeRsvps(run.rsvps)
          }))
        : [];

      const safeMessages = Array.isArray(crewData.messages)
        ? crewData.messages
            .slice(0, 10)
            .map((message) => ({
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              author: {
                athleteId: message.athleteId || message.athlete?.id || null,
                name: safeName(message.athlete),
                photoURL: message.athlete?.photoURL || null
              }
            }))
            .filter((message) => message.author.athleteId)
        : [];

      const membershipsSource = Array.isArray(crewData.memberships)
        ? crewData.memberships
        : Array.isArray(crewData.members)
        ? crewData.members
        : [];

      const memberPreviews = membershipsSource
        .map((membership) => {
          const athlete = membership.athlete || membership;
          const athleteId = membership.athleteId || athlete?.id || null;
          return {
            athleteId,
            name: safeName(athlete),
            photoURL: athlete?.photoURL || null
          };
        })
        .filter((member) => member.athleteId);

      const announcements = Array.isArray(crewData.announcements)
        ? crewData.announcements.map((announcement) => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            createdAt: announcement.createdAt,
            author: announcement.author
              ? {
                  id: announcement.author.id,
                  name: safeName(announcement.author),
                  photoURL: announcement.author.photoURL || null
                }
              : null
          }))
        : [];

      const sanitizedCrew = {
        id: crewData.id,
        name: crewData.name,
        description: crewData.description,
        logo: crewData.logo,
        icon: crewData.icon,
        isAdmin: Boolean(crewData.isAdmin),
        currentManagerId: crewData.currentManagerId || null,
        leaderboardDynamic: normalizeLeaderboard(crewData.leaderboardDynamic),
        memberPreviews,
        runs: safeRuns,
        messages: safeMessages,
        announcements
      };

      localStorage.setItem(
        `crew_${runCrewId}_hydration`,
        JSON.stringify(sanitizedCrew)
      );
    } catch (error) {
      console.error('❌ LocalStorageAPI: Failed to set crew hydration', error);
    }
  },
  getCrewHydration: (runCrewId) => {
    if (!runCrewId) return null;
    try {
      const data = localStorage.getItem(`crew_${runCrewId}_hydration`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ LocalStorageAPI: Failed to parse crew hydration', error);
      return null;
    }
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

    // Store full crew data if MyCrew ID exists and we have runCrewMemberships
    if (MyCrew && athlete.runCrewMemberships) {
      const crewMembership = athlete.runCrewMemberships.find(
        membership => membership.runCrew?.id === MyCrew
      );
      if (crewMembership?.runCrew) {
        LocalStorageAPI.setRunCrewData(crewMembership.runCrew);
        console.log('✅ LocalStorageAPI: Stored full crew data for:', crewMembership.runCrew.name);
      }
    }

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
