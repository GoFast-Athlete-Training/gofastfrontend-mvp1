import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const GarminConnectSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [garminData, setGarminData] = useState({
    connected: false,
    userId: null,
    connectedAt: null
  });
  const [loading, setLoading] = useState(false);

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStatus = urlParams.get('status');
    const athleteId = urlParams.get('athleteId');
    const message = urlParams.get('message');

    console.log('🔍 URL params:', { urlStatus, athleteId, message });

    // Check if we're in a popup window
    const isInPopup = window.opener !== null;

    if (urlStatus === 'error') {
      setStatus('error');
      setErrorMessage(message || 'Unknown error occurred');
      setGarminData(prev => ({ ...prev, connected: false }));
      
      // If in popup, close it and redirect parent
      if (isInPopup) {
        const errorUrl = `/garmin/success?status=error&message=${encodeURIComponent(message || 'Unknown error occurred')}`;
        window.opener.location.href = errorUrl;
        window.close();
        return;
      }
    } else if (urlStatus === 'success' || athleteId) {
      setStatus('success');
      setGarminData(prev => ({ 
        ...prev, 
        connected: true, 
        connectedAt: new Date().toISOString() 
      }));
      
      // If in popup, close it and redirect parent to success page
      if (isInPopup) {
        const successUrl = athleteId 
          ? `/garmin/success?athleteId=${athleteId}` 
          : `/garmin/success?status=success`;
        window.opener.location.href = successUrl;
        window.close();
        return;
      }
    } else {
      setStatus('unknown');
      
      // If in popup with unknown status, close it and redirect parent
      if (isInPopup) {
        window.opener.location.href = '/garmin/success?status=unknown';
        window.close();
        return;
      }
    }
  }, []);

  const handleReturnHome = () => {
    navigate('/athlete-home');
  };

  // Render different content based on status
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Processing...</h1>
          <p className="text-gray-600 mb-6">Checking your Garmin connection status.</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-600">Connection Failed</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'There was an error connecting your Garmin account.'}
          </p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Garmin Connected Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your Garmin account is now connected and ready to sync your activities.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Unknown Status</h1>
        <p className="text-gray-600 mb-6">
          Unable to determine connection status.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        {renderContent()}
        
        <div className="space-y-4">
          {status === 'success' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Connection Details:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>Status:</strong> Connected</div>
                <div><strong>Connected:</strong> {garminData.connectedAt ? new Date(garminData.connectedAt).toLocaleString() : 'Just now'}</div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {status === 'error' && (
              <button 
                onClick={() => navigate('/settings')} 
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Settings
              </button>
            )}
            
            {status === 'success' && (
              <button 
                onClick={handleReturnHome} 
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Return Home
              </button>
            )}
            
            {status === 'unknown' && (
              <button 
                onClick={() => navigate('/settings')} 
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarminConnectSuccess;