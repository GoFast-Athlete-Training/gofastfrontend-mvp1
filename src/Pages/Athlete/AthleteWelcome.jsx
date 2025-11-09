import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { getAuth } from 'firebase/auth';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

export default function AthleteWelcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hydrateAthlete = async () => {
      try {
        console.log('🚀 ATHLETE WELCOME: ===== STARTING HYDRATION =====');
        setIsLoading(true);
        setError(null);

        // Get Firebase user to ensure we have auth
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        
        if (!firebaseUser) {
          console.log('❌ ATHLETE WELCOME: No Firebase user found → redirecting to signup');
          navigate('/athletesignup');
          return;
        }

        console.log('✅ ATHLETE WELCOME: Firebase user found');
        console.log('✅ ATHLETE WELCOME: Firebase UID:', firebaseUser.uid);
        console.log('✅ ATHLETE WELCOME: Firebase Email:', firebaseUser.email);
        console.log('🚀 ATHLETE WELCOME: Calling hydration endpoint...');
        
        // Call hydration endpoint (token automatically added by api interceptor)
        const response = await api.post('/athlete/hydrate');
        
        console.log('📡 ATHLETE WELCOME: Response received:', response.status);
        
        if (!response.data.success) {
          console.error('❌ ATHLETE WELCOME: Hydration failed:', response.data.error);
          setError(response.data.error || 'Failed to load athlete data');
          setIsLoading(false);
          return;
        }

        const hydratedAthlete = response.data.athlete;
        console.log('✅ ATHLETE WELCOME: Athlete hydrated successfully');
        console.log('✅ ATHLETE WELCOME: Athlete ID:', hydratedAthlete.athleteId);
        console.log('✅ ATHLETE WELCOME: Email:', hydratedAthlete.email);
        console.log('✅ ATHLETE WELCOME: Name:', hydratedAthlete.firstName, hydratedAthlete.lastName);
        console.log('✅ ATHLETE WELCOME: RunCrews count:', hydratedAthlete.runCrews?.length || 0);
        
        if (hydratedAthlete.runCrews && hydratedAthlete.runCrews.length > 0) {
          console.log('✅ ATHLETE WELCOME: RunCrews:', hydratedAthlete.runCrews.map(c => c.name).join(', '));
        }

        // Cache Athlete data to localStorage (ATHLETE ONLY)
        console.log('💾 ATHLETE WELCOME: Caching athlete data to localStorage...');
        LocalStorageAPI.setAthleteProfile(hydratedAthlete);
        LocalStorageAPI.setAthleteId(hydratedAthlete.athleteId || hydratedAthlete.id);

        // Clear crew context - will be set when user clicks "Go to RunCrew"
        LocalStorageAPI.setRunCrewId(null);
        LocalStorageAPI.setRunCrewManagerId(null);
        LocalStorageAPI.setRunCrewData(null);
        
        console.log('✅ ATHLETE WELCOME: Athlete context cached (crew context cleared)');
        
        // Hydration complete - show button for user to click
        console.log('🎯 ATHLETE WELCOME: Hydration complete, ready for user action');
        console.log('✅ ATHLETE WELCOME: ===== HYDRATION SUCCESS =====');
        setIsHydrated(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ ATHLETE WELCOME: ===== HYDRATION ERROR =====');
        console.error('❌ ATHLETE WELCOME: Error message:', error.message);
        console.error('❌ ATHLETE WELCOME: Error status:', error.response?.status);
        console.error('❌ ATHLETE WELCOME: Error data:', error.response?.data);
        
        setError(error.response?.data?.message || error.message || 'Failed to load athlete data');
        setIsLoading(false);
        
        // If 401, user not authenticated or token expired
        if (error.response?.status === 401) {
          console.log('🚫 ATHLETE WELCOME: Unauthorized (401) → redirecting to signup');
          navigate('/athletesignup');
          return;
        }
        
        // If user not found, redirect to signup
        if (error.response?.status === 404) {
          console.log('👤 ATHLETE WELCOME: Athlete not found (404) → redirecting to signup');
          navigate('/athletesignup');
          return;
        }
        
        console.error('❌ ATHLETE WELCOME: ===== END ERROR =====');
      }
    };

    hydrateAthlete();
  }, [navigate]);

  const handleLetsTrain = () => {
    console.log('🎯 ATHLETE WELCOME: User clicked "Let\'s Train!" → navigating to athlete-home');
    navigate('/athlete-home');
  };


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

        {isHydrated && !isLoading && (
          <div className="mt-8">
            <button
              onClick={handleLetsTrain}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-12 py-4 rounded-xl font-bold text-2xl hover:from-orange-700 hover:to-orange-600 transition shadow-2xl transform hover:scale-105"
            >
              Let's Train! →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

