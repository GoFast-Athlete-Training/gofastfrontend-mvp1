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
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinedCrew, setJoinedCrew] = useState(null);
  
  // Check if code came from URL (auto-hydrate mode)
  const hasCodeInUrl = !!(code || codeFromQuery);

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
      // Step 1: Check if user is signed in
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
      
      // Step 2: Create/find athlete FIRST (ensures athlete exists before joining)
      console.log('👤 Creating/finding athlete via /api/athlete/create...');
      const athleteResponse = await axios.post(
        `${API_BASE}/athlete/create`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!athleteResponse.data || !athleteResponse.data.success) {
        throw new Error(athleteResponse.data?.message || 'Failed to create athlete profile');
      }

      const athleteId = athleteResponse.data.athleteId;
      if (!athleteId) {
        throw new Error('No athlete ID returned from server');
      }

      console.log('✅ Athlete created/found:', athleteId);

      // Store athlete data in localStorage
      localStorage.setItem('athleteId', athleteId);
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('firebaseId', user.uid);
      localStorage.setItem('email', user.email || '');

      // Step 3: Now join the crew (athlete exists, can safely join)
      console.log('🏃 Joining crew via /api/runcrew/join...');
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
        const { runCrew } = response.data;

        // Check if user is admin (via RunCrewManager) - matching pattern from JoinCrew.jsx
        const managerRecord = Array.isArray(runCrew?.managers)
          ? runCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
          : null;
        const isAdmin = Boolean(managerRecord);

        // Persist crew data to localStorage (with isAdmin flag)
        LocalStorageAPI.setRunCrewData({
          ...runCrew,
          isAdmin
        });
        LocalStorageAPI.setRunCrewId(runCrew.id);
        LocalStorageAPI.setAthleteId(athleteId);

        // Store admin status and managerId
        if (managerRecord) {
          LocalStorageAPI.setRunCrewManagerId(managerRecord.id);
        }

        // Show success state briefly before redirecting
        setJoinedCrew(runCrew);
        setJoinSuccess(true);
        setLoading(false);

        // Redirect after 2 seconds with success message visible
        setTimeout(() => {
          if (isAdmin) {
            navigate('/crew/crewadmin', { replace: true });
          } else {
            navigate('/runcrew/central', { replace: true });
          }
        }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* GoFast Branding Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.jpg" alt="GoFast" className="w-12 h-12 rounded-full shadow-md" />
          </div>
          <div>
            {crewPreview && (crewPreview.icon || crewPreview.logo) && (
              <div className="flex items-center justify-center mb-3">
                {crewPreview.logo ? (
                  <>
                    <img 
                      src={crewPreview.logo} 
                      alt={crewPreview.name} 
                      className="w-16 h-16 rounded-xl object-cover border-2 border-sky-200 shadow-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const iconFallback = document.getElementById('crew-icon-fallback');
                        if (iconFallback && crewPreview.icon) {
                          iconFallback.style.display = 'flex';
                        }
                      }}
                    />
                    {crewPreview.icon && (
                      <div 
                        id="crew-icon-fallback"
                        className="w-16 h-16 rounded-xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center text-4xl shadow-md hidden"
                      >
                        {crewPreview.icon}
                      </div>
                    )}
                  </>
                ) : crewPreview.icon ? (
                  <div className="w-16 h-16 rounded-xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center text-4xl shadow-md">
                    {crewPreview.icon}
                  </div>
                ) : null}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {crewPreview 
                ? `Welcome to ${crewPreview.name}!` 
                : loading 
                  ? 'Finding Your Crew...' 
                  : 'Join a RunCrew on GoFast'}
            </h1>
            {crewPreview ? (
              <p className="text-gray-600 text-sm">
                You've been invited to join this running crew. Run together, stay accountable, and crush your goals!
              </p>
            ) : loading ? (
              <p className="text-gray-600 text-sm">
                Loading crew details...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  RunCrews are your running community — friends who train together, schedule runs, and keep each other accountable.
                </p>
                <p className="text-gray-500 text-xs">
                  Enter the join code you received to find your crew.
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Join Success State */}
        {joinSuccess && joinedCrew && (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">You're In!</h2>
            <p className="text-gray-600">
              Welcome to <strong>{joinedCrew.name}</strong>! Redirecting you now...
            </p>
            <div className="pt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            </div>
          </div>
        )}

        {loading && !crewPreview && !joinSuccess && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-sm">Finding your crew...</p>
            <p className="text-gray-500 mt-2 text-xs">This will just take a moment</p>
          </div>
        )}

        {crewPreview && !joinSuccess ? (
          <div className="space-y-4">
            {/* Crew Preview Card */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-6 space-y-4">
              <div className="space-y-4">
                {crewPreview.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About This Crew</p>
                    <p className="text-base text-gray-800 leading-relaxed">{crewPreview.description}</p>
                  </div>
                )}
                
                {/* Admin Info - More Personal & Comforting */}
                {crewPreview.admin && (
                  <div className="pt-3 border-t border-sky-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Crew Admin</p>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {crewPreview.admin.photoURL ? (
                          <img 
                            src={crewPreview.admin.photoURL} 
                            alt={`${crewPreview.admin.firstName} ${crewPreview.admin.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-sky-300 shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 rounded-full bg-sky-200 border-2 border-sky-300 flex items-center justify-center text-xl font-bold text-sky-700 ${crewPreview.admin.photoURL ? 'hidden' : ''}`}
                        >
                          {crewPreview.admin.firstName?.[0] || 'A'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {crewPreview.admin.firstName} {crewPreview.admin.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Crew Administrator
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Member Count (Secondary Info) */}
                <div className="pt-2 border-t border-sky-200">
                  <p className="text-xs text-gray-500">
                    {crewPreview.memberCount} member{crewPreview.memberCount !== 1 ? 's' : ''} in this crew
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>What happens next?</strong> You'll join the crew, see upcoming runs, chat with members, and track your progress together.
              </p>
            </div>

            <button
              onClick={handleJoinCrew}
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining Crew...
                </span>
              ) : (
                'Join This Crew'
              )}
            </button>
          </div>
        ) : !hasCodeInUrl ? (
          // Manual entry mode - only show if no code in URL
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Your Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={handleCodeChange}
                onKeyPress={handleKeyPress}
                placeholder="e.g. FAST123"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                disabled={loading}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-2">
                Got a join code from a friend? Enter it above to find their crew.
              </p>
            </div>

            <button
              onClick={handleLookup}
              disabled={loading || !joinCode.trim()}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding...
                </span>
              ) : (
                'Find My Crew'
              )}
            </button>
          </div>
        ) : null}

        <button
          onClick={() => navigate('/athlete-home')}
          className="w-full text-gray-600 hover:text-gray-800 text-sm py-2 font-medium"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

