import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GarminOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Garmin connection...');

  console.log('🔍 DEBUG - GarminOAuthCallback component mounted');
  console.log('🔍 DEBUG - Current URL:', window.location.href);
  console.log('🔍 DEBUG - Search params:', Object.fromEntries(searchParams.entries()));

  useEffect(() => {
    console.log('🔍 DEBUG - useEffect triggered');
    const handleOAuthCallback = async () => {
      console.log('🔍 DEBUG - handleOAuthCallback started');
      try {
      // Get OAuth 2.0 parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('🔍 DEBUG - OAuth Callback received:');
      console.log('🔍 DEBUG - Code:', code);
      console.log('🔍 DEBUG - State:', state);
      console.log('🔍 DEBUG - Error:', error);
      console.log('🔍 DEBUG - Full URL:', window.location.href);
      console.log('🔍 DEBUG - Code Verifier from localStorage:', localStorage.getItem('garmin_code_verifier'));

      if (error) {
        console.error('🔍 DEBUG - Garmin OAuth 2.0 error:', error);
        setStatus('error');
        setMessage(`OAuth error: ${error}`);
        // Close popup and notify parent
        if (window.opener) {
          window.opener.postMessage({ type: 'garmin-oauth-error', error }, '*');
          window.close();
        }
        return;
      }

        if (!code) {
          console.error('Missing OAuth 2.0 authorization code');
          setStatus('error');
          setMessage('Missing authorization code from Garmin');
          // Close popup and notify parent
          if (window.opener) {
            window.opener.postMessage({ type: 'garmin-oauth-error', error: 'Missing code' }, '*');
            window.close();
          }
          return;
        }

        console.log('Garmin OAuth 2.0 callback received:', { code, state });

        // Get athleteId from localStorage (from hydration at home)
        const athleteId = localStorage.getItem('athleteId');
        console.log('🔍 DEBUG - AthleteId from localStorage:', athleteId);
        
        if (!athleteId) {
          throw new Error('No athleteId found in localStorage');
        }
        
        // Send OAuth 2.0 authorization code to backend to exchange for access tokens
        const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state,
            codeVerifier: localStorage.getItem('garmin_code_verifier'), // Get from localStorage
            athleteId: athleteId // Send athleteId for database save
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Garmin OAuth success:', data);
          
            // Save tokens to localStorage individually - NOT as a set
            localStorage.setItem('garminTokens', data.tokens.access_token);
            localStorage.setItem('garminRefreshToken', data.tokens.refresh_token);
            localStorage.setItem('garminExpiresIn', data.tokens.expires_in.toString());
            console.log('✅ Individual tokens saved to localStorage from Garmin');
            
            // Now send tokens to backend to save to database
            try {
              const saveResponse = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/save-tokens', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  athleteId: athleteId,
                  tokens: data.tokens
                })
              });
              
              if (saveResponse.ok) {
                console.log('✅ Tokens saved to backend database');
              } else {
                console.error('❌ Failed to save tokens to backend');
              }
            } catch (error) {
              console.error('❌ Error saving tokens to backend:', error);
            }
          }
          
          setStatus('success');
          setMessage('Garmin connected successfully!');
          
          // Redirect to success page
          setTimeout(() => navigate('/garmin/success'), 2000);
        } else {
          const errorData = await response.json();
          console.error('Backend OAuth error:', errorData);
          setStatus('error');
          setMessage(errorData.message || 'Failed to connect Garmin');
          
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ type: 'garmin-oauth-error', error: errorData.message }, '*');
          }
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('An error occurred while connecting Garmin');
        
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({ type: 'garmin-oauth-error', error: error.message }, '*');
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

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
