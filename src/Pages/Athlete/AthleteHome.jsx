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
      
      const token = await user.getIdToken();
      console.log('🔐 ATHLETE HOME: Got Firebase token for user:', user.email);
      
      // Call backend to get athlete data using athlete person hydrate route
      // Firebase ID comes from verified token (middleware handles it)
      const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/athlete/athletepersonhydrate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
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
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-orange-800">
                Complete your profile to get more out of the experience or search around using the cards below.
              </p>
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
                <div className="text-5xl mb-4">{card.icon}</div>
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