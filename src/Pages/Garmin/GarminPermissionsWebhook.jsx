import React, { useEffect } from 'react';
import { GARMIN_CONFIG } from '../../config/garminConfig';

const GarminPermissionsWebhook = () => {
  useEffect(() => {
    // Handle Garmin permissions webhook
    const handleWebhook = async () => {
      try {
        // Forward webhook data to backend
        const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'permissions',
            data: window.location.search // Pass query params
          })
        });

        if (response.ok) {
          console.log('✅ Permissions webhook processed successfully');
        } else {
          console.error('❌ Permissions webhook failed');
        }
      } catch (error) {
        console.error('❌ Permissions webhook error:', error);
      }
    };

    handleWebhook();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Garmin Permissions Webhook</h1>
        <p className="text-gray-600">Processing permissions change...</p>
      </div>
    </div>
  );
};

export default GarminPermissionsWebhook;
