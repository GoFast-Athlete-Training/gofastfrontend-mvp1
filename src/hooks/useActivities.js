import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { LocalStorageAPI } from '../config/LocalStorageConfig';

/**
 * useActivities - Fetches and manages weekly activities
 * 
 * Behavior:
 * 1. First tries to load from localStorage (fast)
 * 2. If empty or stale, fetches from backend
 * 3. Updates localStorage with fresh data
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
          console.log('✅ ACTIVITIES: Loaded from localStorage:', cachedActivities.length, 'activities');
          setActivities(cachedActivities);
          setWeeklyTotals(cachedTotals);
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

        console.log('✅ ACTIVITIES: Fetched from backend:', fetchedActivities.length, 'activities');
        
        setActivities(fetchedActivities);
        setWeeklyTotals(fetchedTotals);

        // Update localStorage cache
        const model = LocalStorageAPI.getFullHydrationModel();
        LocalStorageAPI.setFullHydrationModel({
          ...model,
          weeklyActivities: fetchedActivities,
          weeklyTotals: fetchedTotals
        });

        console.log('✅ ACTIVITIES: Updated localStorage cache');
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

