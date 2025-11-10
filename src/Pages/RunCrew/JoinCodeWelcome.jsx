import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { auth, signInWithGoogle } from '../../firebase';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import axios from 'axios';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function JoinCodeWelcome() {
  const navigate = useNavigate();
  const { code } = useParams(); // Get code from URL path /join/:code
  const [searchParams] = useSearchParams();
  const codeFromQuery = searchParams.get('code'); // Fallback to query param
  const [joinCode, setJoinCode] = useState('');
  const [crewPreview, setCrewPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Separate lookup function that can be called with a code
  const handleLookupWithCode = async (codeToLookup) => {
    if (!codeToLookup || !codeToLookup.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/runcrew/lookup`, {
        joinCode: codeToLookup.trim().toUpperCase()
      });

      if (response.data.success) {
        setCrewPreview(response.data);
      } else {
        setError(response.data.message || 'Invalid or expired join code');
        setCrewPreview(null);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError(err.response?.data?.message || 'Invalid or expired join code');
      setCrewPreview(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill join code from URL and auto-lookup
  useEffect(() => {
    const codeToUse = code || codeFromQuery;
    if (codeToUse) {
      const normalizedCode = codeToUse.toUpperCase().trim();
      setJoinCode(normalizedCode);
      // Auto-trigger lookup when code is detected from URL
      if (normalizedCode) {
        handleLookupWithCode(normalizedCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, codeFromQuery]);

  const handleLookup = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }
    await handleLookupWithCode(joinCode);
  };

  const handleJoinCrew = async () => {
    if (!crewPreview) {
      setError('Please find a crew first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user is signed in
      let user = auth.currentUser;
      
      if (!user) {
        // Perform Firebase Google sign-in
        console.log('🔐 No user signed in, performing Google sign-in...');
        await signInWithGoogle();
        user = auth.currentUser;
        
        if (!user) {
          throw new Error('Sign-in failed. Please try again.');
        }
      }

      // Get Firebase token
      const token = await user.getIdToken();
      
      // Call join endpoint
      const response = await axios.post(
        `${API_BASE}/runcrew/join`,
        {
          joinCode: joinCode.trim().toUpperCase()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const { athleteId, runCrew } = response.data;

        // Persist data to localStorage
        LocalStorageAPI.setRunCrewData(runCrew);
        LocalStorageAPI.setRunCrewId(runCrew.id);
        LocalStorageAPI.setAthleteId(athleteId);

        // Store Firebase token
        localStorage.setItem('firebaseToken', token);
        localStorage.setItem('firebaseId', user.uid);
        localStorage.setItem('email', user.email || '');

        // Redirect to central
        navigate('/runcrew/central');
      } else {
        throw new Error(response.data.message || 'Failed to join crew');
      }
    } catch (err) {
      console.error('Join error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to join crew. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setJoinCode(value);
    setError(null);
    setCrewPreview(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && joinCode.trim() && !crewPreview) {
      handleLookup();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to RunCrew!</h1>
          <p className="text-gray-600 text-sm">
            Someone shared a crew code with you — awesome.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your join code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your join code"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
              maxLength={20}
            />
          </div>

          {!crewPreview ? (
            <button
              onClick={handleLookup}
              disabled={loading || !joinCode.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding...' : 'Find My Crew'}
            </button>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Crew Preview</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-lg font-bold text-gray-900">{crewPreview.name}</p>
                  </div>
                  {crewPreview.description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-base text-gray-700">{crewPreview.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Members</p>
                    <p className="text-base text-gray-700">{crewPreview.memberCount} member{crewPreview.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleJoinCrew}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Crew'}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/athlete-home')}
          className="w-full text-gray-600 hover:text-gray-800 text-sm py-2"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

