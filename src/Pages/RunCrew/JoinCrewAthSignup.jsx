import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, auth } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
 * - Matches company signup UX (Google + Email/Password options)
 */
const JoinCrewAthSignup = () => {
  const navigate = useNavigate();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState(null);
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  // Get pending join code from localStorage (set by JoinCodeWelcome)
  const pendingJoinCode = localStorage.getItem('pendingJoinCode');
  const pendingCrewName = localStorage.getItem('pendingJoinCrewName');

  // Shared signup completion logic (used by both Google and Email)
  const completeSignup = async (firebaseUser, firstName, lastName) => {
    if (!pendingJoinCode) {
      throw new Error('No join code found. Please start from the invite link.');
    }

    // Verify token exists
    const firebaseToken = await firebaseUser.getIdToken();
    if (!firebaseToken) {
      throw new Error('Failed to get authentication token');
    }
    console.log("🔐 JoinCrewAthSignup: Firebase token obtained");

    // Store Firebase token
    localStorage.setItem("firebaseToken", firebaseToken);
    localStorage.setItem("firebaseId", firebaseUser.uid);
    localStorage.setItem("email", firebaseUser.email);

    // Call backend - upsert athlete with Firebase data
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
        navigate('/crewjoin/profile', { replace: true });
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

      // Redirect to success page (user chooses next step)
      console.log("✅ JoinCrewAthSignup: Join completed! Redirecting to success page");
      navigate('/crewjoin/profile/success', { replace: true });
  };

  const handleGoogleSignUp = async () => {
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

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Failed to get Firebase user');
      }

      // Extract name from Google result
      const nameParts = result.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await completeSignup(firebaseUser, firstName, lastName);

    } catch (error) {
      console.error("❌ JoinCrewAthSignup: Google signup failed:", error);
      setError(error.response?.data?.message || error.message || 'Failed to sign up and join crew');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (isSigningUp) return;

    if (!pendingJoinCode) {
      setError('No join code found. Please start from the invite link.');
      return;
    }

    if (emailData.password !== emailData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (emailData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSigningUp(true);
    setError(null);

    try {
      console.log("🚀 JoinCrewAthSignup: Starting signup with email...");
      
      // Create Firebase account with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailData.email,
        emailData.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase profile with display name
      if (emailData.firstName || emailData.lastName) {
        const displayName = `${emailData.firstName} ${emailData.lastName}`.trim();
        await updateProfile(firebaseUser, {
          displayName: displayName
        });
      }

      console.log("✅ JoinCrewAthSignup: Email signup successful:", firebaseUser.email);

      await completeSignup(firebaseUser, emailData.firstName, emailData.lastName);

    } catch (error) {
      console.error("❌ JoinCrewAthSignup: Email signup failed:", error);
      
      // Handle Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(error.message || 'Failed to sign up and join crew');
      }
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
            Sign up to complete your join and start running together!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!showEmailForm ? (
          <>
            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={isSigningUp}
              className="w-full bg-white border-2 border-gray-300 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isSigningUp ? 'Signing up...' : 'Sign up with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Email Sign Up Option */}
            <button
              onClick={() => setShowEmailForm(true)}
              disabled={isSigningUp}
              className="w-full bg-sky-50 border-2 border-sky-200 text-sky-700 py-4 px-6 rounded-xl font-semibold hover:bg-sky-100 transition shadow-lg disabled:opacity-50"
            >
              Sign up with Email
            </button>
          </>
        ) : (
          <>
            {/* Email Sign Up Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={emailData.firstName}
                    onChange={(e) => setEmailData({...emailData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={emailData.lastName}
                    onChange={(e) => setEmailData({...emailData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={emailData.email}
                  onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={emailData.password}
                  onChange={(e) => setEmailData({...emailData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={emailData.confirmPassword}
                  onChange={(e) => setEmailData({...emailData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white font-bold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isSigningUp ? 'Signing up...' : 'Sign Up'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Already have account */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/athletesignin")}
            className="text-sky-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default JoinCrewAthSignup;
