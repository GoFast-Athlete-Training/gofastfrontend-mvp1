import React, { useEffect } from 'react';

const GarminRegistrationWebhook = () => {
  useEffect(() => {
    console.log('🔍 DEBUG - Garmin Registration Webhook component mounted');
    console.log('🔍 DEBUG - Current URL:', window.location.href);
    
    // Forward the webhook data to backend
    const forwardToBackend = async () => {
      try {
        // Get any POST data (this would normally come from Garmin's webhook)
        const webhookData = {
          timestamp: new Date().toISOString(),
          source: 'frontend-webhook-component'
        };
        
        console.log('🔍 DEBUG - Forwarding registration webhook to backend:', webhookData);
        
        const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/garmin/registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Registration webhook forwarded successfully:', result);
        } else {
          const error = await response.json();
          console.error('❌ Failed to forward registration webhook:', error);
        }
      } catch (error) {
        console.error('❌ Error forwarding registration webhook:', error);
      }
    };
    
    forwardToBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Garmin Registration Webhook</h1>
        <p className="text-gray-600 mb-4">Processing Garmin registration...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default GarminRegistrationWebhook;
