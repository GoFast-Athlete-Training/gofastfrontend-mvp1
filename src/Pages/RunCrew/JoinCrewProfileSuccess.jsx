import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';

/**
 * JoinCrewProfileSuccess - Success page after profile creation in join flow
 * Route: /crewjoin/profile/success
 * 
 * Purpose: Celebrate profile completion and give clear next steps
 * - Shows success message
 * - Options to go to RunCrew or go home
 * - Only shown in join crew flow context
 */
const JoinCrewProfileSuccess = () => {
  const navigate = useNavigate();
  const { runCrewId, runCrewManagerId } = useHydratedAthlete();
  const crew = LocalStorageAPI.getRunCrewData();
  const pendingCrewName = localStorage.getItem('pendingJoinCrewName');

  const crewName = crew?.name || pendingCrewName || 'Your Crew';
  const isAdmin = Boolean(runCrewManagerId);

  const handleGoToCrew = () => {
    if (isAdmin) {
      navigate('/crew/crewadmin', { replace: true });
    } else {
      navigate('/runcrew/central', { replace: true });
    }
  };

  const handleGoToHome = () => {
    navigate('/athlete-home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Profile Complete!</h1>
          <p className="text-gray-600">
            You've successfully joined <strong>{crewName}</strong> and completed your profile!
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            🎉 <strong>You're all set!</strong> You can now see runs, chat with your crew, and track your progress together.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleGoToCrew}
            className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Go to {crewName}</span>
          </button>

          <button
            onClick={handleGoToHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            Go to Home
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          You can always update your profile later in settings
        </p>
      </div>
    </div>
  );
};

export default JoinCrewProfileSuccess;

