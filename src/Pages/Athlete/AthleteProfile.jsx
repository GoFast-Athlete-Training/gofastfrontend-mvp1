import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// Hardcoded API URL since we deleted the config file
const API_BASE_URL = 'https://gofastbackendv2-fall2025.onrender.com/api';

const AthleteProfile = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [garminStatus, setGarminStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load athlete profile from localStorage (hydrated from AthleteHome)
    const storedProfile = localStorage.getItem('athleteProfile');
    if (storedProfile) {
      setAthleteProfile(JSON.parse(storedProfile));
    }
    
    // Fetch Garmin connection status
    fetchGarminStatus();
  }, []);

  const fetchGarminStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/garmin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setGarminStatus(data);
        console.log('✅ Garmin status fetched in AthleteProfile:', data);
      } else {
        console.log('⚠️ Could not fetch Garmin status');
      }
    } catch (error) {
      console.error('❌ Error fetching Garmin status:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast Settings</span>
            </div>
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header - Instagram Style */}
        <div className="flex gap-8 mb-8">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-6xl">
              {athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : '👤'}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {athleteProfile?.firstName && athleteProfile?.lastName 
                  ? `${athleteProfile.firstName} ${athleteProfile.lastName}`
                  : 'Your Name'
                }
              </h1>
              <p className="text-gray-600 mb-2">
                @{athleteProfile?.gofastHandle || 'your_handle'} • {athleteProfile?.city || 'Your City'}, {athleteProfile?.state || 'State'}
              </p>
              <p className="text-gray-600">
                Primary Sport: <span className="font-medium">{athleteProfile?.primarySport || 'Running'}</span>
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-4">
              <div className="flex items-center">
                <span className="font-bold text-gray-900">0</span>
                <span className="text-gray-600 ml-2">GoFast Points</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">0</span>
                <span className="text-gray-600 ml-2">Miles This Week</span>
              </div>
              <div>
                <span className="font-bold text-gray-900">--:--</span>
                <span className="text-gray-600 ml-2">Best Time</span>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              onClick={() => navigate('/athlete-create-profile')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Sidebar - Left */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Settings</h3>
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Account</div>
                <button 
                  onClick={() => setActiveSection('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === 'profile' 
                      ? 'bg-orange-50 text-orange-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ✏️ Edit Profile Data
                </button>
                
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-3">Preferences</div>
                <button 
                  onClick={() => setActiveSection('preferences')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === 'preferences' 
                      ? 'bg-orange-50 text-orange-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🏃 Run Preferences
                </button>

                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-3">Connections</div>
                <button 
                  onClick={() => setActiveSection('devices')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === 'devices' 
                      ? 'bg-orange-50 text-orange-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📱 Connected Devices
                </button>

                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-3">Account</div>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <p className="text-gray-900">{athleteProfile?.firstName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <p className="text-gray-900">{athleteProfile?.lastName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GoFast Handle</label>
                    <p className="text-gray-900">@{athleteProfile?.gofastHandle || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{athleteProfile?.email || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <p className="text-gray-900">{athleteProfile?.phoneNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <p className="text-gray-900">{athleteProfile?.city || 'City'}, {athleteProfile?.state || 'State'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Sport</label>
                    <p className="text-gray-900">{athleteProfile?.primarySport || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <p className="text-gray-900">{athleteProfile?.bio || 'No bio added yet'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Run Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Distance</label>
                    <p className="text-gray-900">5K - 10K</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pace Range</label>
                    <p className="text-gray-900">8:00 - 9:00 min/mile</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Training Days</label>
                    <p className="text-gray-900">Monday, Wednesday, Friday, Sunday</p>
                  </div>
                </div>
              </div>
            )}

            {/* Devices Section */}
            {activeSection === 'devices' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Connected Devices</h2>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">⌚</div>
                        <div>
                          <h3 className="font-medium text-gray-900">Garmin Connect</h3>
                          <p className="text-sm text-gray-600">Sync your runs and get detailed analytics</p>
                          {garminStatus && (
                            <div className="mt-2">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                garminStatus.connected 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {garminStatus.connected ? '✅ Connected' : '❌ Not Connected'}
                              </div>
                              {garminStatus.garminUserId && (
                                <div className="mt-1 text-xs text-gray-500">
                                  ID: {garminStatus.garminUserId}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {garminStatus?.connected ? (
                          <button 
                            onClick={() => navigate('/settings')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                          >
                            Manage
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate('/settings')}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📱</div>
                        <div>
                          <h3 className="font-medium text-gray-900">Strava</h3>
                          <p className="text-sm text-gray-600">Import your running activities</p>
                        </div>
                      </div>
                      <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { icon: '🏃‍♂️', title: 'Profile Updated', desc: 'You updated your running preferences', date: '2 days ago' },
                  { icon: '📱', title: 'Device Connected', desc: 'Garmin Connect linked successfully', date: '3 days ago' },
                  { icon: '🎯', title: 'Goal Set', desc: 'New 5K goal: under 25 minutes', date: '5 days ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <span className="text-3xl mr-4">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.desc}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
