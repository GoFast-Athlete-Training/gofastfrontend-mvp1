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
      
      // If in popup, notify parent and keep popup open to show error
      if (isInPopup) {
        window.opener.postMessage({
          type: 'GARMIN_CONNECTION_ERROR',
          message: message || 'Unknown error occurred'
        }, '*');
        // Don't close - let user see error and close manually
      }
    } else if (urlStatus === 'success' || athleteId) {
      setStatus('success');
      setGarminData(prev => ({ 
        ...prev, 
        connected: true, 
        connectedAt: new Date().toISOString() 
      }));
      
      // If in popup, notify parent but KEEP POPUP OPEN to show success message
      if (isInPopup) {
        window.opener.postMessage({
          type: 'GARMIN_CONNECTED',
          success: true,
          athleteId: athleteId
        }, '*');
        // Don't auto-close - let user see success and close when ready
      }
    } else {
      setStatus('unknown');
      
      // If in popup with unknown status, notify parent
      if (isInPopup) {
        window.opener.postMessage({
          type: 'GARMIN_CONNECTION_UNKNOWN',
          message: 'Unable to determine connection status'
        }, '*');
        // Keep popup open
      }
    }
  }, []);

  const handleStartTracking = () => {
    // If in popup, notify parent and close
    if (window.opener) {
      window.opener.postMessage({
        type: 'GARMIN_CONNECTED',
        success: true,
        action: 'start_tracking'
      }, '*');
      // Small delay to ensure message is sent
      setTimeout(() => window.close(), 100);
    } else {
      // Not in popup, navigate to home
      navigate('/athlete-home');
    }
  };

  const handleClose = () => {
    // If in popup, close it
    if (window.opener) {
      window.close();
    } else {
      // Not in popup, go to settings
      navigate('/settings');
    }
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
          <p className="text-gray-600 mb-6">Checking your Garmin Connect connection status.</p>
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
            {errorMessage || 'There was an error connecting your Garmin Connect account.'}
          </p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="mb-4 flex justify-center">
            <img 
              src="/Garmin_Connect_app_1024x1024-02.png" 
              alt="Garmin Connect" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">Garmin Connect Connected! 🎉</h1>
          <p className="text-gray-700 mb-2 text-lg font-medium">
            You're all set! Your runs will now sync automatically.
          </p>
          <p className="text-gray-600 mb-6">
            Track your progress, hit your goals, and let's go fast together! 🚀
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
                onClick={handleClose} 
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Close
              </button>
            )}
            
            {status === 'success' && (
              <>
                <button 
                  onClick={handleStartTracking} 
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold mb-2"
                >
                  Start Tracking 🚀
                </button>
                <button 
                  onClick={handleClose} 
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </>
            )}
            
            {status === 'unknown' && (
              <button 
                onClick={handleClose} 
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            )}
          </div>
          
          {/* Garmin Attribution */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Garmin Connect is a trademark of Garmin Ltd. or its subsidiaries. 
              GoFast is not affiliated with Garmin Ltd. or its subsidiaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarminConnectSuccess;