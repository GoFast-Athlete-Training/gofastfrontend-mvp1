import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const SplashPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('logo'); // logo -> black -> text -> route

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Animation sequence
      const timer1 = setTimeout(() => {
        setAnimationPhase('black');
      }, 2000); // Logo shows for 2 seconds

      const timer2 = setTimeout(() => {
        setAnimationPhase('text');
      }, 3000); // Black screen for 1 second

      const timer3 = setTimeout(() => {
        if (isAuthenticated) {
          navigate('/athlete-home');
        } else {
          navigate('/athletesignup');
        }
      }, 6000); // Text shows for 3 seconds, then route

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center relative overflow-hidden">
      {/* Logo Phase */}
      {animationPhase === 'logo' && (
        <div className="animate-fade-in">
          <img 
            src="/logo.jpg" 
            alt="GoFast Logo" 
            className="w-48 h-48 rounded-full shadow-2xl mx-auto"
          />
        </div>
      )}

      {/* Fade Away Phase */}
      {animationPhase === 'black' && (
        <div className="animate-fade-out">
          <img 
            src="/logo.jpg" 
            alt="GoFast Logo" 
            className="w-48 h-48 rounded-full shadow-2xl mx-auto opacity-0"
          />
        </div>
      )}

      {/* Text Phase */}
      {animationPhase === 'text' && (
        <div className="text-center animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 animate-pulse">
            Let's Go <span className="text-orange-400">Crush</span> Goals!
          </h1>
          <p className="text-2xl md:text-3xl text-sky-100 font-medium">
            Your running journey starts here
          </p>
        </div>
      )}
    </div>
  );
};

export default SplashPage;
