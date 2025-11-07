import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import UserOnboardingCalculationService from '../../utils/UserOnboardingCalculationService';

const AthleteHome = () => {
  const navigate = useNavigate();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingState, setOnboardingState] = useState(null);
  const [displayCards, setDisplayCards] = useState([]);
  const [hasCrews, setHasCrews] = useState(false);
  const [myCrews, setMyCrews] = useState([]);
  const [weeklyActivities, setWeeklyActivities] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState(null);

  useEffect(() => {
    // Load athlete data from localStorage (hydrated by Welcome page)
    const loadAthleteData = () => {
      setIsLoading(true);
      
      try {
        const storedProfile = localStorage.getItem('athleteProfile');
        const storedOnboarding = localStorage.getItem('onboardingState');
        const storedCrews = localStorage.getItem('myCrews');
        
        if (storedProfile) {
          const athlete = JSON.parse(storedProfile);
          setAthleteProfile(athlete);
          
          // Load weekly activities if available (from hydrate)
          if (athlete.weeklyActivities) {
            setWeeklyActivities(athlete.weeklyActivities);
            setWeeklyTotals(athlete.weeklyTotals);
            localStorage.setItem('weeklyActivities', JSON.stringify(athlete.weeklyActivities));
            localStorage.setItem('weeklyTotals', JSON.stringify(athlete.weeklyTotals));
          } else {
            // Try loading from separate localStorage key
            const storedActivities = localStorage.getItem('weeklyActivities');
            const storedTotals = localStorage.getItem('weeklyTotals');
            if (storedActivities) {
              setWeeklyActivities(JSON.parse(storedActivities));
            }
            if (storedTotals) {
              setWeeklyTotals(JSON.parse(storedTotals));
            }
          }
          
          // Load onboarding state
          if (storedOnboarding) {
            const onboarding = JSON.parse(storedOnboarding);
            setOnboardingState(onboarding);
            
            // Get appropriate cards for this user
            const cards = UserOnboardingCalculationService.getCardsForUser(athlete, onboarding);
            setDisplayCards(cards);
          } else {
            // Calculate if not stored
            const onboarding = UserOnboardingCalculationService.calculateOnboardingState(athlete.createdAt);
            setOnboardingState(onboarding);
            localStorage.setItem('onboardingState', JSON.stringify(onboarding));
            
            const cards = UserOnboardingCalculationService.getCardsForUser(athlete, onboarding);
            setDisplayCards(cards);
          }
          
          // Load RunCrews if available
          if (storedCrews) {
            const crews = JSON.parse(storedCrews);
            console.log('📦 ATHLETE HOME: Loaded crews from localStorage:', crews);
            
            // LOG RUNCREW ADMIN ID FROM ALL SOURCES
            const currentAthleteId = athlete?.id;
            console.log('🔑 ATHLETE HOME: Current athlete ID:', currentAthleteId);
            
            crews.forEach((crew, index) => {
              console.log(`🏃 CREW ${index + 1}:`, {
                id: crew.id,
                name: crew.name,
                runcrewAdminId: crew.runcrewAdminId,
                isAdmin: crew.isAdmin,
                isCurrentUserAdmin: crew.runcrewAdminId === currentAthleteId,
                fullCrewObject: crew
              });
            });
            
            setHasCrews(crews.length > 0);
            setMyCrews(crews);
            updateCardsForCrews(crews, athlete?.id);
          }
        } else {
          // No profile data - redirect to welcome for hydration
          console.log('⚠️ ATHLETE HOME: No profile data found, redirecting to welcome');
          navigate('/welcome');
          return;
        }
      } catch (error) {
        console.error('❌ ATHLETE HOME: Error loading athlete data:', error);
        navigate('/welcome');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAthleteData();
  }, [navigate]);


  const updateCardsForCrews = (crews, currentAthleteId) => {
    console.log('🔄 ATHLETE HOME: updateCardsForCrews called with:', { crews, currentAthleteId });
    
    // Update the display cards to show RunCrew Central if user has crews
    setDisplayCards(prevCards => {
      return prevCards.map(card => {
        // Replace "Join RunCrew" or "RunCrew Dashboard" cards with "Go to RunCrew Central"
        if (card.path === '/runcrew/join' || card.path === '/runcrew/dashboard' || card.path === '/runcrew/start') {
          // MVP1: Single crew - get first crew
          const crew = crews[0];
          const crewId = crew?.id;
          
          // QUERYABLE MODEL: Check managers array for admin status
          const managers = crew?.managers || [];
          const isAdminFromManager = managers.some(m => m.athleteId === currentAthleteId && m.role === 'admin');
          
          // Fallback: Check isAdmin flag or runcrewAdminId (backward compatibility)
          const isAdminFromFlag = crew?.isAdmin === true;
          const isAdminFromField = crew?.runcrewAdminId === currentAthleteId;
          
          const isAdmin = isAdminFromManager || isAdminFromFlag || isAdminFromField;
          
          console.log('🎯 ATHLETE HOME: Setting up RunCrew card (QUERYABLE MODEL):', {
            crewId,
            crewName: crew?.name,
            currentAthleteId,
            managers: managers.map(m => ({ athleteId: m.athleteId, role: m.role })),
            isAdminFromManager,
            isAdminFromFlag,
            isAdminFromField,
            isAdmin,
            willRouteTo: isAdmin ? `/runcrew/admin/${crewId}` : `/runcrew/${crewId}`
          });
          
          return {
            ...card,
            title: 'My RunCrew',
            description: crews.length === 1 
              ? `View ${crews[0].name}` 
              : `View ${crews.length} RunCrews`,
            icon: '👥',
            path: isAdmin ? `/runcrew/admin/${crewId}` : (crewId ? `/runcrew/${crewId}` : '/runcrew-list'), // MVP1: Default to admin if admin
            color: 'bg-blue-500',
            showIf: true,
            crewId: crewId, // Store crew ID for navigation handler
            isAdmin: isAdmin // Store admin status (determined here)
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

  const handleCardClick = (card) => {
    console.log('🖱️ ATHLETE HOME: Card clicked:', card);
    
    // Check if this is a RunCrew card and route based on admin status
    if (card.crewId) {
      const currentAthleteId = athleteProfile?.id;
      console.log('🔍 ATHLETE HOME: Checking admin status for crew:', card.crewId);
      console.log('🔍 ATHLETE HOME: Current athlete ID:', currentAthleteId);
      
      // MVP1: Use card.isAdmin (already determined in updateCardsForCrews)
      // This is the most reliable since it's set when cards are created
      let isAdmin = card.isAdmin === true;
      
      // Double-check with localStorage for debugging (QUERYABLE MODEL)
      try {
        // Primary check: myCrews array (from /api/runcrew/mine or athlete hydrate)
        const myCrewsStr = localStorage.getItem('myCrews');
        if (myCrewsStr) {
          const myCrews = JSON.parse(myCrewsStr);
          const crew = myCrews.find(c => c.id === card.crewId);
          if (crew) {
            // QUERYABLE MODEL: Check managers array first
            const managers = crew.managers || [];
            const isAdminFromManager = managers.some(m => m.athleteId === currentAthleteId && m.role === 'admin');
            
            // Fallback: Check isAdmin flag or runcrewAdminId
            const isAdminFromFlag = crew.isAdmin === true;
            const isAdminFromField = crew.runcrewAdminId === currentAthleteId;
            
            const isAdminFromStorage = isAdminFromManager || isAdminFromFlag || isAdminFromField;
            
            console.log('🔍 ATHLETE HOME: Admin check from myCrews localStorage (QUERYABLE MODEL):', {
              crewId: card.crewId,
              currentAthleteId,
              managers: managers.map(m => ({ athleteId: m.athleteId, role: m.role })),
              isAdminFromManager,
              isAdminFromFlag,
              isAdminFromField,
              isAdmin: isAdminFromStorage,
              crewObject: crew
            });
            
            // Use storage value if card doesn't have it
            if (!isAdmin) {
              isAdmin = isAdminFromStorage;
            }
          }
        }
        
        // Fallback: check athleteData.runCrews (from athlete hydrate)
        const athleteDataStr = localStorage.getItem('athleteData');
        if (athleteDataStr) {
          const athleteData = JSON.parse(athleteDataStr);
          console.log('🔍 ATHLETE HOME: athleteData from localStorage:', athleteData);
          
          // Check runCrews array (plural) or runCrew (singular)
          const runCrews = athleteData.runCrews || (athleteData.runCrew ? [athleteData.runCrew] : []);
          const crew = runCrews.find(c => c.id === card.crewId);
          if (crew) {
            // QUERYABLE MODEL: Check managers array first
            const managers = crew.managers || [];
            const isAdminFromManager = managers.some(m => m.athleteId === currentAthleteId && m.role === 'admin');
            const isAdminFromField = crew.runcrewAdminId === currentAthleteId;
            const isAdminFromFlag = crew.isAdmin === true;
            const isAdminFromAthleteData = isAdminFromManager || isAdminFromFlag || isAdminFromField;
            
            console.log('🔍 ATHLETE HOME: Admin check from athleteData (QUERYABLE MODEL):', {
              crewId: card.crewId,
              currentAthleteId,
              managers: managers.map(m => ({ athleteId: m.athleteId, role: m.role })),
              isAdminFromManager,
              isAdminFromFlag,
              isAdminFromField,
              isAdmin: isAdminFromAthleteData,
              crewObject: crew
            });
            
            // Use athleteData value if not already set
            if (!isAdmin) {
              isAdmin = isAdminFromAthleteData;
            }
          }
        }
      } catch (error) {
        console.error('❌ ATHLETE HOME: Error checking admin status:', error);
      }
      
      const route = isAdmin ? `/runcrew/admin/${card.crewId}` : `/runcrew/${card.crewId}`;
      console.log('✅ ATHLETE HOME: Final routing decision:', {
        crewId: card.crewId,
        isAdmin,
        route,
        cardIsAdmin: card.isAdmin
      });
      
      // MVP1: Route to admin view if admin, otherwise member view
      navigate(route);
    } else {
      // Normal navigation for non-crew cards
      console.log('🖱️ ATHLETE HOME: Navigating to non-crew card:', card.path);
      navigate(card.path);
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

        {/* Weekly Activities Summary Card (if activities exist) */}
        {weeklyActivities && weeklyActivities.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">This Week</h2>
              <button
                onClick={() => navigate('/my-activities')}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                See My Activities →
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
          </div>
        )}

        {/* Smart Action Cards */}
        <div className="flex flex-wrap justify-center gap-6">
          {/* Add "See My Activities" card if activities exist */}
          {weeklyActivities && weeklyActivities.length > 0 && (
            <div 
              onClick={() => navigate('/my-activities')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 text-center w-full max-w-sm"
            >
              <div className="mb-4 flex justify-center">
                <div className="text-5xl">🏃‍♂️</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">See My Activities</h3>
              <p className="text-gray-600 mb-4">View your {weeklyActivities.length} activities from this week</p>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold">
                View Activities
              </div>
            </div>
          )}
          
          {displayCards.map((card, index) => {
            // Skip cards that have showIf conditions and don't meet them
            if (card.showIf === false) return null;
            
            return (
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
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AthleteHome;