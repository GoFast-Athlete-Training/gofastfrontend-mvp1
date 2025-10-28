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
      console.log('🎯 GarminConnectSuccess: Starting complete setup...');
      
      // Get athleteId from localStorage
      const athleteId = localStorage.getItem('athleteId');
      if (!athleteId) {
        throw new Error('No athlete ID found');
      }

      // Step 1: Fetch user info from Garmin to get UUID
      console.log('🔍 Step 1: Fetching Garmin user info...');
      const userResponse = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/user?athleteId=${athleteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user info: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      console.log('✅ Step 1: User info received:', userData);
      
      setGarminData(userData.user.garmin);
      setStatus('success');
      
      // Step 2: Refresh the dashboard hydration
      console.log('🔄 Step 2: Refreshing dashboard hydration...');
      const hydrateResponse = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/athlete/admin/hydrate', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      if (hydrateResponse.ok) {
        const hydrateData = await hydrateResponse.json();
        localStorage.setItem('athletesData', JSON.stringify(hydrateData.athletes));
        localStorage.setItem('athletesLastUpdated', new Date().toISOString());
        console.log('✅ Step 2: Dashboard refreshed with fresh data');
      }

      console.log('✅ Garmin connection completed successfully!');
      
    } catch (error) {
      console.error('❌ GarminConnectSuccess error:', error);
      setStatus('error');
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
            {status === 'loading' && 'Completing Garmin Setup...'}
            {status === 'success' && 'Garmin Connected Successfully!'}
            {status === 'error' && 'Setup Failed'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {status === 'loading' && 'Fetching your Garmin user information...'}
            {status === 'success' && 'Your Garmin account is now fully connected.'}
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
          
          <div className="flex gap-2">
            {status === 'success' && (
              <button 
                onClick={handleContinue} 
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Continue to Settings
              </button>
            )}
            
            {status === 'error' && (
              <>
                <button 
                  onClick={handleRetry} 
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
                <button 
                  onClick={handleContinue} 
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Continue Anyway
                </button>
              </>
            )}
            
            {status === 'loading' && (
              <button disabled className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
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
