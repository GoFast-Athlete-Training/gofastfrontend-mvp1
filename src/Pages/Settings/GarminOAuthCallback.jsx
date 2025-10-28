import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GarminOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Garmin connection...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get OAuth 1.0a parameters from URL
        const oauthToken = searchParams.get('oauth_token');
        const oauthVerifier = searchParams.get('oauth_verifier');
        const error = searchParams.get('error');

        if (error) {
          console.error('Garmin OAuth 1.0a error:', error);
          setStatus('error');
          setMessage(`OAuth error: ${error}`);
          return;
        }

        if (!oauthToken || !oauthVerifier) {
          console.error('Missing OAuth 1.0a parameters');
          setStatus('error');
          setMessage('Missing OAuth token or verifier from Garmin');
          return;
        }

        console.log('Garmin OAuth 1.0a callback received:', { oauthToken, oauthVerifier });

        // Send OAuth 1.0a parameters to backend to exchange for access tokens
        const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oauth_token: oauthToken,
            oauth_verifier: oauthVerifier
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Garmin OAuth success:', data);
          
          setStatus('success');
          setMessage('Garmin connected successfully!');
          
          // Redirect to settings after 2 seconds
          setTimeout(() => {
            navigate('/settings');
          }, 2000);
        } else {
          const errorData = await response.json();
          console.error('Backend OAuth error:', errorData);
          setStatus('error');
          setMessage(errorData.message || 'Failed to connect Garmin');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('An error occurred while connecting Garmin');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{getStatusIcon()}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Garmin Connection
        </h1>
        <p className={`text-lg mb-6 ${getStatusColor()}`}>
          {message}
        </p>
        
        {status === 'success' && (
          <p className="text-sm text-gray-600 mb-4">
            Redirecting to settings...
          </p>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Back to Settings
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        )}
        
        {status === 'processing' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarminOAuthCallback;
