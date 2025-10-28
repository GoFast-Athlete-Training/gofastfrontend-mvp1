import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const GarminConnectSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [garminData, setGarminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    completeGarminSetup();
  }, []);

  const completeGarminSetup = async () => {
    try {
      setLoading(true);
      console.log('🎯 GarminConnectSuccess: Tokens saved, showing success...');
      
      // Just show success - UUID fetch is manual
      setGarminData({
        connected: true,
        userId: null, // Will be fetched manually
        connectedAt: new Date().toISOString(),
        scope: 'PARTNER_WRITE PARTNER_READ CONNECT_READ CONNECT_WRITE'
      });
      setStatus('success');
      
      console.log('✅ Garmin OAuth completed - tokens saved!');
      
    } catch (error) {
      console.error('❌ GarminConnectSuccess error:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGetUUID = async () => {
    try {
      setLoading(true);
      console.log('🔍 Getting Garmin UUID...');
      
      // Get tokens from localStorage
      const tokens = JSON.parse(localStorage.getItem('garminTokens') || '{}');
      if (!tokens.access_token) {
        throw new Error('No Garmin tokens found');
      }

      // Call Garmin API to get UUID
      const garminResponse = await fetch('https://connectapi.garmin.com/oauth-service/oauth/user-info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!garminResponse.ok) {
        throw new Error(`Garmin API error: ${garminResponse.status}`);
      }

      const garminData = await garminResponse.json();
      const garminUserId = garminData.userId;
      
      if (!garminUserId) {
        throw new Error('No userId in Garmin response');
      }

      // Save UUID to backend
      const athleteId = localStorage.getItem('athleteId');
      const saveResponse = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/user/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: athleteId,
          garminUserId: garminUserId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
          scope: tokens.scope
        })
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save UUID: ${saveResponse.status}`);
      }

      // Update UI with UUID
      setGarminData(prev => ({
        ...prev,
        userId: garminUserId
      }));
      
      console.log('✅ UUID fetched and saved:', garminUserId);
      
    } catch (error) {
      console.error('❌ Failed to get UUID:', error);
      alert('Failed to get Garmin User ID: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/settings');
  };

  const handleRetry = () => {
    setStatus('loading');
    setLoading(true);
    completeGarminSetup();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            {status === 'loading' && (
              <RefreshCw className="h-8 w-8 text-orange-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {status === 'loading' && 'Garmin Connected!'}
            {status === 'success' && 'Garmin Connected Successfully!'}
            {status === 'error' && 'Setup Failed'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {status === 'loading' && 'Tokens saved to your account...'}
            {status === 'success' && 'Your Garmin account is connected. Go to Settings to complete setup.'}
            {status === 'error' && 'There was an issue completing the setup.'}
          </p>
        </div>
        
        <div className="space-y-4">
          {status === 'success' && garminData && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Connection Details:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>Status:</strong> {garminData.connected ? 'Connected' : 'Not Connected'}</div>
                <div><strong>User ID:</strong> {garminData.userId || 'Unknown'}</div>
                <div><strong>Connected:</strong> {garminData.connectedAt ? new Date(garminData.connectedAt).toLocaleString() : 'Unknown'}</div>
                <div><strong>Scope:</strong> {garminData.scope || 'Unknown'}</div>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-700 text-sm">
                The Garmin connection was established, but we couldn't complete the final setup step.
                You can try again or continue to your settings.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {status === 'success' && (
              <>
                {!garminData?.userId ? (
                  <button 
                    onClick={handleGetUUID} 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Getting UUID...' : 'Get My Garmin User ID'}
                  </button>
                ) : (
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-green-800 font-medium">✅ UUID: {garminData.userId}</p>
                  </div>
                )}
                <button 
                  onClick={handleContinue} 
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Continue to Settings
                </button>
              </>
            )}
            
            {status === 'error' && (
              <>
                <button 
                  onClick={handleRetry} 
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
                <button 
                  onClick={handleContinue} 
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Continue Anyway
                </button>
              </>
            )}
            
            {status === 'loading' && (
              <button disabled className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                Setting up...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarminConnectSuccess;
