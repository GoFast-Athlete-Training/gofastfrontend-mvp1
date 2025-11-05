import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const GarminOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🎯 GarminOAuthCallback: Processing OAuth callback');
        
        // Get the authorization code from URL params
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        console.log('🔍 OAuth callback params:', { code: code ? 'present' : 'missing', state, error });
        
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        console.log('✅ Authorization code received:', code);
        
        // Get athleteId from localStorage (needed for backend)
        const athleteId = localStorage.getItem('athleteId');
        if (!athleteId) {
          throw new Error('AthleteId not found in localStorage');
        }
        
        console.log('🔍 Calling backend exchange endpoint with:', { code, athleteId });
        
        // Call backend exchange endpoint
        const response = await fetch(`https://gofastbackendv2-fall2025.onrender.com/api/garmin/exchange?code=${code}&athleteId=${athleteId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('🔍 Backend response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange code for tokens');
        }
        
        const data = await response.json();
        console.log('✅ Tokens exchanged successfully:', data);
        
        setStatus('success');
        setMessage('Garmin connected successfully!');
        
        // Redirect to success page after 1 second
        setTimeout(() => navigate(`/garmin/success?athleteId=${athleteId}`), 1000);
        
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect to Garmin');
        
        // Redirect to settings after 3 seconds on error
        setTimeout(() => navigate('/settings'), 3000);
      }
    };
    
    handleOAuthCallback();
  }, [navigate, searchParams]);

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
          
          {status !== 'loading' && (
            <div className="mb-4 flex justify-center">
              <img 
                src="/Garmin_connect_badge_digital_RESOURCE_FILE-01.png" 
                alt="Garmin Connect" 
                className="h-10 w-auto"
              />
            </div>
          )}
          
          <h1 className="text-2xl font-bold mb-2">
            {status === 'loading' && 'Processing Garmin Connect Connection...'}
            {status === 'success' && 'Garmin Connect Connected Successfully!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {status === 'loading' && 'Please wait while we complete your Garmin Connect connection...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GarminOAuthCallback;
