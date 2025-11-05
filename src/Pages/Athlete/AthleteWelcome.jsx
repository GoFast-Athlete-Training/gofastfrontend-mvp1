import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { getAuth } from 'firebase/auth';

export default function AthleteWelcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hydrateAthlete = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get Firebase user to ensure we have auth
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        
        if (!firebaseUser) {
          console.log('❌ No Firebase user found → redirecting to signup');
          navigate('/athletesignup');
          return;
        }

        console.log('🚀 ATHLETE WELCOME: Hydrating Athlete data...');
        
        // Call hydration endpoint (token automatically added by api interceptor)
        const response = await api.get('/athlete/hydrate');
        
        if (!response.data.success) {
          console.error('❌ Hydration failed:', response.data.error);
          setError(response.data.error || 'Failed to load athlete data');
          setIsLoading(false);
          return;
        }

        const hydratedAthlete = response.data.athlete;
        console.log('✅ ATHLETE WELCOME: Athlete hydrated:', hydratedAthlete);

        // Cache Athlete data to localStorage
        localStorage.setItem('athleteId', hydratedAthlete.athleteId);
        localStorage.setItem('athleteProfile', JSON.stringify(hydratedAthlete));
        localStorage.setItem('profileHydrated', 'true');
        
        // Store RunCrews if available
        if (hydratedAthlete.runCrews && hydratedAthlete.runCrews.length > 0) {
          localStorage.setItem('myCrews', JSON.stringify(hydratedAthlete.runCrews));
        }
        
        // Hydration complete - navigate to athlete home
        console.log('✅ ATHLETE WELCOME: Hydration complete, navigating to athlete-home');
        navigate('/athlete-home');
        
      } catch (error) {
        console.error('❌ ATHLETE WELCOME: Hydration error:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load athlete data');
        setIsLoading(false);
        
        // If 401, user not authenticated or token expired
        if (error.response?.status === 401) {
          console.log('🚫 Unauthorized → redirecting to signup');
          navigate('/athletesignup');
          return;
        }
        
        // If user not found, redirect to signup
        if (error.response?.status === 404) {
          console.log('👤 Athlete not found → redirecting to signup');
          navigate('/athletesignup');
          return;
        }
      }
    };

    hydrateAthlete();
  }, [navigate]);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Account</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/athletesignup')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 animate-pulse">
          Let's Go <span className="text-orange-400">Crush</span> Goals!
        </h1>
        <p className="text-2xl md:text-3xl text-sky-100 font-medium mb-8">
          Start your running journey
        </p>
        {isLoading && (
          <div className="mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl text-sky-100">Loading your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}

