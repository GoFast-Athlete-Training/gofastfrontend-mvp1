import React, { useState } from 'react';
import { GARMIN_CONFIG } from '../../config/garminConfig';

const FindMyUserId = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const findUserId = async () => {
    try {
      setLoading(true);
      setResult(null);

      // First, let's check if we have tokens in localStorage
      const codeVerifier = localStorage.getItem('garmin_code_verifier');
      console.log('🔍 Code Verifier in localStorage:', codeVerifier);

      // Try to get user profile using a test endpoint
      const response = await fetch(`${GARMIN_CONFIG.API_BASE_URL}/garmin/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_tokens',
          codeVerifier: codeVerifier
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('🔍 Debug result:', data);
      } else {
        const errorData = await response.json();
        setResult({ error: errorData.message || 'Debug failed' });
        console.error('❌ Debug failed:', errorData);
      }

    } catch (error) {
      console.error('❌ Debug error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🔍 Find My Garmin User ID
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={findUserId}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? '🔍 Checking...' : '🔍 Find My User ID'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Checks localStorage for code verifier</li>
            <li>Calls backend debug endpoint</li>
            <li>Shows any stored Garmin tokens</li>
            <li>Attempts to fetch user profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FindMyUserId;
