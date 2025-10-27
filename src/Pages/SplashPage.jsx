import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const SplashPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      // Auto-navigate after animation
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/athlete-home');
        } else {
          navigate('/athlete-signin');
        }
      }, 3000); // 3 second animation
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/athlete-home');
    } else {
      navigate('/athlete-signin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-white rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center">
      {/* Logo Animation - Bottom to Top */}
      <div className="flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="animate-bounce">
          <img 
            src="/logo.jpg" 
            alt="GoFast Logo" 
            className="w-24 h-24 rounded-full shadow-2xl"
          />
        </div>
        
        {/* Tagline */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-pulse">
            Let's Go Crush Goals!
          </h1>
          <p className="text-xl md:text-2xl text-orange-100 font-medium">
            Your running journey starts here
          </p>
        </div>
      </div>

      {/* Get Started Button */}
      <div className="mt-16">
        <button
          onClick={handleGetStarted}
          className="bg-white text-orange-600 font-bold py-4 px-8 rounded-full text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 animate-pulse"
        >
          Get Started
        </button>
      </div>

      {/* Loading Indicator */}
      <div className="mt-8">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
