import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyActivities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load activities from localStorage (hydrated by universal hydrate route)
    const loadActivities = () => {
      setIsLoading(true);
      
      try {
        // Try loading from athleteProfile first (from hydrate)
        const storedProfile = localStorage.getItem('athleteProfile');
        if (storedProfile) {
          const athlete = JSON.parse(storedProfile);
          if (athlete.weeklyActivities) {
            setActivities(athlete.weeklyActivities);
            setWeeklyTotals(athlete.weeklyTotals);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to separate localStorage keys
        const storedActivities = localStorage.getItem('weeklyActivities');
        const storedTotals = localStorage.getItem('weeklyTotals');
        
        if (storedActivities) {
          setActivities(JSON.parse(storedActivities));
        }
        if (storedTotals) {
          setWeeklyTotals(JSON.parse(storedTotals));
        }
      } catch (error) {
        console.error('❌ MY ACTIVITIES: Error loading activities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActivities();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '0.0 mi';
    const miles = (meters / 1609.34).toFixed(2);
    return `${miles} mi`;
  };

  const formatPace = (meters, seconds) => {
    if (!meters || !seconds || seconds === 0) return '--:--';
    const miles = meters / 1609.34;
    const paceSeconds = Math.round(seconds / miles);
    const mins = Math.floor(paceSeconds / 60);
    const secs = paceSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/athlete-home')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
            </div>
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Weekly Summary */}
        {weeklyTotals && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">This Week</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{weeklyTotals.totalDistanceMiles || '0'}</p>
                <p className="text-sm text-gray-600">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{weeklyTotals.activityCount || 0}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{formatDuration(weeklyTotals.totalDuration)}</p>
                <p className="text-sm text-gray-600">Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{weeklyTotals.totalCalories || 0}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
            </div>
          </div>
        )}

        {/* Activities List */}
        {/* Filter for running activities only (MVP1) - backend already filters, but client-side safety */}
        {activities.filter(activity => {
          if (!activity.activityType) return false;
          const type = activity.activityType.toLowerCase();
          return type.includes('run') || type === 'running';
        }).length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Activities Yet</h3>
            <p className="text-gray-600 mb-6">Connect your Garmin device to start tracking activities!</p>
            <button
              onClick={() => navigate('/settings')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
            >
              Connect Garmin
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities
              .filter(activity => {
                // MVP1: Only show running activities
                if (!activity.activityType) return false;
                const type = activity.activityType.toLowerCase();
                return type.includes('run') || type === 'running';
              })
              .map((activity, index) => (
              <div
                key={activity.id || index}
                onClick={() => navigate(`/activity/${activity.id}`)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-orange-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏃‍♂️</span>
                      <div className="flex-1">
                        {/* ActivityName (bigger) */}
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {(activity.activityName && !activity.activityName.includes('Sample')) 
                            ? activity.activityName 
                            : (activity.activityType ? 
                                activity.activityType
                                  .replace(/_/g, ' ')
                                  .toLowerCase()
                                  .replace(/\b\w/g, l => l.toUpperCase())
                                : 'Activity')}
                        </h3>
                        {/* ActivityType (smaller with icon) */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">🏃</span>
                          <span className="text-sm text-gray-600">
                            {activity.activityType ? 
                              activity.activityType
                                .replace(/_/g, ' ')
                                .toLowerCase()
                                .replace(/\b\w/g, l => l.toUpperCase())
                              : 'Run'}
                          </span>
                          {activity.deviceName && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{activity.deviceName}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(activity.startTime)} at {formatTime(activity.startTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="font-semibold text-gray-900">{formatDistance(activity.distance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pace</p>
                        <p className="font-semibold text-gray-900">
                          {formatPace(activity.distance, activity.duration)}/mi
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900">{formatDuration(activity.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Calories</p>
                        <p className="font-semibold text-gray-900">{activity.calories || '--'}</p>
                      </div>
                    </div>

                    {activity.averageHeartRate && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">Avg Heart Rate</p>
                        <p className="font-semibold text-gray-900">{activity.averageHeartRate} bpm</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button className="text-orange-600 hover:text-orange-700 font-semibold">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivities;

