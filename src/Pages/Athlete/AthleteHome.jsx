import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const AthleteHome = () => {
  const navigate = useNavigate();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    hydrateAthleteData();
  }, []);

  const hydrateAthleteData = async () => {
    setIsLoading(true);
    setHydrating(true);
    
    try {
      console.log('🚀 ATHLETE HOME: Starting universal hydration...');
      
      // Get Firebase token
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ ATHLETE HOME: No Firebase user, redirecting to signin');
        navigate('/signin');
        return;
      }
      
      const token = await user.getIdToken();
      console.log('🔐 ATHLETE HOME: Got Firebase token');
      
      // Call backend to get athlete data
      const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/athlete/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firebaseId: user.uid,
          email: user.email
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ATHLETE HOME: Hydrated athlete data:', data);
        
        if (data.success && data.data) {
          setAthleteProfile(data.data);
          // Store in localStorage for other components
          localStorage.setItem('athleteProfile', JSON.stringify(data.data));
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
      setHydrating(false);
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
          <p className="text-gray-600">
            {hydrating ? 'Hydrating your profile...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Universal greeting - works whether they have profile or not
  const athleteName = athleteProfile?.firstName || 'Athlete';
  const hasProfile = athleteProfile?.firstName && athleteProfile?.lastName;
  const athleteLocation = athleteProfile ? `${athleteProfile.city || 'Your City'}, ${athleteProfile.state || 'State'}` : 'Your Location';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/athlete-create-profile')}
                className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl hover:bg-gray-300 transition-colors"
              >
                👤
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Universal Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {athleteName}!
          </h1>
          {hasProfile ? (
            <p className="text-gray-600">Welcome back! What do you want to do today?</p>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-medium mb-2">Complete your profile to get more out of the experience</p>
              <p className="text-orange-700 text-sm mb-3">Add your name, location, and running preferences to get better matches and personalized recommendations.</p>
              <button 
                onClick={() => navigate('/athlete-create-profile')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Complete Profile →
              </button>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/connect')}
              className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-bold mb-1">Find Your Crew</h3>
              <p className="text-sky-100 text-sm">Connect with runners in {athleteProfile?.city || 'your area'}</p>
            </button>

            <button
              onClick={() => navigate('/training-hub')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
            >
              <div className="text-4xl mb-3">🏃</div>
              <h3 className="text-xl font-bold mb-1">Start Training</h3>
              <p className="text-orange-100 text-sm">Get your personalized {athleteProfile?.primarySport || 'running'} plan</p>
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
          <div className="space-y-3">
            {!hasProfile && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-orange-900">Complete Your Profile</h3>
                    <p className="text-sm text-orange-700">Add more details to get better matches</p>
                  </div>
                  <button 
                    onClick={() => navigate('/athlete-create-profile')}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Complete →
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Find Running Partners</h3>
                  <p className="text-sm text-gray-600">Connect with athletes at your level</p>
                </div>
                <button 
                  onClick={() => navigate('/connect')}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Explore →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Start Training</h3>
                  <p className="text-sm text-gray-600">Get your personalized workout plan</p>
                </div>
                <button 
                  onClick={() => navigate('/training-hub')}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Begin →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteHome;