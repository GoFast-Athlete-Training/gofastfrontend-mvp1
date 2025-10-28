import React, { useState, useEffect } from 'react';
import { GARMIN_CONFIG } from '../../config/garminConfig';

const GarminConnectSettings = () => {
  const [garminStatus, setGarminStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // Fetch Garmin status on component mount
  useEffect(() => {
    fetchGarminStatus();
  }, []);

  const fetchGarminStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for auth
      });
      
      if (response.ok) {
        const data = await response.json();
        setGarminStatus(data);
        console.log('✅ Garmin status fetched:', data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch Garmin status');
      }
    } catch (err) {
      console.error('❌ Error fetching Garmin status:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateScopes = async (newScopes) => {
    try {
      setUpdating(true);
      
      const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/scopes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ scopes: newScopes })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGarminStatus(prev => ({
          ...prev,
          scopes: newScopes,
          permissions: data.permissions
        }));
        console.log('✅ Garmin scopes updated:', data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update scopes');
      }
    } catch (err) {
      console.error('❌ Error updating scopes:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect from Garmin? This will remove all permissions and stop data sharing.')) {
      return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setGarminStatus(null);
        console.log('✅ Garmin disconnected successfully');
        alert('Garmin disconnected successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('❌ Error disconnecting:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const toggleScope = (scopeName) => {
    if (updating) return;
    
    const newScopes = {
      ...garminStatus.scopes,
      [scopeName]: !garminStatus.scopes[scopeName]
    };
    
    updateScopes(newScopes);
  };

  const getMyGarminId = async () => {
    try {
      setDebugLoading(true);
      setError(null);
      
      // Try the new user route first
      const userResponse = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setDebugData({
          source: 'garmin/user endpoint',
          data: userData
        });
        console.log('✅ User data fetched:', userData);
      } else {
        // Fallback to debug endpoint
        const debugResponse = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/debug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'check_tokens',
            codeVerifier: localStorage.getItem('garmin_code_verifier')
          })
        });
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          setDebugData({
            source: 'garmin/debug endpoint (fallback)',
            data: debugData
          });
          console.log('✅ Debug data fetched:', debugData);
        } else {
          const errorData = await debugResponse.json();
          setError(errorData.message || 'Failed to fetch debug data');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setDebugLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 mb-4">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={fetchGarminStatus}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!garminStatus?.connected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Garmin Connect</h3>
        <p className="text-gray-600 mb-4">Not connected to Garmin Connect</p>
        <button
          onClick={() => window.location.href = '/settings'}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Connect Garmin
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Garmin Connect</h3>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">
          You've given the following applications permission to interact with your Garmin Connect account.
        </p>
        <a href="#" className="text-blue-600 text-sm hover:underline">Learn More</a>
      </div>

      <div className="border-t pt-4">
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-3">GoFast</h4>
          
          {/* Data shared FROM Garmin TO GoFast */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Data shared from Garmin Connect to the GoFast app
            </h5>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Activities</span>
              <button
                onClick={() => toggleScope('activities')}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  garminStatus.scopes.activities ? 'bg-blue-600' : 'bg-gray-200'
                } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    garminStatus.scopes.activities ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data shared FROM GoFast TO Garmin */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Data shared from the GoFast app to Garmin Connect
            </h5>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Training</span>
              <button
                onClick={() => toggleScope('training')}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  garminStatus.scopes.training ? 'bg-blue-600' : 'bg-gray-200'
                } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    garminStatus.scopes.training ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Disconnect Button */}
          <div className="mt-4 space-y-2">
            {/* Get My ID Button */}
            <button
              onClick={getMyGarminId}
              disabled={debugLoading}
              className="w-full py-2 px-4 rounded-lg font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {debugLoading ? 'Getting ID...' : 'Get My Garmin ID'}
            </button>
            
            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              disabled={updating}
              className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
          <p>Last synced: {garminStatus.lastSyncedAt ? new Date(garminStatus.lastSyncedAt).toLocaleString() : 'Never'}</p>
          <p>Connected: {garminStatus.connectedAt ? new Date(garminStatus.connectedAt).toLocaleString() : 'Unknown'}</p>
        </div>

        {/* Debug Data Display */}
        {debugData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h5>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarminConnectSettings;
