import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './Components/ScrollToTop';

// Pages
import SplashPage from './Pages/SplashPage';
import Signin from './Pages/Athlete/Signin';
import SignupPage from './Pages/Athlete/SignupPage';
import AthleteCreateProfile from './Pages/Athlete/AthleteCreateProfile';
import AthleteHome from './Pages/Athlete/AthleteHome';

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Splash Page - Entry Point */}
        <Route path="/" element={<SplashPage />} />
        
        {/* Authentication */}
        <Route path="/athletesignin" element={<Signin />} />
        <Route path="/athletesignup" element={<SignupPage />} />
        
        {/* Profile Setup */}
        <Route path="/athlete-create-profile" element={<AthleteCreateProfile />} />
        
        {/* Main App - Protected Routes */}
        <Route path="/athlete-home" element={<AthleteHome />} />
        
        {/* Placeholder Routes */}
        <Route path="/connect" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Connect - Coming Soon!</h1></div>} />
        <Route path="/training-hub" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Training Hub - Coming Soon!</h1></div>} />
        <Route path="/shop" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Shop - Coming Soon!</h1></div>} />
        <Route path="/profile-setup" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Profile Setup - Coming Soon!</h1></div>} />
      </Routes>
    </Router>
  );
};

export default App;
