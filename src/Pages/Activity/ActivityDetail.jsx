import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ActivityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load activity from localStorage (find by id in weeklyActivities array)
    const loadActivity = () => {
      setIsLoading(true);
      
      try {
        // Try loading from athleteProfile first
        const storedProfile = localStorage.getItem('athleteProfile');
        let activities = [];
        
        if (storedProfile) {
          const athlete = JSON.parse(storedProfile);
          if (athlete.weeklyActivities) {
            activities = athlete.weeklyActivities;
          }
        }
        
        // Fallback to separate localStorage key
        if (activities.length === 0) {
          const storedActivities = localStorage.getItem('weeklyActivities');
          if (storedActivities) {
            activities = JSON.parse(storedActivities);
          }
        }
        
        // Find the specific activity by id
        const foundActivity = activities.find(a => a.id === id || a.sourceActivityId === id);
        
        if (foundActivity) {
          setActivity(foundActivity);
        } else {
          console.error('❌ ACTIVITY DETAIL: Activity not found:', id);
        }
      } catch (error) {
        console.error('❌ ACTIVITY DETAIL: Error loading activity:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadActivity();
    } else {
      setIsLoading(false);
    }
  }, [id]);

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
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity Not Found</h2>
          <button
            onClick={() => navigate('/my-activities')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  const hasDetailData = activity.detailData && Object.keys(activity.detailData).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/my-activities')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Activity Details</h1>
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
        {/* Activity Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🏃‍♂️</div>
            <div className="flex-1">
              {/* ActivityName (bigger) */}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {(activity.activityName && !activity.activityName.includes('Sample')) 
                  ? activity.activityName 
                  : (activity.activityType ? 
                      activity.activityType
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())
                      : 'Activity')}
              </h2>
              {/* ActivityType (smaller with icon) */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">🏃</span>
                <span className="text-base text-gray-600">
                  {activity.activityType ? 
                    activity.activityType
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, l => l.toUpperCase())
                    : 'Run'}
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm font-semibold text-gray-700">
                  {activity.deviceName ? `GARMIN ${activity.deviceName}` : 'GARMIN [NO DEVICE]'}
                </span>
              </div>
              <p className="text-gray-600">
                {formatDate(activity.startTime)} at {formatTime(activity.startTime)}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{formatDistance(activity.distance)}</p>
              <p className="text-sm text-gray-600 mt-1">Distance</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{formatDuration(activity.duration)}</p>
              <p className="text-sm text-gray-600 mt-1">Duration</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {formatPace(activity.distance, activity.duration)}/mi
              </p>
              <p className="text-sm text-gray-600 mt-1">Pace</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{activity.calories || '--'}</p>
              <p className="text-sm text-gray-600 mt-1">Calories</p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activity.averageHeartRate && (
              <div>
                <p className="text-sm text-gray-500">Average Heart Rate</p>
                <p className="text-lg font-semibold text-gray-900">{activity.averageHeartRate} bpm</p>
              </div>
            )}
            {activity.maxHeartRate && (
              <div>
                <p className="text-sm text-gray-500">Max Heart Rate</p>
                <p className="text-lg font-semibold text-gray-900">{activity.maxHeartRate} bpm</p>
              </div>
            )}
            {activity.elevationGain && (
              <div>
                <p className="text-sm text-gray-500">Elevation Gain</p>
                <p className="text-lg font-semibold text-gray-900">{activity.elevationGain} ft</p>
              </div>
            )}
            {activity.averageSpeed && (
              <div>
                <p className="text-sm text-gray-500">Average Speed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(activity.averageSpeed * 2.237).toFixed(1)} mph
                </p>
              </div>
            )}
            {activity.maxSpeed && (
              <div>
                <p className="text-sm text-gray-500">Max Speed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(activity.maxSpeed * 2.237).toFixed(1)} mph
                </p>
              </div>
            )}
            {activity.averageCadence && (
              <div>
                <p className="text-sm text-gray-500">Average Cadence</p>
                <p className="text-lg font-semibold text-gray-900">{activity.averageCadence} spm</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Data Section (when available) */}
        {hasDetailData ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Analysis</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold">✨ Enhanced Data Available</p>
              <p className="text-green-600 text-sm mt-1">
                This activity includes detailed metrics like heart rate zones, training effect, and more!
              </p>
            </div>
            
            {activity.detailData.trainingEffect && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Training Effect</h4>
                <div className="grid grid-cols-2 gap-4">
                  {activity.detailData.trainingEffect.aerobic && (
                    <div>
                      <p className="text-sm text-gray-500">Aerobic</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {activity.detailData.trainingEffect.aerobic}
                      </p>
                    </div>
                  )}
                  {activity.detailData.trainingEffect.anaerobic && (
                    <div>
                      <p className="text-sm text-gray-500">Anaerobic</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {activity.detailData.trainingEffect.anaerobic}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activity.detailData.heartRateZones && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Heart Rate Zones</h4>
                <div className="space-y-2">
                  {Object.entries(activity.detailData.heartRateZones).map(([zone, time]) => (
                    <div key={zone} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Zone {zone}</span>
                      <span className="font-semibold text-gray-900">{formatDuration(time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activity.detailData.lapSummaries && activity.detailData.lapSummaries.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Lap Summaries</h4>
                <p className="text-sm text-gray-600">
                  {activity.detailData.lapSummaries.length} lap(s) recorded
                </p>
              </div>
            )}

            {activity.detailData.samples && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Sample Data</h4>
                <p className="text-sm text-gray-600">
                  {activity.detailData.samples?.length || 0} data points recorded
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Detailed sample data available for advanced analysis
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Analysis</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">
                Detailed metrics are being processed. Check back soon for enhanced data including heart rate zones, training effect, and more!
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/my-activities')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Activities
          </button>
          <button
            onClick={() => navigate('/athlete-home')}
            className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;

