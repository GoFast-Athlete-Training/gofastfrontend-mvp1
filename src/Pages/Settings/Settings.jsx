import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  
  // Simple connection states
  const [connections, setConnections] = useState({
    garmin: false,
    strava: false
  });

  const toggleConnection = (service) => {
    setConnections(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  // CLEAN Garmin OAuth 2.0 Flow - Backend handles everything (POPUP VERSION)
  const connectGarmin = async () => {
    try {
      // Get athleteId from localStorage
      const athleteId = localStorage.getItem('athleteId');
      if (!athleteId) {
        throw new Error('AthleteId not found in localStorage');
      }
      
      console.log(`🔍 Starting Garmin OAuth for athleteId: ${athleteId}`);
      
      // Step 1: Get auth URL from backend (backend generates PKCE and stores code verifier)
      const response = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/auth-url?athleteId=${athleteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      
      const data = await response.json();
      
      console.log('✅ Auth URL received, opening popup...');
      
      // Step 2: Open popup for Garmin OAuth
      const popup = window.open(
        data.authUrl,
        'garmin-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Step 3: Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          console.log('🔄 Popup closed, checking connection status...');
          
          // Check if connection was successful by calling backend
          checkGarminConnectionStatus();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Garmin OAuth error:', error);
      alert('Failed to start Garmin connection: ' + error.message);
    }
  };

  // Check Garmin connection status after popup closes
  const checkGarminConnectionStatus = async () => {
    try {
      const athleteId = localStorage.getItem('athleteId');
      const response = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/status?athleteId=${athleteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          console.log('✅ Garmin connection successful!');
          setConnections(prev => ({ ...prev, garmin: true }));
          alert('Garmin Connect successful! Your account is now connected.');
        } else {
          console.log('❌ Garmin connection failed');
          alert('Garmin connection was not completed. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error checking Garmin status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Device Connections</h1>
              <p className="text-gray-600">Connect your fitness devices and apps</p>
            </div>
            <button
              onClick={() => navigate("/athlete-home")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Connection Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Connect Your Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Garmin Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-5xl mb-4">⌚</div>
                <h3 className="text-2xl font-semibold mb-3">Garmin Connect</h3>
                <p className="text-gray-600 text-lg mb-4">Sync your runs and activities from Garmin</p>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    connections.garmin 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {connections.garmin ? 'Connected' : 'Not Connected'}
                  </div>
                </div>

                {!connections.garmin ? (
                  <button
                    onClick={connectGarmin}
                    className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    Connect Garmin
                  </button>
                ) : (
                  <button
                    onClick={() => toggleConnection('garmin')}
                    className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Strava Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-200 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-5xl mb-4">🏃</div>
                <h3 className="text-2xl font-semibold mb-3">Strava Connect</h3>
                <p className="text-gray-600 text-lg mb-4">Import your activities from Strava</p>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    connections.strava 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {connections.strava ? 'Connected' : 'Not Connected'}
                  </div>
                </div>

                {!connections.strava ? (
                  <button
                    onClick={() => navigate("/settings/devices")}
                    className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                  >
                    Connect Strava
                  </button>
                ) : (
                  <button
                    onClick={() => toggleConnection('strava')}
                    className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Why Connect?</h3>
          <p className="text-blue-800">
            Connecting your devices allows GoFast to automatically track your runs, 
            sync your activities, and provide personalized insights and recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
