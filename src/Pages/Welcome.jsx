import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getAuth } from 'firebase/auth';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const hydrateAthlete = async () => {
      try {
        // Get Firebase user to ensure we have auth
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        
        if (!firebaseUser) {
          console.log('❌ No Firebase user found → redirecting to signup');
          navigate('/athletesignup');
          return;
        }

        console.log('🚀 WELCOME: Hydrating Athlete data...');
        
        // Call hydration endpoint (token automatically added by api interceptor)
        const response = await api.get('/athlete/hydrate');
        
        if (!response.data.success) {
          console.error('❌ Hydration failed:', response.data.error);
          navigate('/athletesignup');
          return;
        }

        const { athlete } = response.data;
        console.log('✅ WELCOME: Athlete hydrated:', athlete);

        // Cache Athlete data to localStorage
        localStorage.setItem('athleteId', athlete.athleteId);
        localStorage.setItem('athleteProfile', JSON.stringify(athlete));
        localStorage.setItem('profileHydrated', 'true');
        
        // Store RunCrews if available
        if (athlete.runCrews && athlete.runCrews.length > 0) {
          localStorage.setItem('myCrews', JSON.stringify(athlete.runCrews));
        }

        // Routing Logic based on what's missing
        // Profile check: Does athlete have gofastHandle? (basic profile requirement)
        if (!athlete.gofastHandle || athlete.gofastHandle.trim() === '') {
          console.log('⚠️ Missing profile → routing to profile setup');
          navigate('/athlete-create-profile');
          return;
        }

        // All complete - route directly to athlete home
        console.log('✅ Athlete fully hydrated - routing to athlete home');
        navigate('/athlete-home');
        return;
        
      } catch (error) {
        console.error('❌ WELCOME: Hydration error:', error);
        
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
        
        // Other errors - redirect to signup
        navigate('/athletesignup');
      }
    };

    hydrateAthlete();
  }, [navigate]);

  // Show loading state while hydrating (will route away when complete)
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-xl">Loading your account...</p>
      </div>
    </div>
  );
}

