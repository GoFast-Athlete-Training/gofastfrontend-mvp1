import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const GarminOAuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // This is just a landing page - backend does all the work
    console.log('🎯 GarminOAuthCallback: Landing page loaded');
    
    // Show processing for 2 seconds, then redirect to success
    setTimeout(() => {
      setStatus('success');
      setMessage('Garmin connected successfully!');
      
      // Redirect to success page after 1 second
      setTimeout(() => navigate('/garmin/success'), 1000);
    }, 2000);
  }, [navigate]);

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
            {status === 'loading' && 'Processing Garmin Connection...'}
            {status === 'success' && 'Garmin Connected Successfully!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {status === 'loading' && 'Please wait while we complete your Garmin connection...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && 'There was an issue connecting to Garmin.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GarminOAuthCallback;