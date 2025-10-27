import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const AthleteHome = () => {
  const navigate = useNavigate();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load athlete profile from localStorage
    const profile = localStorage.getItem('athleteProfile');
    if (profile) {
      setAthleteProfile(JSON.parse(profile));
    }
    setIsLoading(false);
  }, []);

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
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  const athleteName = athleteProfile ? `${athleteProfile.firstName || 'Athlete'}` : 'Athlete';
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

      {/* Navigation Hub */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {athleteName}!</h1>
          <p className="text-gray-600">{athleteLocation}</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
        
        {/* Main Navigation Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/connect')}
            className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold mb-1">My Crew</h3>
            <p className="text-sky-100 text-sm">Find running partners in {athleteProfile?.city || 'your area'}</p>
          </button>

          <button
            onClick={() => navigate('/training-hub')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">💪</div>
            <h3 className="text-xl font-bold mb-1">Training</h3>
            <p className="text-orange-100 text-sm">{athleteProfile?.primarySport ? `${athleteProfile.primarySport} training` : 'View your plan'}</p>
          </button>

          <button
            onClick={() => navigate('/shop')}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">🏃</div>
            <h3 className="text-xl font-bold mb-1">Activity</h3>
            <p className="text-green-100 text-sm">Track your runs</p>
          </button>

          <button
            onClick={() => navigate('/athlete-create-profile')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold mb-1">Profile</h3>
            <p className="text-purple-100 text-sm">Update your info</p>
          </button>
        </div>

        {/* Shopping Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shopping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
            >
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="text-xl font-bold mb-1">Get New Gear</h3>
              <p className="text-sky-100 text-sm">Running shoes, watches, apparel</p>
            </button>
            
            <button
              onClick={() => navigate('/shop')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
            >
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-xl font-bold mb-1">Use Your Points</h3>
              <p className="text-orange-100 text-sm">GoFast merch & exclusive items</p>
            </button>
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">Add more details to get better matches</p>
                </div>
                <span className="text-2xl">📝</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Start Your First Run</h3>
                  <p className="text-sm text-gray-600">Log your first activity to begin tracking</p>
                </div>
                <span className="text-2xl">🏃</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <p className="font-medium text-gray-900">Profile Created</p>
                  <p className="text-sm text-gray-600">Welcome to GoFast!</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🚀</div>
                <div>
                  <p className="font-medium text-gray-900">Ready to Start!</p>
                  <p className="text-sm text-gray-600">Complete your first run</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteHome;