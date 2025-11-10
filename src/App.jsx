import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './Components/ScrollToTop';

// Pages
import Splash from './Pages/Splash';
import AthleteWelcome from './Pages/Athlete/AthleteWelcome';
import Signin from './Pages/Athlete/AthleteSignin';
import SignupPage from './Pages/Athlete/AthleteSignup';
import AthleteCreateProfile from './Pages/Athlete/AthleteCreateProfile';
import EditProfile from './Pages/Athlete/EditProfile';
import AthleteHome from './Pages/Athlete/AthleteHome';
import AthleteProfile from './Pages/Athlete/AthleteProfile';
import Settings from './Pages/Settings/Settings';
import EventManagement from './Pages/Settings/EventManagement';
import VolunteerManagement from './Pages/Athlete/VolunteerManagement';
import VacantVolunteer from './Pages/Settings/VacantVolunteer';
import GarminOAuthCallback from './Pages/Settings/GarminOAuthCallback';
import GarminConnectSuccess from './Pages/Settings/GarminConnectSuccess';
import JoinOrStartCrew from './Pages/RunCrew/JoinOrStartCrew';
import JoinCrew from './Pages/RunCrew/JoinCrew';
import JoinCodeWelcome from './Pages/RunCrew/JoinCodeWelcome';
import JoinCrewWelcome from './Pages/RunCrew/JoinCrewWelcome';
import JoinRunCrewWelcome from './Pages/RunCrew/JoinRunCrewWelcome';
import PreCrewPage from './Pages/RunCrew/PreCrewPage';
import CreateCrew from './Pages/RunCrew/CreateCrew';
import RunCrewCentral from './Pages/RunCrew/RunCrewCentral';
import RunCrewCentralAdmin from './Pages/RunCrew/RunCrewCentralAdmin';
import RunCrewSettings from './Pages/RunCrew/RunCrewSettings';
import RunCrewRunDetail from './Pages/RunCrew/RunCrewRunDetail';
import CrewExplainer from './Pages/RunCrew/CrewExplainer';
import RunCrewSuccess from './Pages/RunCrew/RunCrewSuccess';
import MyActivities from './Pages/Activity/MyActivities';
import ActivityDetail from './Pages/Activity/ActivityDetail';

// Debug Components
import FindMyUserId from './Pages/Debug/FindMyUserId';

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Splash Page - Entry Point */}
        <Route path="/" element={<Splash />} />
        
        {/* Athlete Welcome Page - Handles hydration and displays account */}
        <Route path="/athlete-welcome" element={<AthleteWelcome />} />
        
        {/* Authentication */}
        <Route path="/athletesignin" element={<Signin />} />
        <Route path="/athletesignup" element={<SignupPage />} />
        
        {/* Profile Setup */}
        <Route path="/athlete-create-profile" element={<AthleteCreateProfile />} />
        <Route path="/athlete-edit-profile" element={<EditProfile />} />
        
        {/* Main App - Protected Routes */}
        <Route path="/athlete-home" element={<AthleteHome />} />
        <Route path="/athlete-profile" element={<AthleteProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/events" element={<EventManagement />} />
        <Route path="/volunteer-management" element={<VolunteerManagement />} />
        <Route path="/volunteer-management/vacant" element={<VacantVolunteer />} />
        
        {/* Activity Routes */}
        <Route path="/my-activities" element={<MyActivities />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />
        
        {/* Garmin OAuth 2.0 PKCE Flow */}
        <Route path="/garmin/callback" element={<GarminOAuthCallback />} />
        <Route path="/garmin/success" element={<GarminConnectSuccess />} />
        
        {/* Debug Routes */}
        <Route path="/debug/userid" element={<FindMyUserId />} />
        
        {/* Smart Onboarding Routes */}
        <Route path="/settings/devices" element={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-4xl font-bold text-gray-900">Device Settings - Coming Soon!</h1></div>} />
        <Route path="/crew-explainer" element={<CrewExplainer />} />
        {/* Join Code Welcome Flow - New join-first onboarding */}
        <Route path="/runcrew/join" element={<JoinCodeWelcome />} />
        {/* Existing Join or Start Flow (PRESERVED) */}
        <Route path="/runcrew/join-or-start" element={<JoinOrStartCrew />} />
        <Route path="/run-crew-join" element={<JoinCrew />} />
        {/* New Direct-Invite Join Flow */}
        <Route path="/joinruncrewwelcome" element={<JoinRunCrewWelcome />} />
        <Route path="/precrewpage" element={<PreCrewPage />} />
        <Route path="/form-run-crew" element={<CreateCrew />} />
        <Route path="/run-crew-success" element={<RunCrewSuccess />} />
        {/* RunCrew Routes - Per RunCrewArchitecture.md */}
        <Route path="/runcrew/central" element={<RunCrewCentral />} />
        <Route path="/runcrew/:id" element={<RunCrewCentral />} />
        <Route path="/crew/crewadmin" element={<RunCrewCentralAdmin />} />
        {/* Legacy routes - redirect to new routes */}
        <Route path="/runcrew/admin/:id" element={<Navigate to="/crew/crewadmin" replace />} />
        {/* Legacy routes - redirect to new routes */}
        <Route path="/runcrew-central/:id" element={<RunCrewCentral />} />
        <Route path="/runcrew-central-admin/:id" element={<Navigate to="/crew/crewadmin" replace />} />
        <Route path="/runcrew-settings" element={<RunCrewSettings />} />
        <Route path="/runcrew-run-detail/:runId?" element={<RunCrewRunDetail />} />
        {/* Legacy route - redirect to central */}
        <Route path="/runcrew-home" element={<RunCrewCentral />} />
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
