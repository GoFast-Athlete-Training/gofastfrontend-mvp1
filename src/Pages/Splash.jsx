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
      // Show logo for 2 seconds, then route
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigate('/athlete-welcome');
        } else {
          navigate('/athletesignup');
        }
      }, 2000); // Logo shows for 2 seconds, then route

      return () => clearTimeout(timer);
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
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
      <div className="animate-fade-in">
        <img 
          src="/logo.jpg" 
          alt="GoFast Logo" 
          className="w-48 h-48 rounded-full shadow-2xl mx-auto"
        />
      </div>
    </div>
  );
};

export default SplashPage;
