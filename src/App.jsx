import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './Components/ScrollToTop';

// Pages
import Splash from './Pages/Splash';
import Signin from './Pages/Athlete/AthleteSignin';
import SignupPage from './Pages/Athlete/AthleteSignup';
import AthleteCreateProfile from './Pages/Athlete/AthleteCreateProfile';
import AthleteHome from './Pages/Athlete/AthleteHome';
import AthleteProfile from './Pages/Athlete/AthleteProfile';
import Settings from './Pages/Settings/Settings';
import GarminOAuthCallback from './Pages/Settings/GarminOAuthCallback';
import GarminConnectSuccess from './Pages/Settings/GarminConnectSuccess';

// Debug Components
import FindMyUserId from './Pages/Debug/FindMyUserId';

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Splash Page - Entry Point */}
        <Route path="/" element={<Splash />} />
        
        {/* Authentication */}
        <Route path="/athletesignin" element={<Signin />} />
        <Route path="/athletesignup" element={<SignupPage />} />
        
        {/* Profile Setup */}
        <Route path="/athlete-create-profile" element={<AthleteCreateProfile />} />
        
        {/* Main App - Protected Routes */}
        <Route path="/athlete-home" element={<AthleteHome />} />
        <Route path="/athlete-profile" element={<AthleteProfile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Garmin OAuth 2.0 PKCE Flow */}
        <Route path="/garmin/callback" element={<GarminOAuthCallback />} />
        <Route path="/garmin/success" element={<GarminConnectSuccess />} />
        
        {/* Debug Routes */}
        <Route path="/debug/userid" element={<FindMyUserId />} />
        
        {/* Smart Onboarding Routes */}
        <Route path="/settings/devices" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Device Settings - Coming Soon!</h1></div>} />
        <Route path="/runcrew/join" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Join RunCrew - Coming Soon!</h1></div>} />
        <Route path="/runcrew/start" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Start RunCrew - Coming Soon!</h1></div>} />
        <Route path="/runcrew/dashboard" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">RunCrew Dashboard - Coming Soon!</h1></div>} />
        <Route path="/training/track" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Track Runs - Coming Soon!</h1></div>} />
        <Route path="/training/analytics" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Training Analytics - Coming Soon!</h1></div>} />
        <Route path="/connect/partners" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Find Partners - Coming Soon!</h1></div>} />
        
        {/* Legacy Placeholder Routes */}
        <Route path="/connect" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Connect - Coming Soon!</h1></div>} />
        <Route path="/training-hub" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Training Hub - Coming Soon!</h1></div>} />
        <Route path="/shop" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Shop - Coming Soon!</h1></div>} />
        <Route path="/profile-setup" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Profile Setup - Coming Soon!</h1></div>} />
      </Routes>
    </Router>
  );
};

export default App;
