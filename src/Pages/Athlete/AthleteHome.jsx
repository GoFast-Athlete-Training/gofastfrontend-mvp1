import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import UserOnboardingCalculationService from '../../utils/UserOnboardingCalculationService';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { Activity, Users, Calendar, Settings } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

const AthleteHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the hook to get all hydrated data from localStorage
  const { athlete: athleteProfile, athleteId, runCrewId, runCrewManagerId, runCrew } = useHydratedAthlete();

  // Check if user is an admin of the current crew - if they have a managerId, they're an admin
  const isCrewAdmin = useMemo(() => {
    return Boolean(runCrewManagerId);
  }, [runCrewManagerId]);
  
  const [onboardingState, setOnboardingState] = useState(null);
  const [displayCards, setDisplayCards] = useState([]);
  const [weeklyActivities, setWeeklyActivities] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [isCrewHydrating, setIsCrewHydrating] = useState(false);
  const [isNavigatingToCrew, setIsNavigatingToCrew] = useState(false);
  const [activeSection, setActiveSection] = useState('activity'); // 'activity', 'crew', 'events'
  const [garminConnected, setGarminConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

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

  // Update active section based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/my-activities') || path.includes('/activity/')) {
      setActiveSection('activity');
    } else if (path.includes('/crew/') || path.includes('/runcrew/')) {
      setActiveSection('crew');
    } else if (path.includes('/settings/events')) {
      setActiveSection('events');
    }
  }, [location.pathname]);

  // Load weekly activities and totals from localStorage, calculate onboarding
  useEffect(() => {
    if (!athleteProfile) {
      // No athlete data - redirect to welcome to hydrate
      console.log('⚠️ ATHLETE HOME: No athlete data, redirecting to welcome');
      navigate('/athlete-welcome', { replace: true });
      return;
    }

    // Only run once when athleteProfile is first loaded
    if (onboardingState !== null) {
      return; // Already loaded
    }

    try {
      // Load activities and totals from full hydration model
      const model = LocalStorageAPI.getFullHydrationModel();
      const { weeklyActivities: cachedActivities, weeklyTotals: cachedTotals } = model || {};

      setWeeklyActivities(Array.isArray(cachedActivities) ? cachedActivities : []);
      setWeeklyTotals(cachedTotals || null);

      // Calculate onboarding state
      const storedOnboarding = localStorage.getItem('onboardingState');
      let onboarding;
      if (storedOnboarding) {
        onboarding = JSON.parse(storedOnboarding);
      } else {
        onboarding = UserOnboardingCalculationService.calculateOnboardingState(athleteProfile.createdAt);
        localStorage.setItem('onboardingState', JSON.stringify(onboarding));
      }

      setOnboardingState(onboarding);
      setDisplayCards(UserOnboardingCalculationService.getCardsForUser(athleteProfile, onboarding));
    } catch (error) {
      console.error('❌ ATHLETE HOME: Error loading athlete data:', error);
    }
  }, [athleteProfile, navigate, onboardingState]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      LocalStorageAPI.clearAll();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToRunCrew = async (e) => {
    // Prevent default if event provided
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Guard against multiple rapid calls
    if (isNavigatingToCrew) {
      console.log('⚠️ ATHLETE HOME: Already navigating to crew, ignoring duplicate call');
      return;
    }

    setIsNavigatingToCrew(true);

    // Use hook data directly - no need to read from localStorage again
    if (!runCrewId) {
      console.warn('⚠️ ATHLETE HOME: No crew context - join or create a crew first');
      navigate('/runcrew/join-or-start', { replace: true });
      setIsNavigatingToCrew(false);
      return;
    }

    // If we have crew data from hook, use it directly
    if (runCrew) {
      // Route to admin page if user is an admin, otherwise regular central
      const targetRoute = isCrewAdmin ? '/crew/crewadmin' : '/runcrew/central';
      console.log(`✅ ATHLETE HOME: Using crew data from hook, navigating to ${isCrewAdmin ? 'admin' : 'central'}`);
      navigate(targetRoute, { replace: true });
      // Don't reset flag here - let the navigation complete
      setTimeout(() => setIsNavigatingToCrew(false), 1000);
      return;
    }

    // Otherwise, hydrate from backend (shouldn't happen if hydration worked)
    if (!athleteId) {
      console.warn('⚠️ ATHLETE HOME: Missing athleteId, routing to welcome');
      navigate('/athlete-welcome');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ ATHLETE HOME: No Firebase user');
      navigate('/athletesignin');
      return;
    }

    try {
      const token = await user.getIdToken();
      setIsCrewHydrating(true);

      const { data } = await axios.post(
        `${API_BASE}/runcrew/hydrate`,
        { runCrewId, athleteId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data?.success && data.runCrew) {
        // Check if user is admin before storing
        const managerRecord = Array.isArray(data.runCrew?.managers)
          ? data.runCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
          : null;
        const isAdmin = Boolean(managerRecord);
        
        LocalStorageAPI.setRunCrewData({
          ...data.runCrew,
          isAdmin
        });
        
        // Route to admin page if user is an admin, otherwise regular central
        const targetRoute = isAdmin ? '/crew/crewadmin' : '/runcrew/central';
        console.log(`✅ ATHLETE HOME: Crew hydrated, navigating to ${isAdmin ? 'admin' : 'central'}`);
        navigate(targetRoute, { replace: true });
      } else {
        throw new Error(data?.error || data?.message || 'Failed to hydrate crew');
      }
    } catch (error) {
      console.error('❌ ATHLETE HOME: Unable to load crew', error);
      // If hydration fails, still try to navigate - RunCrewCentral will handle it
      // Default to regular central if we can't determine admin status
      navigate('/runcrew/central', { replace: true });
    } finally {
      setIsCrewHydrating(false);
      setTimeout(() => setIsNavigatingToCrew(false), 1000);
    }
  };

  const handleCardClick = (card) => {
    console.log('🖱️ ATHLETE HOME: Card clicked:', card);

    if (card.crewId) {
      handleGoToRunCrew();
      return;
    }

    navigate(card.path);
  };

  // Render guard: redirect if no athlete data (hook will be empty)
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

  const isProfileComplete = athleteProfile?.gofastHandle;
  const welcomeMessage = onboardingState
    ? UserOnboardingCalculationService.getOnboardingMessage(onboardingState, athleteProfile)
    : `Welcome, ${athleteProfile?.firstName || 'Athlete'}!`;

  // Dynamic sidebar items - updates when runCrewId changes
  const sidebarItems = [
    { id: 'activity', label: 'Activity', icon: Activity, path: '/my-activities' },
    { 
      id: 'crew', 
      label: 'Crew', 
      icon: Users, 
      path: runCrewId ? '/runcrew/central' : '/runcrew/join-or-start',
      onClick: runCrewId ? handleGoToRunCrew : undefined
    },
    { id: 'events', label: 'Events', icon: Calendar, path: '/settings/events' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveSection(item.id);
                  // Use custom onClick if provided, otherwise use path
                  if (item.onClick) {
                    item.onClick(e);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/athlete-profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition"
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
            <span className="font-medium text-gray-700">{athleteProfile?.firstName || 'Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'activity' && 'Activity'}
                {activeSection === 'crew' && 'Crew'}
                {activeSection === 'events' && 'Events'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {activeSection === 'activity' && 'View and manage your activity tracking'}
                {activeSection === 'crew' && 'Manage your crew and coordinate runs'}
                {activeSection === 'events' && 'Create and manage events, view volunteers'}
              </p>
            </div>
            <div className="flex items-center gap-3">
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
      </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Activity Section */}
            {activeSection === 'activity' && (
              <div className="space-y-6">
          {!isProfileComplete && (
                  <div className="bg-orange-500 border-2 border-orange-600 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col items-center space-y-3">
                <p className="text-white font-semibold text-lg">
                  Complete your profile to unlock all features!
                </p>
                <button
                  onClick={() => navigate('/athlete-create-profile')}
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors shadow-md"
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          )}

                {/* Connection Prompt - Show if not connected */}
                {!checkingConnection && !garminConnected && (
                  <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-orange-200">
                    <div className="text-center">
                      <Activity className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Connect Garmin to Start Tracking</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Connect your Garmin device to automatically sync activities and track your runs.
              </p>
              <button
                        onClick={() => navigate('/settings')}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
              >
                        Connect Device →
              </button>
            </div>
          </div>
        )}

                {/* Weekly Summary - Show if connected and has activities */}
                {!checkingConnection && garminConnected && (weeklyTotals || (weeklyActivities && weeklyActivities.length > 0)) && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">This Week's Activities</h2>
              <button
                onClick={() => navigate('/my-activities')}
                className="text-orange-600 hover:text-orange-700 font-semibold hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals?.totalDistanceMiles ?? '0'}</p>
                <p className="text-sm text-gray-600">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals?.activityCount ?? weeklyActivities.length}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals?.totalCalories ?? '0'}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                💡 Activities sync automatically from Garmin Connect. Click "View All" to see detailed activity history.
              </p>
            </div>
          </div>
        )}

                {/* Empty State - Connected but no activities */}
                {!checkingConnection && garminConnected && (!weeklyTotals && (!weeklyActivities || weeklyActivities.length === 0)) && (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                    <p className="text-gray-600 mb-6">Your activities will appear here once you sync with Garmin Connect.</p>
                    <button
                      onClick={() => navigate('/my-activities')}
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      View Activity History
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Crew Section */}
            {activeSection === 'crew' && (
              <div className="space-y-6">
                {runCrewId ? (
                  <div
                    onClick={handleGoToRunCrew}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-[1.02] text-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      My Run Crew
                    </h2>
                    <p className="text-lg text-sky-50/90 mb-6 max-w-2xl mx-auto">
                      Manage your crew, coordinate runs, and keep everyone accountable.
                    </p>
                    <button
                      onClick={handleGoToRunCrew}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
                      disabled={isCrewHydrating}
                    >
                      {isCrewHydrating ? 'Loading Crew…' : 'Go to RunCrew →'}
                    </button>
                  </div>
                      ) : (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Join or Create a Run Crew</h3>
                    <p className="text-gray-600 mb-6">Connect with other runners and coordinate group runs</p>
                    <button
                      onClick={() => navigate('/runcrew/join-or-start')}
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      Get Started
                    </button>
                  </div>
                      )}
                    </div>
            )}

            {/* Events Section */}
            {activeSection === 'events' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Management Card */}
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-6">
                      <Calendar className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Event Management</h3>
                      <p className="text-gray-600">
                        Create and manage events, set up volunteer roles, and configure event details
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/settings/events')}
                      className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      Manage Events
                    </button>
                  </div>

                  {/* Volunteer Management Card */}
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-6">
                      <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Volunteer Management</h3>
                      <p className="text-gray-600">
                        View volunteers, manage signups, export rosters, and remove volunteers
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/volunteer-management')}
                      className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      Manage Volunteers
                    </button>
                  </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteHome;