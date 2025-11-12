import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, auth } from '../../firebase';
import api from '../../api/axiosConfig';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

/**
 * JoinCrewAthSignup - Signup page specifically for join crew flow
 * Route: /joincrew-ath-signup
 * 
 * Purpose: Dedicated signup flow for users joining via invite link
 * - Stores join intent before auth
 * - After auth, upserts athlete + joins crew atomically
 * - Routes to profile creation if needed, or crew if profile complete
 */
const JoinCrewAthSignup = () => {
  const navigate = useNavigate();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState(null);

  // Get pending join code from localStorage (set by JoinCodeWelcome)
  const pendingJoinCode = localStorage.getItem('pendingJoinCode');
  const pendingCrewName = localStorage.getItem('pendingJoinCrewName');

  const handleSignUp = async () => {
    if (isSigningUp) return;
    
    if (!pendingJoinCode) {
      setError('No join code found. Please start from the invite link.');
      return;
    }
    
    setIsSigningUp(true);
    setError(null);
    
    try {
      console.log("🚀 JoinCrewAthSignup: Starting signup with Google...");
      const result = await signInWithGoogle();
      
      console.log("✅ JoinCrewAthSignup: Google sign-in successful:", result.email);
      
      // Verify token exists
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        throw new Error('Failed to get authentication token');
      }
      console.log("🔐 JoinCrewAthSignup: Firebase token obtained");
      
      // Store Firebase token
      localStorage.setItem("firebaseToken", firebaseToken);
      localStorage.setItem("firebaseId", result.uid);
      localStorage.setItem("email", result.email);
      
      // Call backend - upsert athlete with Firebase data (simple - just push Firebase data)
      console.log("🌐 JoinCrewAthSignup: Upserting athlete with Firebase data...");
      const athleteResponse = await api.post('/athlete/create', {});

      if (!athleteResponse.data || !athleteResponse.data.success) {
        throw new Error(athleteResponse.data?.message || 'Failed to create athlete');
      }

      const athleteId = athleteResponse.data.athleteId;
      if (!athleteId) {
        throw new Error('No athlete ID returned from server');
      }
      console.log("✅ JoinCrewAthSignup: Athlete upserted:", athleteId);
      
      localStorage.setItem("athleteId", athleteId);

      // Check if athlete has profile (gofastHandle) - if not, go to profile creation
      const athleteData = athleteResponse.data.data;
      if (!athleteData?.gofastHandle) {
        // Profile incomplete - redirect to profile creation (join will happen after profile)
        console.log("✅ JoinCrewAthSignup: Profile incomplete → Redirecting to profile creation");
        navigate('/joincrew-ath-profile', { replace: true });
        return;
      }

      // Profile complete - now join crew atomically
      console.log("🌐 JoinCrewAthSignup: Profile complete, joining crew atomically...");
      const joinResponse = await api.post('/runcrew/join', {
        joinCode: pendingJoinCode
      });

      if (!joinResponse.data.success) {
        throw new Error(joinResponse.data.message || 'Failed to join crew');
      }

      const { runCrew } = joinResponse.data;

      // Check if user is admin
      const managerRecord = Array.isArray(runCrew?.managers)
        ? runCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
        : null;
      const isAdmin = Boolean(managerRecord);

      // Store crew data
      LocalStorageAPI.setRunCrewData({
        ...runCrew,
        isAdmin
      });
      LocalStorageAPI.setRunCrewId(runCrew.id);
      
      if (managerRecord) {
        LocalStorageAPI.setRunCrewManagerId(managerRecord.id);
      }

      // Clear pending join intent
      localStorage.removeItem('pendingJoinCode');
      localStorage.removeItem('pendingJoinCrewId');
      localStorage.removeItem('pendingJoinCrewName');

      // Redirect to crew
      console.log("✅ JoinCrewAthSignup: Join completed! Redirecting to crew");
      if (isAdmin) {
        navigate('/crew/crewadmin', { replace: true });
      } else {
        navigate('/runcrew/central', { replace: true });
      }
      
    } catch (error) {
      console.error("❌ JoinCrewAthSignup: Signup failed:", error);
      setError(error.response?.data?.message || error.message || 'Failed to sign up and join crew');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.jpg" alt="GoFast" className="w-12 h-12 rounded-full shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join {pendingCrewName || 'Your Crew'}</h1>
          <p className="text-gray-600">
            Sign in to complete your join and start running together!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSignUp}
          disabled={isSigningUp}
          className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSigningUp ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing up...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.837c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.025 1.592 1.025 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"></path>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JoinCrewAthSignup;

