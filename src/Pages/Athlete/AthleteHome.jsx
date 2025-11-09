import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import UserOnboardingCalculationService from '../../utils/UserOnboardingCalculationService';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

const AthleteHome = () => {
  const navigate = useNavigate();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingState, setOnboardingState] = useState(null);
  const [displayCards, setDisplayCards] = useState([]);
  const [weeklyActivities, setWeeklyActivities] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [runCrewId, setRunCrewId] = useState(null);
  const [runCrewManagerId, setRunCrewManagerId] = useState(null);
  const [athleteId, setAthleteId] = useState(null);
  const [primaryCrew, setPrimaryCrew] = useState(null);
  const [isCrewHydrating, setIsCrewHydrating] = useState(false);

  useEffect(() => {
    const loadAthleteData = () => {
      setIsLoading(true);

      try {
        const storedProfile = LocalStorageAPI.getAthleteProfile();
        const storedAthleteId = storedProfile?.athleteId || storedProfile?.id || LocalStorageAPI.getAthleteId();
        const storedRunCrewId = LocalStorageAPI.getRunCrewId();
        const storedRunCrewManagerId = LocalStorageAPI.getRunCrewManagerId();
        const storedRunCrewData = LocalStorageAPI.getRunCrewData();
        const storedOnboarding = localStorage.getItem('onboardingState');

        if (!storedProfile) {
          console.log('⚠️ ATHLETE HOME: No profile data found, redirecting to welcome');
          navigate('/welcome');
          return;
        }

        setAthleteProfile(storedProfile);
        const primaryCrew = storedRunCrewData
          || (Array.isArray(storedProfile.runCrews) && storedProfile.runCrews.length > 0
            ? storedProfile.runCrews[0]
            : null);

        const managerRecord = Array.isArray(primaryCrew.managers)
          ? primaryCrew.managers.find((manager) => manager.role === 'admin' && manager.athleteId === storedAthleteId)
          : null;

        if (!storedRunCrewData && primaryCrew) {
          LocalStorageAPI.setRunCrewData(primaryCrew);
          LocalStorageAPI.setRunCrewId(primaryCrew.id);

          LocalStorageAPI.setRunCrewManagerId(managerRecord?.id || null);
        }

        if (!storedRunCrewManagerId && managerRecord?.id) {
          LocalStorageAPI.setRunCrewManagerId(managerRecord.id);
        }

        setPrimaryCrew(primaryCrew);
        setRunCrewId(storedRunCrewId || primaryCrew?.id || null);
        setRunCrewManagerId(storedRunCrewManagerId || managerRecord?.id || null);
        setAthleteId(storedAthleteId || null);

        if (storedProfile.weeklyActivities) {
          setWeeklyActivities(storedProfile.weeklyActivities);
          setWeeklyTotals(storedProfile.weeklyTotals);
          localStorage.setItem('weeklyActivities', JSON.stringify(storedProfile.weeklyActivities));
          localStorage.setItem('weeklyTotals', JSON.stringify(storedProfile.weeklyTotals));
        } else {
          const cachedActivities = localStorage.getItem('weeklyActivities');
          const cachedTotals = localStorage.getItem('weeklyTotals');
          if (cachedActivities) {
            setWeeklyActivities(JSON.parse(cachedActivities));
          }
          if (cachedTotals) {
            setWeeklyTotals(JSON.parse(cachedTotals));
          }
        }

        let onboarding;
        if (storedOnboarding) {
          onboarding = JSON.parse(storedOnboarding);
        } else {
          onboarding = UserOnboardingCalculationService.calculateOnboardingState(storedProfile.createdAt);
          localStorage.setItem('onboardingState', JSON.stringify(onboarding));
        }

        setOnboardingState(onboarding);
        setDisplayCards(UserOnboardingCalculationService.getCardsForUser(storedProfile, onboarding));
      } catch (error) {
        console.error('❌ ATHLETE HOME: Error loading athlete data:', error);
        navigate('/welcome');
      } finally {
        setIsLoading(false);
      }
    };

    loadAthleteData();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      LocalStorageAPI.clearAll();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToRunCrew = async () => {
    try {
      const storedRunCrewId = LocalStorageAPI.getRunCrewId();
      const storedAthleteId = LocalStorageAPI.getAthleteId();

      if (!storedRunCrewId || !storedAthleteId) {
        console.warn('⚠️ ATHLETE HOME: Missing runCrewId/athleteId, routing to welcome');
        navigate('/athlete-welcome');
        return;
      }

      const user = auth.currentUser;
      const token = await user?.getIdToken();

      setIsCrewHydrating(true);

      const { data } = await axios.post(
        `${API_BASE}/runcrew/hydrate`,
        { runCrewId: storedRunCrewId, athleteId: storedAthleteId },
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined
        }
      );

      if (!data?.success || !data.runCrew) {
        throw new Error(data?.error || data?.message || 'Failed to hydrate crew');
      }

      const managerRecord = Array.isArray(data.runCrew?.managers)
        ? data.runCrew.managers.find((manager) => manager.athleteId === storedAthleteId && manager.role === 'admin')
        : null;

      LocalStorageAPI.setRunCrewData(data.runCrew);
      LocalStorageAPI.setRunCrewId(data.runCrew.id);
      LocalStorageAPI.setRunCrewManagerId(managerRecord?.id || null);

      setPrimaryCrew(data.runCrew);
      setRunCrewId(data.runCrew.id);
      setRunCrewManagerId(managerRecord?.id || null);

      navigate('/crew/crewadmin');
    } catch (error) {
      console.error('❌ ATHLETE HOME: Unable to load crew', error);
      alert('Unable to load your crew. Please try again.');
    } finally {
      setIsCrewHydrating(false);
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

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Settings
              </button>
              <button
                onClick={() => navigate('/athlete-profile')}
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-500 transition"
              >
                {athleteProfile?.photoURL ? (
                  <img
                    src={athleteProfile.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    {athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : 'A'}
                  </span>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {welcomeMessage}
          </h1>
          {!isProfileComplete && (
            <div className="bg-orange-500 border-2 border-orange-600 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
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
          <div className="bg-sky-100 border border-sky-300 rounded-lg p-4 max-w-2xl mx-auto mt-4 text-left">
            <p className="text-sky-800 font-semibold">Debug Context</p>
            <p className="text-sm text-sky-800">athleteId: {athleteId || '—'}</p>
            <p className="text-sm text-sky-800">runCrewId: {runCrewId || '—'}</p>
            <p className="text-sm text-sky-800">runCrewManagerId: {runCrewManagerId || '—'}</p>
          </div>
        </div>

        {primaryCrew && (
          <div className="mb-8">
            <div
              onClick={handleGoToRunCrew}
              className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-[1.02] text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {primaryCrew.name}
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
          </div>
        )}

        {weeklyActivities && weeklyActivities.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
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
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals?.totalDistanceMiles || '0'}</p>
                <p className="text-sm text-gray-600">Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyActivities.length}</p>
                <p className="text-sm text-gray-600">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{weeklyTotals?.totalCalories || '0'}</p>
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

        {displayCards.filter(c => !c.crewId).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Quick Actions</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {displayCards
                .filter(card => !card.crewId && card.showIf !== false)
                .map((card, index) => (
                  <div
                    key={index}
                    onClick={() => handleCardClick(card)}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 text-center w-full max-w-sm"
                  >
                    <div className="mb-4 flex justify-center">
                      {card.icon === 'garmin' ? (
                        <img
                          src="/Garmin_Connect_app_1024x1024-02.png"
                          alt="Garmin Connect"
                          className="h-16 w-auto"
                        />
                      ) : (
                        <div className="text-5xl">{card.icon}</div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                    <div className={`${card.color} text-white px-4 py-2 rounded-lg font-bold`}>
                      Get Started
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteHome;