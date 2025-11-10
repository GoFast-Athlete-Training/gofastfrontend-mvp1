import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '../../utils/AuthDetectionService';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

/**
 * JoinRunCrewWelcome - Direct-invite join flow entry point
 * Route: /joinruncrewwelcome?code=ABC123
 * 
 * Architecture:
 * 1. Read code param from URL
 * 2. Check auth state → redirect authenticated users
 * 3. Validate code with backend (/api/join/validate)
 * 4. Show loading state while validating
 * 5. Show crew info if found
 * 6. Show graceful fallback if not found
 * 7. Store join context and redirect to signup
 */
export default function JoinRunCrewWelcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [crewInfo, setCrewInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Step 1: Read code param from URL and check auth state
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    
    if (codeFromUrl) {
      const normalizedCode = codeFromUrl.toUpperCase().trim();
      setJoinCode(normalizedCode);
      
      // Step 2: Check if user is authenticated - if so, redirect to authenticated flow
      const checkAuthAndRoute = async () => {
        try {
          const authenticated = await isAuthenticated();
          setAuthCheckComplete(true);
          
          if (authenticated) {
            // User is authenticated → redirect to Athlete-First flow
            console.log('✅ JoinRunCrewWelcome: User authenticated → Redirecting to authenticated join flow');
            navigate(`/runcrew/join?code=${encodeURIComponent(normalizedCode)}`, { replace: true });
            return;
          }
          
          // User not authenticated → continue with Join Code-First flow
          console.log('❌ JoinRunCrewWelcome: User not authenticated → Continuing with Join Code-First flow');
          
          // Step 3: Auto-validate code if in URL
          await handleValidate(normalizedCode);
        } catch (error) {
          console.error('Error checking auth state:', error);
          setAuthCheckComplete(true);
          // On error, default to Join Code-First flow
          await handleValidate(normalizedCode);
        }
      };
      
      checkAuthAndRoute();
    } else {
      setAuthCheckComplete(true);
    }
  }, [searchParams, navigate]);

  // Step 3: Validate code with backend
  const handleValidate = async (code = null) => {
    const codeToValidate = code || joinCode.trim();
    
    if (!codeToValidate) {
      setError('Please enter a join code');
      return;
    }

    setValidating(true);
    setError(null);
    setCrewInfo(null);

    try {
      console.log('🔍 JoinRunCrewWelcome: Validating code with backend...');
      const response = await fetch(`${API_BASE}/join/validate?code=${encodeURIComponent(codeToValidate.toUpperCase().trim())}`);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid or expired join code');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ JoinRunCrewWelcome: Code validated, crew found:', data.crewName);
        setCrewInfo(data);
        setJoinCode(codeToValidate.toUpperCase().trim());
      } else {
        throw new Error(data.message || 'Invalid join code');
      }
    } catch (err) {
      console.error('❌ JoinRunCrewWelcome: Validation error:', err);
      setError(err.message || 'Failed to validate join code. Please check the code and try again.');
      setCrewInfo(null);
    } finally {
      setValidating(false);
    }
  };

  // Step 7: Store join context and redirect to signup
  const handleJoinCrew = async () => {
    if (!crewInfo || !joinCode.trim()) {
      setError('Please validate a join code first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💾 JoinRunCrewWelcome: Storing join context...');
      // Store join context in Redis
      const response = await fetch(`${API_BASE}/join/temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase()
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to store join context');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ JoinRunCrewWelcome: Join context stored, redirecting to signup');
        // Store sessionId for signup flow
        setSessionId(data.sessionId);
        localStorage.setItem('joinSessionId', data.sessionId);
        
        // Redirect to signup with join context flag
        navigate(`/athletesignup?hasJoinContext=true&sessionId=${data.sessionId}`, { replace: true });
      } else {
        throw new Error(data.message || 'Failed to store join context');
      }
    } catch (err) {
      console.error('❌ JoinRunCrewWelcome: Join error:', err);
      setError(err.message || 'Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setJoinCode(value);
    setError(null);
    setCrewInfo(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && joinCode.trim() && !crewInfo) {
      handleValidate();
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setCrewInfo(null);
    setJoinCode('');
  };

  // Loading state while checking auth
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 text-sm">Loading your RunCrew... standby...</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while validating code
  if (validating && !crewInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 text-sm">Loading your RunCrew... standby...</p>
            <p className="text-gray-500 text-xs">Validating code: {joinCode}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">You've Been Invited!</h1>
          <p className="text-gray-600 text-sm">
            Join a RunCrew and start crushing your goals together
          </p>
        </div>

        {/* Error state with graceful fallback */}
        {error && !crewInfo && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🤔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Not Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                {error}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Hey, all good! Check with your bro or still wanna join?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleTryAgain}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                >
                  Try Another Code
                </button>
                <button
                  onClick={() => navigate('/runcrew/join-or-start')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition text-sm"
                >
                  Browse Crews
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success state - crew found */}
        {crewInfo && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Here's Your Crew!</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-sm text-gray-500 mb-1">Crew Name</p>
                  <p className="text-xl font-bold text-gray-900">{crewInfo.crewName}</p>
                </div>
                {crewInfo.managerName && (
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-gray-500 mb-1">Led by</p>
                    <p className="text-base font-semibold text-gray-700">{crewInfo.managerName}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-sm text-gray-500 mb-1">Members</p>
                  <p className="text-base text-gray-700">{crewInfo.memberCount} member{crewInfo.memberCount !== 1 ? 's' : ''}</p>
                </div>
                {crewInfo.description && (
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-gray-500 mb-1">About</p>
                    <p className="text-base text-gray-700">{crewInfo.description}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleJoinCrew}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Join This Crew</span>
              )}
            </button>
          </div>
        )}

        {/* Input form - shown when no code in URL or after error */}
        {!crewInfo && !error && (
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
                disabled={loading || validating}
                maxLength={20}
              />
            </div>

            <button
              onClick={() => handleValidate()}
              disabled={loading || validating || !joinCode.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {validating ? 'Validating...' : 'Validate Code'}
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
