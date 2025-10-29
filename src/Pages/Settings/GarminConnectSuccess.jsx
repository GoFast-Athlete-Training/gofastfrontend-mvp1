import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const GarminConnectSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('success');
  const [garminData, setGarminData] = useState({
    connected: true,
    userId: null,
    connectedAt: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);

  const handleGetUUID = async () => {
    try {
      setLoading(true);
      console.log('🔍 Getting Garmin UUID via backend...');
      
      // Call OUR backend to get UUID (backend calls Garmin)
      const athleteId = localStorage.getItem('athleteId');
      const uuidResponse = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/user/get-uuid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ athleteId })
      });

      if (!uuidResponse.ok) {
        throw new Error(`Failed to get UUID: ${uuidResponse.status}`);
      }

      const uuidData = await uuidResponse.json();
      const garminUserId = uuidData.garminUserId;
      
      if (!garminUserId) {
        throw new Error('No userId returned from backend');
      }

      // Update UI with UUID
      setGarminData(prev => ({
        ...prev,
        userId: garminUserId
      }));
      
      console.log('✅ UUID fetched via backend:', garminUserId);
      
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Garmin Connected Successfully!</h1>
          
          <p className="text-gray-600 mb-6">
            Your Garmin account is connected. Click below to get your User ID.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Connection Details:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div><strong>Status:</strong> Connected</div>
              <div><strong>User ID:</strong> {garminData.userId || 'Unknown'}</div>
              <div><strong>Connected:</strong> {new Date(garminData.connectedAt).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {!garminData.userId ? (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarminConnectSuccess;