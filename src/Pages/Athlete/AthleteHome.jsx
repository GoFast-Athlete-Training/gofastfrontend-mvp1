import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import UserOnboardingCalculationService from '../../utils/UserOnboardingCalculationService';

const AthleteHome = () => {
  const navigate = useNavigate();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingState, setOnboardingState] = useState(null);
  const [displayCards, setDisplayCards] = useState([]);
  const [hasCrews, setHasCrews] = useState(false);
  const [myCrews, setMyCrews] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ ATHLETE HOME: User is here! Loading profile for:', user.email);
        await hydrateAthleteData(user);
      } else {
        // This should never happen since Splash redirects unauthenticated users
        console.log('❌ ATHLETE HOME: No user - this should not happen!');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const hydrateAthleteData = async (user) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 ATHLETE HOME: Starting universal hydration...');
      
      if (!user) {
        console.log('❌ ATHLETE HOME: No Firebase user - this should not happen');
        setIsLoading(false);
        return;
      }
      
      // Force token refresh to avoid expired tokens (getIdToken(true) forces refresh)
      const token = await user.getIdToken(true);
      console.log('🔐 ATHLETE HOME: Got fresh Firebase token for user:', user.email);
      
      // Call universal hydration endpoint - includes RunCrews, everything in one call
      // Mirror of Ignite's /api/owner/hydrate pattern
      let response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/athlete/hydrate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If token expired, get fresh token and retry once
      if (response.status === 401) {
        console.log('⚠️ ATHLETE HOME: Token expired, getting fresh token and retrying...');
        const freshToken = await user.getIdToken(true);
        response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/athlete/hydrate', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ATHLETE HOME: Hydrated athlete data:', data);
        
        if (data.success && data.athlete) {
          const athlete = data.athlete;
          setAthleteProfile(athlete);
          
          // Calculate onboarding state
          const onboarding = UserOnboardingCalculationService.calculateOnboardingState(athlete.createdAt);
          setOnboardingState(onboarding);
          
          // Get appropriate cards for this user
          const cards = UserOnboardingCalculationService.getCardsForUser(athlete, onboarding);
          setDisplayCards(cards);
          
          // Store in localStorage for other components
          localStorage.setItem('athleteProfile', JSON.stringify(athlete));
          localStorage.setItem('profileHydrated', 'true');
          localStorage.setItem('onboardingState', JSON.stringify(onboarding));
          localStorage.setItem('athleteId', athlete.athleteId);
          
          // Use RunCrews from hydration response (no separate API call needed!)
          if (athlete.runCrews && athlete.runCrews.length > 0) {
            setHasCrews(true);
            setMyCrews(athlete.runCrews);
            updateCardsForCrews(athlete.runCrews);
          } else {
            setHasCrews(false);
            setMyCrews([]);
          }
        }
      } else {
        console.log('❌ ATHLETE HOME: Failed to hydrate, athlete not found');
        // User might not exist in backend yet, that's ok
      }
      
    } catch (error) {
      console.error('❌ ATHLETE HOME: Hydration error:', error);
      // Continue anyway - user can still use the app
    } finally {
      setIsLoading(false);
    }
  };


  const updateCardsForCrews = (crews) => {
    // Update the display cards to show RunCrew Central if user has crews
    setDisplayCards(prevCards => {
      return prevCards.map(card => {
        // Replace "Join RunCrew" or "RunCrew Dashboard" cards with "Go to RunCrew Central"
        if (card.path === '/runcrew/join' || card.path === '/runcrew/dashboard' || card.path === '/runcrew/start') {
          return {
            ...card,
            title: 'My RunCrew',
            description: crews.length === 1 
              ? `View ${crews[0].name}` 
              : `View ${crews.length} RunCrews`,
            icon: '👥',
            path: '/runcrew-central',
            color: 'bg-blue-500',
            showIf: true
          };
        }
        return card;
      });
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.clear(); // Clear all stored data
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
  const welcomeMessage = onboardingState ? 
    UserOnboardingCalculationService.getOnboardingMessage(onboardingState, athleteProfile) : 
    `Welcome, ${athleteProfile?.firstName || 'Athlete'}!`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Settings Button */}
              <button
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Settings
              </button>
              {/* Profile Avatar - Clickable */}
              <button
                onClick={() => navigate('/athlete-profile')}
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold hover:bg-orange-600 transition"
              >
                {athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : 'A'}
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Message */}
        <div className="text-center mb-12">
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
          <div className="bg-sky-100 border border-sky-300 rounded-lg p-4 max-w-2xl mx-auto mt-4">
            <p className="text-sky-800">
              Here's to your journey! Explore the below to achieve greater accountability and faster times.
            </p>
          </div>
        </div>

        {/* Smart Action Cards */}
        <div className="flex flex-wrap justify-center gap-6">
          {displayCards.map((card, index) => {
            // Skip cards that have showIf conditions and don't meet them
            if (card.showIf === false) return null;
            
            return (
              <div 
                key={index}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 text-center w-full max-w-sm"
              >
                <div className="mb-4 flex justify-center">
                  {card.icon === 'garmin' ? (
                    <img 
                      src="/Garmin_connect_badge_digital_RESOURCE_FILE-01.png" 
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
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AthleteHome;