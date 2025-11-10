import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, auth } from '../../firebase';
import api from '../../api/axiosConfig';

const SignupPage = () => {
  const navigate = useNavigate();
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = async () => {
    if (isSigningUp) return;
    
    setIsSigningUp(true);
    try {
      console.log("🚀 Starting signup with Google...");
      const result = await signInWithGoogle();
      
      console.log("✅ Google sign-in successful:", result.email);
      
      // Get Firebase ID token for backend verification
      const firebaseToken = await auth.currentUser.getIdToken();
      console.log("🔐 Firebase token obtained: [REDACTED]");
      
      // Store Firebase token for API calls
      localStorage.setItem("firebaseToken", firebaseToken);
      
      // Call backend create athlete - no body needed, route extracts from Firebase token
      console.log("🌐 Calling backend API: /athlete/create");
      const res = await api.post("/athlete/create");
      
      console.log("✅ Backend API response:", res.data);
      
      const athlete = res.data;
      
      // CRITICAL: Validate backend response
      if (!athlete || !athlete.success) {
        throw new Error(`Backend API failed: ${athlete?.message || 'Invalid response'}`);
      }
      
      // Store auth data
      localStorage.setItem("firebaseId", result.uid);
      localStorage.setItem("athleteId", athlete.athleteId);
      localStorage.setItem("email", athlete.data?.email || result.email);
      
      // Route based on profile completion (check gofastHandle - better indicator than firstName)
      // If gofastHandle exists, athlete has completed profile setup → route to home
      // If gofastHandle is null, athlete needs profile setup → route to profile setup
      if (athlete.data?.gofastHandle) {
        console.log("✅ SUCCESS: Existing athlete with profile → Athlete Home");
        navigate("/athlete-home");
      } else {
        console.log("✅ SUCCESS: New athlete or incomplete profile → Profile setup");
        navigate('/athlete-create-profile');
      }
      
    } catch (error) {
      console.error("❌ Signup failed:", error);
      
      // MVP: Simple error popup
      alert(`❌ MVP FAILED!\n\nError: ${error.message}\n\nStatus: ${error.response?.status || 'Unknown'}\n\nBackend API call failed!`);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSignIn = () => {
    navigate('/athletesignin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center space-y-8 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
        
        {/* Logo */}
        <div className="space-y-4">
          <img src="/logo.jpg" alt="GoFast" className="w-20 h-20 rounded-full mx-auto shadow-lg" />
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Join GoFast!
          </h1>
          <p className="text-gray-600 text-lg">
            Start crushing your running goals
          </p>
        </div>

        {/* Sign Up Button */}
        <button
          onClick={handleSignUp}
          disabled={isSigningUp}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-600 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSigningUp ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Signing up...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </>
          )}
        </button>

        {/* Already have account */}
        <p className="text-gray-600 text-sm">
          Already on the platform?{" "}
          <button
            onClick={handleSignIn}
            className="text-orange-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>

        {/* Back button */}
        <button
          onClick={handleBack}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to splash
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
