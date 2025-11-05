import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AthleteProfile = () => {
  const [athleteProfile, setAthleteProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load athlete profile from localStorage (hydrated from AthleteHome)
    const storedProfile = localStorage.getItem('athleteProfile');
    if (storedProfile) {
      setAthleteProfile(JSON.parse(storedProfile));
    }
  }, []);


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">Profile</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Settings
              </button>
              <button
                onClick={() => navigate('/athlete-home')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {/* Profile Photo */}
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl">
            {athleteProfile?.photoURL ? (
              <img 
                src={athleteProfile.photoURL} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : '👤'
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {athleteProfile?.firstName && athleteProfile?.lastName 
              ? `${athleteProfile.firstName} ${athleteProfile.lastName}`
              : 'Your Name'
            }
          </h1>
          <p className="text-gray-600 mb-4">
            @{athleteProfile?.gofastHandle || 'your_handle'}
          </p>
          
          <button 
            onClick={() => navigate('/athlete-create-profile')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Info - Same fields as profile setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Bio */}
          {athleteProfile?.bio && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <p className="text-gray-900">{athleteProfile.bio}</p>
            </div>
          )}

          {/* Phone Number */}
          {athleteProfile?.phoneNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <p className="text-gray-900">{athleteProfile.phoneNumber}</p>
            </div>
          )}

          {/* Birthday */}
          {athleteProfile?.birthday && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
              <p className="text-gray-900">
                {new Date(athleteProfile.birthday).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Gender */}
          {athleteProfile?.gender && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <p className="text-gray-900 capitalize">{athleteProfile.gender}</p>
            </div>
          )}

          {/* Location */}
          {(athleteProfile?.city || athleteProfile?.state) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <p className="text-gray-900">
                {athleteProfile?.city || ''}{athleteProfile?.city && athleteProfile?.state ? ', ' : ''}{athleteProfile?.state || ''}
              </p>
            </div>
          )}

          {/* Primary Sport */}
          {athleteProfile?.primarySport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Sport</label>
              <p className="text-gray-900 capitalize">{athleteProfile.primarySport}</p>
            </div>
          )}

          {/* Instagram */}
          {athleteProfile?.instagram && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <p className="text-gray-900">{athleteProfile.instagram}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
