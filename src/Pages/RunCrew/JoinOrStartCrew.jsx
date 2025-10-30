import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const JoinOrStartCrew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      navigate(`/run-crew-join?code=${encodeURIComponent(code)}`);
    }
  }, [searchParams, navigate]);

  const handleJoinCrew = () => {
    navigate('/run-crew-join');
  };

  const handleStartCrew = () => {
    navigate('/form-run-crew');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="GoFast" className="w-6 h-6 rounded-full" />
              <span className="font-bold text-gray-900">GoFast</span>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Where do you want to start?</h1>
          <p className="text-gray-600">Join an existing crew or start your own</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleJoinCrew}
            className="w-full bg-orange-500 text-white py-6 rounded-xl font-bold text-xl hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">👥</span>
            <span>Enter Invite Code</span>
          </button>

          <button
            onClick={handleStartCrew}
            className="w-full bg-white border-2 border-orange-200 text-gray-900 py-6 rounded-xl font-bold text-xl hover:border-orange-400 transition-colors shadow-lg flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">🚀</span>
            <span>Start Your Crew</span>
          </button>
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">How Run Crews Work</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-bold text-xs">1</span>
              </div>
              <p className="text-sm text-gray-600">Join an existing crew with an invite code or create your own</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-bold text-xs">2</span>
              </div>
              <p className="text-sm text-gray-600">Share your join code with friends to build your crew</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-bold text-xs">3</span>
              </div>
              <p className="text-sm text-gray-600">Coordinate runs, track progress, and stay accountable together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinOrStartCrew;


