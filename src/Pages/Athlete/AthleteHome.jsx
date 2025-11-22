import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import useActivities from '../../hooks/useActivities';
import api from '../../api/axiosConfig';
import { Activity, Users, Settings, MapPin, Clock, Calendar } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

const AthleteHome = () => {
  const navigate = useNavigate();
  
  // Use the hook to get all hydrated data from localStorage
  const { athlete: athleteProfile, athleteId, runCrewId, runCrewManagerId, runCrew } = useHydratedAthlete();

  // Fetch activities (with automatic refresh from backend if localStorage is empty)
  const { activities: weeklyActivities, weeklyTotals, isLoading: activitiesLoading } = useActivities(athleteId);

  // Check if user is an admin of the current crew
  const isCrewAdmin = useMemo(() => {
    return Boolean(runCrewManagerId);
  }, [runCrewManagerId]);
  
  const [crew, setCrew] = useState(runCrew);
  const [garminConnected, setGarminConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [isHydratingCrew, setIsHydratingCrew] = useState(false);

  // RUNCREW OR BUST: Redirect to join/create if no crew
  useEffect(() => {
    if (athleteProfile && !runCrewId) {
      console.log('🚨 ATHLETE HOME: No runcrew - redirecting to join/create (runcrew or bust)');
      navigate('/runcrew/join-or-start', { replace: true });
      return;
    }
  }, [athleteProfile, runCrewId, navigate]);

  // Hydrate crew if we have runCrewId but no crew data
  useEffect(() => {
    const hydrateCrew = async () => {
      if (runCrewId && athleteId && !crew && !isHydratingCrew) {
        setIsHydratingCrew(true);
        try {
          const { data } = await api.post('/runcrew/hydrate', { runCrewId, athleteId });
          if (data?.success && data.runCrew) {
            LocalStorageAPI.setRunCrewData(data.runCrew);
            setCrew(data.runCrew);
          }
        } catch (error) {
          console.error('Failed to hydrate crew:', error);
        } finally {
          setIsHydratingCrew(false);
        }
      } else if (runCrew) {
        setCrew(runCrew);
      }
    };
    hydrateCrew();
  }, [runCrewId, athleteId, runCrew]);

  // Check Garmin connection status
  useEffect(() => {
    const checkGarminConnection = async () => {
      if (!athleteId) {
        setCheckingConnection(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/garmin/status?athleteId=${athleteId}`);
        if (response.ok) {
          const data = await response.json();
          setGarminConnected(data.connected || false);
        }
      } catch (error) {
        console.error('Error checking Garmin connection:', error);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkGarminConnection();
  }, [athleteId]);

  // Get next run from crew
  const nextRun = useMemo(() => {
    if (!crew?.runs || !Array.isArray(crew.runs)) return null;
    const upcomingRuns = crew.runs
      .filter((run) => {
        const runDate = run.date || run.scheduledAt;
        if (!runDate) return false;
        return new Date(runDate) >= new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.scheduledAt);
        const dateB = new Date(b.date || b.scheduledAt);
        return dateA - dateB;
      });
    return upcomingRuns[0] || null;
  }, [crew]);

  // Get attendees for next run (first 3)
  const nextRunAttendees = useMemo(() => {
    if (!nextRun?.rsvps) return [];
    return nextRun.rsvps
      .filter(rsvp => rsvp.status === 'going')
      .slice(0, 3)
      .map(rsvp => rsvp.athlete || rsvp);
  }, [nextRun]);

  // Get latest activity
  const latestActivity = useMemo(() => {
    if (!weeklyActivities || weeklyActivities.length === 0) return null;
    return weeklyActivities[0]; // Already sorted by date desc
  }, [weeklyActivities]);

  // Format pace helper
  const formatPace = (activity) => {
    if (!activity.pace) return null;
    if (typeof activity.pace === 'string') return activity.pace;
    // If pace is in seconds per mile, convert to min:sec/mi
    if (typeof activity.pace === 'number') {
      const minutes = Math.floor(activity.pace / 60);
      const seconds = Math.floor(activity.pace % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
    }
    return null;
  };

  // Format distance helper
  const formatDistance = (activity) => {
    if (!activity.distance) return null;
    // If distance is in meters, convert to miles
    if (typeof activity.distance === 'number') {
      const miles = activity.distance / 1609.34;
      return `${miles.toFixed(1)} miles`;
    }
    return activity.distance;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      LocalStorageAPI.clearAll();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToCrew = () => {
    if (!runCrewId) {
      navigate('/runcrew/join-or-start');
      return;
    }
    const targetRoute = isCrewAdmin ? '/crew/crewadmin' : '/runcrew/central';
    navigate(targetRoute);
  };

  // Render guard: redirect if no athlete data
  if (!athleteProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
            <span className="text-xl font-bold text-gray-900">GoFast</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/athlete-profile')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              {athleteProfile?.photoURL ? (
                <img
                  src={athleteProfile.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : 'A'}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero: Your Run Crew */}
        {crew && runCrewId ? (
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{crew.name || 'Your Run Crew'}</h1>
                {crew.description && (
                  <p className="text-sky-50/90 text-lg">{crew.description}</p>
                )}
              </div>
              {crew.icon && (
                <span className="text-5xl">{crew.icon}</span>
              )}
            </div>

            {/* Next Run */}
            {nextRun ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Next Run</h2>
                </div>
                <div className="space-y-2 text-sky-50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {nextRun.date ? new Date(nextRun.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Date TBD'}
                      {nextRun.time || nextRun.startTime ? ` · ${nextRun.time || nextRun.startTime}` : ''}
                    </span>
                  </div>
                  {nextRun.meetUpPoint && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{nextRun.meetUpPoint}</span>
                    </div>
                  )}
                  {nextRunAttendees.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-2">
                        {nextRunAttendees.map((attendee, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                            {attendee.photoURL ? (
                              <img src={attendee.photoURL} alt={attendee.firstName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (attendee.firstName?.[0] || 'A').toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-sky-50/80">
                        {nextRun.rsvps?.filter(r => r.status === 'going').length || nextRunAttendees.length} going
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4">
                <p className="text-sky-50/80">No upcoming runs scheduled</p>
              </div>
            )}

            <button
              onClick={handleGoToCrew}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg"
            >
              View Crew →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-orange-200">
            <Users className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join or Create a Run Crew</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Join or create a Run Crew to get the most out of GoFast. Connect with other runners, coordinate runs, and stay accountable.
            </p>
            <button
              onClick={() => navigate('/runcrew/join-or-start')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition shadow-md"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Weekly Stats - Compact Horizontal Card */}
        {garminConnected && weeklyTotals && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Week</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals.totalDistanceMiles?.toFixed(1) || '0'}</p>
                <p className="text-sm text-gray-600">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals.activityCount || weeklyActivities?.length || 0}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{Math.round(weeklyTotals.totalCalories || 0)}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-activities')}
              className="mt-4 w-full text-sm text-orange-600 hover:text-orange-700 font-semibold hover:underline"
            >
              View All Activities →
            </button>
          </div>
        )}

        {/* Garmin Connection Prompt */}
        {!checkingConnection && !garminConnected && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
            <div className="flex items-center gap-4">
              <Activity className="h-12 w-12 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect Garmin to Track Activities</h3>
                <p className="text-sm text-gray-600">Sync your runs automatically and see your stats on the leaderboard</p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap"
              >
                Connect →
              </button>
            </div>
          </div>
        )}

        {/* Latest Run - Micro Card */}
        {latestActivity && (
          <div 
            onClick={() => navigate(`/activity/${latestActivity.id}`)}
            className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:border-orange-300 cursor-pointer transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Your Latest Run</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    {formatDistance(latestActivity) && (
                      <span>{formatDistance(latestActivity)}</span>
                    )}
                    {formatPace(latestActivity) && (
                      <span>· {formatPace(latestActivity)}</span>
                    )}
                    {latestActivity.startTime && (
                      <span>· {new Date(latestActivity.startTime).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}</span>
                    )}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* RSVP CTA - Only if crew has upcoming run */}
        {crew && nextRun && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Your crew is running soon — RSVP now
                </h3>
                <p className="text-sm text-gray-600">
                  {nextRun.title || 'Upcoming run'} on {nextRun.date ? new Date(nextRun.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'soon'}
                </p>
              </div>
              <button
                onClick={handleGoToCrew}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap"
              >
                RSVP →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AthleteHome;
