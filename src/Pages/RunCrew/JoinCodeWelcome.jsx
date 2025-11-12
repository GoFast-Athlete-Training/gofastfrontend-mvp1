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
  const [softJoinComplete, setSoftJoinComplete] = useState(false);
  
  // Check if code came from URL (auto-hydrate mode)
  const hasCodeInUrl = !!(code || codeFromQuery);

  // Separate lookup function that can be called with a code
  // Using useCallback to ensure stable reference for useEffect dependency
  const handleLookupWithCode = React.useCallback(async (codeToLookup) => {
    if (!codeToLookup || !codeToLookup.trim()) {
      console.log('⚠️ JoinCodeWelcome: No code provided to lookup');
      return;
    }

    const normalizedCode = codeToLookup.trim().toUpperCase();
    console.log('🔍 JoinCodeWelcome: Looking up crew with code:', normalizedCode);
    
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/runcrew/lookup`, {
        joinCode: normalizedCode
      });

      console.log('✅ JoinCodeWelcome: Lookup response:', response.data);

      if (response.data.success) {
        setCrewPreview(response.data);
        console.log('✅ JoinCodeWelcome: Crew preview set:', response.data.name);
      } else {
        setError(response.data.message || 'Invalid or expired join code');
        setCrewPreview(null);
      }
    } catch (err) {
      console.error('❌ JoinCodeWelcome: Lookup error:', err);
      setError(err.response?.data?.message || 'Invalid or expired join code');
      setCrewPreview(null);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on any props/state

  // Auto-fill join code from URL and auto-lookup
  useEffect(() => {
    const codeToUse = code || codeFromQuery;
    console.log('🔍 JoinCodeWelcome: useEffect triggered - code:', code, 'codeFromQuery:', codeFromQuery);
    
    if (codeToUse) {
      const normalizedCode = codeToUse.toUpperCase().trim();
      console.log('🔍 JoinCodeWelcome: Normalized code:', normalizedCode);
      setJoinCode(normalizedCode);
      // Auto-trigger lookup when code is detected from URL
      if (normalizedCode) {
        console.log('🔍 JoinCodeWelcome: Auto-lookup triggered with code:', normalizedCode);
        handleLookupWithCode(normalizedCode);
      }
    } else {
      console.log('⚠️ JoinCodeWelcome: No code found in URL');
    }
  }, [code, codeFromQuery, handleLookupWithCode]);

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
      // Store join intent in localStorage (soft onboarding - illusion of joining)
      localStorage.setItem('pendingJoinCode', joinCode.trim().toUpperCase());
      localStorage.setItem('pendingJoinCrewId', crewPreview.id);
      localStorage.setItem('pendingJoinCrewName', crewPreview.name);

      // Show "soft join" success screen (illusion of joining)
      setSoftJoinComplete(true);
      setLoading(false);
      
      // NO AUTO-REDIRECT - User must click button to proceed
      
    } catch (err) {
      console.error('Join error:', err);
      setError(err.message || 'Failed to proceed. Please try again.');
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

        {/* Soft Join Success State - "You're joined! (but not really)" */}
        {softJoinComplete && crewPreview && (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">You're Joined!</h2>
            <p className="text-gray-600">
              Welcome to <strong>{crewPreview.name}</strong>!
            </p>
            
            {/* Warning Box */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-orange-800 font-medium mb-2">
                ⚠️ <strong>Important:</strong> Your join is pending!
              </p>
              <p className="text-xs text-orange-700">
                You need to sign up to secure your spot. If you don't create an account, your choice to join might not stick.
              </p>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={() => navigate('/crewjoin', { replace: true })}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mt-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Click here to sign up</span>
            </button>

            <p className="text-xs text-gray-500 mt-2">
              We'll use your Google account to get you started quickly
            </p>
          </div>
        )}

        {loading && !crewPreview && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-sm">Finding your crew...</p>
            <p className="text-gray-500 mt-2 text-xs">This will just take a moment</p>
          </div>
        )}

        {crewPreview ? (
          <div className="space-y-4">
            {/* Crew Preview Card */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-6 space-y-4">
              <div className="space-y-3">
                {/* Crew Icon/Logo */}
                {(crewPreview.icon || crewPreview.logo) && (
                  <div className="text-center mb-2">
                    {crewPreview.logo ? (
                      <img 
                        src={crewPreview.logo} 
                        alt={crewPreview.name}
                        className="w-16 h-16 mx-auto rounded-full object-cover"
                      />
                    ) : crewPreview.icon ? (
                      <span className="text-5xl">{crewPreview.icon}</span>
                    ) : null}
                  </div>
                )}
                
                {crewPreview.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About This Crew</p>
                    <p className="text-base text-gray-800 leading-relaxed">{crewPreview.description}</p>
                  </div>
                )}
                
                {/* Admin Display - Show admin profile instead of member count */}
                {crewPreview.admin ? (
                  <div className="pt-2 border-t border-sky-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Crew Admin</p>
                    <div className="flex items-center space-x-3">
                      {crewPreview.admin.photoURL ? (
                        <img 
                          src={crewPreview.admin.photoURL} 
                          alt={`${crewPreview.admin.firstName} ${crewPreview.admin.lastName}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-sky-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center border-2 border-sky-300">
                          <span className="text-sky-600 font-bold text-lg">
                            {crewPreview.admin.firstName?.[0] || 'A'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {crewPreview.admin.firstName} {crewPreview.admin.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Crew Admin</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-sky-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Members</p>
                    <p className="text-lg font-bold text-sky-700">{crewPreview.memberCount} member{crewPreview.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                )}
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

