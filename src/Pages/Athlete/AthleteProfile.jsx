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

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {/* Profile Photo */}
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white">
              {athleteProfile?.photoURL ? (
                <img 
                  src={athleteProfile.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl text-white font-bold">
                  {athleteProfile?.firstName ? athleteProfile.firstName[0].toUpperCase() : '👤'}
                </span>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {athleteProfile?.firstName && athleteProfile?.lastName 
              ? `${athleteProfile.firstName} ${athleteProfile.lastName}`
              : 'Your Name'
            }
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            @{athleteProfile?.gofastHandle || 'your_handle'}
          </p>
          
          <button 
            onClick={() => navigate('/athlete-edit-profile')}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Info - Beautiful Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bio Card */}
          {athleteProfile?.bio && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bio</h3>
              </div>
              <p className="text-gray-700 leading-relaxed pl-13">{athleteProfile.bio}</p>
            </div>
          )}

          {/* Location Card */}
          {(athleteProfile?.city || athleteProfile?.state) && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">📍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              </div>
              <p className="text-gray-700 text-lg pl-13">
                {athleteProfile?.city || ''}{athleteProfile?.city && athleteProfile?.state ? ', ' : ''}{athleteProfile?.state || ''}
              </p>
            </div>
          )}

          {/* Primary Sport Card */}
          {athleteProfile?.primarySport && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">🏃</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Primary Sport</h3>
              </div>
              <p className="text-gray-700 text-lg capitalize pl-13">{athleteProfile.primarySport}</p>
            </div>
          )}

          {/* Birthday Card */}
          {athleteProfile?.birthday && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">🎂</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Birthday</h3>
              </div>
              <p className="text-gray-700 text-lg pl-13">
                {new Date(athleteProfile.birthday).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Gender Card */}
          {athleteProfile?.gender && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gender</h3>
              </div>
              <p className="text-gray-700 text-lg capitalize pl-13">{athleteProfile.gender}</p>
            </div>
          )}

          {/* Instagram Card */}
          {athleteProfile?.instagram && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">📸</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Instagram</h3>
              </div>
              <a 
                href={`https://instagram.com/${athleteProfile.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 text-lg pl-13 hover:underline"
              >
                {athleteProfile.instagram}
              </a>
            </div>
          )}

          {/* Phone Number Card */}
          {athleteProfile?.phoneNumber && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 text-xl">📱</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
              </div>
              <p className="text-gray-700 text-lg pl-13">{athleteProfile.phoneNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
