import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../firebase';

/**
 * Young Athlete Welcome Page - MVP1 Style
 * Hydration and routing gate for young athlete flow
 * Matches MVP1 AthleteWelcome pattern
 * 
 * Flow:
 * - No Firebase auth → Route to /5k-results (ParentSplash)
 * - Has athleteId but no youngAthleteId → Route to /5k-results/youth-registration
 * - Has youngAthleteId → Show welcome → Route to /5k-results/home
 */
const YoungAthleteWelcome = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check Firebase auth
    if (!user) {
      console.log('❌ YOUNG ATHLETE WELCOME: No Firebase user → routing to /5k-results');
      navigate('/5k-results');
      return;
    }

    // Check localStorage for athleteId and youngAthleteId
    const athleteId = localStorage.getItem('athleteId');
    const youngAthleteId = localStorage.getItem('youngAthleteId');

    console.log('🔍 YOUNG ATHLETE WELCOME: Checking localStorage...');
    console.log('  athleteId:', athleteId ? '✅' : '❌');
    console.log('  youngAthleteId:', youngAthleteId ? '✅' : '❌');

    // Edge case: Has athleteId but no youngAthleteId → route to registration
    if (athleteId && !youngAthleteId) {
      console.log('⚠️ YOUNG ATHLETE WELCOME: Has athleteId but no youngAthleteId → routing to youth-registration');
      navigate('/5k-results/youth-registration');
      return;
    }

    // No athleteId at all → route to parent splash (shouldn't happen but handle it)
    if (!athleteId) {
      console.log('⚠️ YOUNG ATHLETE WELCOME: No athleteId → routing to /5k-results');
      navigate('/5k-results');
      return;
    }

    // Has both → show welcome
    console.log('✅ YOUNG ATHLETE WELCOME: All hydrated, showing welcome');
    setIsLoading(false);
    
    // Small delay to show welcome message, then hydrate
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleLetsGo = () => {
    navigate('/5k-results/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 animate-pulse">
          Let's Go <span className="text-orange-300">Crush</span> Goals!
        </h1>
        <p className="text-2xl md:text-3xl text-orange-100 font-medium mb-8">
          Ready to see your athlete's progress?
        </p>
        
        {isLoading && (
          <div className="mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl text-orange-100">Loading...</p>
          </div>
        )}

        {!isLoading && !isHydrated && (
          <div className="mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl text-orange-100">Preparing...</p>
          </div>
        )}

        {isHydrated && (
          <div className="mt-8">
            <button
              onClick={handleLetsGo}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-12 py-4 rounded-xl font-bold text-2xl hover:from-orange-700 hover:to-orange-600 transition shadow-2xl transform hover:scale-105"
            >
              Let's Go! →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default YoungAthleteWelcome;

