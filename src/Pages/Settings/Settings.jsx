import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  
  // Connection states - will be hydrated from backend
  const [connections, setConnections] = useState({
    garmin: false,
    strava: false
  });
  const [loading, setLoading] = useState(true);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const athleteId = localStorage.getItem('athleteId');
      if (!athleteId) {
        console.log('No athleteId found in localStorage');
        setLoading(false);
        return;
      }

      console.log('🔍 Checking connection status for athleteId:', athleteId);
      
      const response = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/status?athleteId=${athleteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection status received:', data);
        
        setConnections(prev => ({
          ...prev,
          garmin: data.connected || false,
          strava: false // TODO: Add Strava status check
        }));
      } else {
        console.log('❌ Failed to get connection status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectGarmin = async () => {
    if (!window.confirm('Disconnect Garmin from GoFast?\n\nThis will:\n• Deregister your account from Garmin\n• Stop all activity data syncing\n• Clear your Garmin connection from GoFast\n• Allow you to connect a different Garmin account later')) {
      return;
    }

    try {
      const athleteId = localStorage.getItem('athleteId');
      if (!athleteId) {
        throw new Error('AthleteId not found in localStorage');
      }

      const response = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ athleteId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Garmin disconnected and deregistered');
        await checkConnectionStatus();
        alert(data.message || 'Garmin disconnected and deregistered successfully.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect Garmin');
      }
    } catch (error) {
      console.error('❌ Garmin disconnect error:', error);
      alert('Failed to disconnect Garmin: ' + error.message);
    }
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
      
      // Step 3: Listen for messages from popup
      window.addEventListener('message', (event) => {
        // Verify origin for security (in production, check actual origin)
        if (event.data.type === 'GARMIN_CONNECTED') {
          console.log('✅ Garmin connected successfully!');
          // Refresh connection status
          checkConnectionStatus();
          // Optionally show success toast
        } else if (event.data.type === 'GARMIN_CONNECTION_ERROR') {
          console.error('❌ Garmin connection error:', event.data.message);
          alert('Garmin connection failed: ' + event.data.message);
        }
      });
      
      // Fallback: Check if popup closed without message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          console.log('🔄 Popup closed, checking connection status...');
          // Check if connection was successful by calling backend
          checkConnectionStatus();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Garmin OAuth error:', error);
      alert('Failed to start Garmin connection: ' + error.message);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-gray-600">Manage your account, events, and device connections</p>
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
        {/* Event Management Card - Primary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Management</h2>
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border-2 border-orange-200">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Manage Events & Volunteers</h3>
                <p className="text-gray-600 mb-4">
                  Create events, manage volunteer signups, and view volunteer rosters
                </p>
                <button
                  onClick={() => navigate("/settings/events")}
                  className="px-6 py-2 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Open Event Management
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Device Connections - Secondary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Device Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Garmin Card - Compact */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-gray-300 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/Garmin_Connect_app_1024x1024-02.png" 
                    alt="Garmin Connect" 
                    className="h-10 w-10 rounded"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">Garmin Connect</h3>
                    <p className="text-sm text-gray-500">Sync activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {loading ? (
                    <span className="text-sm text-gray-400">Checking...</span>
                  ) : connections.garmin ? (
                    <>
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                      <button
                        onClick={disconnectGarmin}
                        className="px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={connectGarmin}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Strava Card - Compact */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-gray-300 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-orange-100 flex items-center justify-center text-2xl">
                    🏃
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Strava</h3>
                    <p className="text-sm text-gray-500">Import activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${
                    connections.strava ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {connections.strava ? 'Connected' : 'Not Connected'}
                  </span>
                  {!connections.strava && (
                    <button
                      onClick={() => navigate("/settings/devices")}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section - Compact */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">
            Connect your devices to automatically sync activities and track your runs. 
            <span className="text-xs text-gray-500 block mt-2">
              Garmin Connect is a trademark of Garmin Ltd. GoFast is not affiliated with Garmin Ltd.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
