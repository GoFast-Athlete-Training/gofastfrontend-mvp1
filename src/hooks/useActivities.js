import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { LocalStorageAPI } from '../config/LocalStorageConfig';

/**
 * Filter activities to only running activities (exclude wheelchair)
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Filtered array of running activities
 */
const filterRunningActivities = (activities) => {
  if (!Array.isArray(activities)) return [];
  return activities.filter(activity => {
    if (!activity.activityType) return false;
    const type = activity.activityType.toLowerCase();
    // Include activities with "running" or "run" in the type, but exclude wheelchair
    return (type.includes('running') || type === 'run') && !type.includes('wheelchair');
  });
};

/**
 * Calculate weekly totals for running activities only
 * @param {Array} activities - Array of running activity objects
 * @returns {Object} { totalDistance, totalDistanceMiles, totalDuration, totalCalories, activityCount }
 */
const calculateRunTotals = (activities) => {
  const totals = {
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    activityCount: activities.length
  };
  
  activities.forEach(activity => {
    if (activity.distance) totals.totalDistance += activity.distance;
    if (activity.duration) totals.totalDuration += activity.duration;
    if (activity.calories) totals.totalCalories += activity.calories;
  });
  
  // Convert distance from meters to miles
  totals.totalDistanceMiles = (totals.totalDistance / 1609.34).toFixed(2);
  
  return totals;
};

/**
 * useActivities - Fetches and manages weekly activities (RUNS ONLY)
 * 
 * Behavior:
 * 1. First tries to load from localStorage (fast)
 * 2. If empty or stale, fetches from backend
 * 3. Filters to only running activities (safety net)
 * 4. Recalculates totals for runs only
 * 5. Updates localStorage with fresh data
 * 
 * @param {string} athleteId - Athlete ID to fetch activities for
 * @param {boolean} forceRefresh - Force refresh from backend even if localStorage has data
 * @returns {Object} { activities, weeklyTotals, isLoading, error, refresh }
 */
export default function useActivities(athleteId, forceRefresh = false) {
  const [activities, setActivities] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    if (!athleteId) {
      console.log('⏳ ACTIVITIES: Waiting for athleteId...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try localStorage first (unless force refresh)
      if (!forceRefresh) {
        const model = LocalStorageAPI.getFullHydrationModel();
        const cachedActivities = model?.weeklyActivities || [];
        const cachedTotals = model?.weeklyTotals || null;

        if (cachedActivities.length > 0) {
          // Filter to runs only and recalculate totals (safety net)
          const filteredRuns = filterRunningActivities(cachedActivities);
          const recalculatedTotals = calculateRunTotals(filteredRuns);
          
          console.log('✅ ACTIVITIES: Loaded from localStorage:', cachedActivities.length, 'total activities,', filteredRuns.length, 'runs');
          setActivities(filteredRuns);
          setWeeklyTotals(recalculatedTotals);
          setIsLoading(false);
          
          // Still fetch in background to update cache
          fetchFromBackend(athleteId).catch(err => {
            console.warn('⚠️ ACTIVITIES: Background fetch failed (non-critical):', err);
          });
          return;
        }
      }

      // Fetch from backend
      await fetchFromBackend(athleteId);
    } catch (err) {
      console.error('❌ ACTIVITIES: Error fetching activities:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchFromBackend = async (athleteId) => {
    try {
      console.log('🔄 ACTIVITIES: Fetching from backend for athleteId:', athleteId);
      
      const response = await api.get(`/athlete/${athleteId}/activities/weekly`);
      
      if (response.data?.success) {
        const fetchedActivities = response.data.activities || [];
        const fetchedTotals = response.data.weeklyTotals || null;

        // Filter to runs only and recalculate totals (safety net - backend should already filter, but ensure consistency)
        const filteredRuns = filterRunningActivities(fetchedActivities);
        const recalculatedTotals = calculateRunTotals(filteredRuns);

        console.log('✅ ACTIVITIES: Fetched from backend:', fetchedActivities.length, 'total activities,', filteredRuns.length, 'runs');
        
        setActivities(filteredRuns);
        setWeeklyTotals(recalculatedTotals);

        // Update localStorage cache with filtered runs and recalculated totals
        const model = LocalStorageAPI.getFullHydrationModel();
        LocalStorageAPI.setFullHydrationModel({
          ...model,
          weeklyActivities: filteredRuns,
          weeklyTotals: recalculatedTotals
        });

        console.log('✅ ACTIVITIES: Updated localStorage cache with', filteredRuns.length, 'runs');
      } else {
        throw new Error(response.data?.error || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('❌ ACTIVITIES: Backend fetch error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have an athleteId
    if (athleteId) {
      console.log('🔄 ACTIVITIES: useEffect triggered, athleteId:', athleteId);
      fetchActivities();
    } else {
      console.log('⏳ ACTIVITIES: useEffect waiting for athleteId');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, forceRefresh]);

  const refresh = () => {
    fetchActivities();
  };

  return {
    activities,
    weeklyTotals,
    isLoading,
    error,
    refresh
  };
}

