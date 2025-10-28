import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GARMIN_CONFIG } from '../../config/garminConfig';

const GarminConnect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const initiateGarminOAuth = async () => {
    try {
      setIsLoading(true);
      
      // Get OAuth 1.0a request token from backend
      const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_url: GARMIN_CONFIG.CALLBACK_URL
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Garmin OAuth 1.0a auth URL:', data.authUrl);
        
        // Redirect to Garmin OAuth 1.0a authorization page
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        console.error('Failed to get Garmin OAuth 1.0a URL:', errorData);
        alert('Failed to initiate Garmin connection. Please try again.');
      }
    } catch (error) {
      console.error('Garmin OAuth 1.0a initiation error:', error);
      alert('An error occurred while connecting to Garmin. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⌚</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Garmin
        </h1>
        <p className="text-gray-600 mb-6">
          Connect your Garmin account to sync your runs and activities automatically.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={initiateGarminOAuth}
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect Garmin'}
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Settings
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarminConnect;
