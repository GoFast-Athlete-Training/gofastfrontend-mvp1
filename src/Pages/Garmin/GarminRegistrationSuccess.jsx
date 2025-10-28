import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GarminRegistrationSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Garmin registration...');
  const [garminUserId, setGarminUserId] = useState(null);

  useEffect(() => {
    console.log('🔍 DEBUG - GarminRegistrationSuccess component mounted');
    console.log('🔍 DEBUG - Current URL:', window.location.href);
    
    // Simulate processing the registration webhook
    const processRegistration = async () => {
      try {
        setStatus('processing');
        setMessage('Processing Garmin registration...');
        
        // Wait a moment to simulate webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we have registration data (this would come from the webhook)
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        if (userId) {
          setGarminUserId(userId);
          setStatus('success');
          setMessage('Garmin registration completed successfully!');
          console.log('✅ Garmin registration success with userId:', userId);
        } else {
          setStatus('success');
          setMessage('Garmin registration completed!');
          console.log('✅ Garmin registration success (no userId in URL)');
        }
        
        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'garmin-registration-success', 
            data: { userId: userId }
          }, '*');
        }
        
        // Close popup after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
        
      } catch (error) {
        console.error('❌ Registration processing error:', error);
        setStatus('error');
        setMessage('Failed to process Garmin registration');
        
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'garmin-registration-error', 
            error: error.message 
          }, '*');
        }
      }
    };
    
    processRegistration();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '🎉';
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
          Garmin Registration
        </h1>
        <p className={`text-lg mb-6 ${getStatusColor()}`}>
          {message}
        </p>
        
        {garminUserId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">Partner API UUID:</h3>
            <p className="text-xs text-green-700 font-mono break-all">
              {garminUserId}
            </p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Registration completed! This window will close automatically.
            </p>
            <button
              onClick={() => window.close()}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              Close Window
            </button>
          </div>
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

export default GarminRegistrationSuccess;
