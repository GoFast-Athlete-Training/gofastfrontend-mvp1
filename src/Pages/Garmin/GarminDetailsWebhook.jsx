import React, { useEffect } from 'react';
import { GARMIN_CONFIG } from '../../config/garminConfig';

const GarminDetailsWebhook = () => {
  useEffect(() => {
    // Handle Garmin activity details webhook
    const handleWebhook = async () => {
      try {
        // Forward webhook data to backend
        const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'activity_details',
            data: window.location.search // Pass query params
          })
        });

        if (response.ok) {
          console.log('✅ Activity details webhook processed successfully');
        } else {
          console.error('❌ Activity details webhook failed');
        }
      } catch (error) {
        console.error('❌ Activity details webhook error:', error);
      }
    };

    handleWebhook();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Garmin Activity Details Webhook</h1>
        <p className="text-gray-600">Processing activity details...</p>
      </div>
    </div>
  );
};

export default GarminDetailsWebhook;
