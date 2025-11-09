import React from 'react';
import { useNavigate } from 'react-router-dom';

const RunCrewSuccess = () => {
  const navigate = useNavigate();
  
  // Get crew data from localStorage
  const crewData = JSON.parse(localStorage.getItem('currentCrew') || '{}');
  const crewCode = crewData.joinCode || crewData.crewCode || 'CODE123';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(crewCode);
    alert('Crew code copied to clipboard!');
  };

  const handleGoToCentral = () => {
    navigate('/crew/crewadmin');
  };

  const createShareMessage = () => {
    return `Hi! I created a run crew on GoFast. Go to runcrewjoin.gofastcrushgoals.com, click "Join a Crew", and use this code: ${crewCode}`;
  };

  const handleCopyMessage = () => {
    const message = createShareMessage();
    navigator.clipboard.writeText(message);
    alert('Share message copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <img src="/logo.jpg" alt="GoFast" className="w-6 h-6 rounded-full" />
            <span className="text-xl font-bold text-gray-900 ml-3">GoFast</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-6xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crew Created!</h1>
            <p className="text-gray-600">
              Congratulations! Your running crew is ready to go.
            </p>
          </div>

          {/* Share Message Section */}
          <div className="bg-orange-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Share Message</h2>
            <div className="bg-white rounded-lg p-4 mb-4 border-2 border-orange-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {createShareMessage()}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCopyMessage}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>📋</span>
                <span>Copy Message</span>
              </button>
              <button
                onClick={handleCopyCode}
                className="flex-1 bg-white border-2 border-orange-200 text-orange-600 py-3 rounded-lg font-medium hover:border-orange-400 transition-colors flex items-center justify-center space-x-2"
              >
                <span>📋</span>
                <span>Copy Code Only</span>
              </button>
            </div>
          </div>

          {/* Join Instructions */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How Others Join</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 font-bold text-xs">1</span>
                </div>
                <p className="text-sm text-gray-600">Share the crew code with friends</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 font-bold text-xs">2</span>
                </div>
                <p className="text-sm text-gray-600">They go to <strong>runcrewjoin.gofastcrushgoals.com</strong></p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 font-bold text-xs">3</span>
                </div>
                <p className="text-sm text-gray-600">Enter the code and join your crew!</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoToCentral}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              Go to Run Crew Central
            </button>
            
            <button
              onClick={() => navigate('/athlete-home')}
              className="w-full bg-white border-2 border-orange-200 text-gray-900 py-3 rounded-xl font-medium hover:border-orange-400 transition-colors"
            >
              Go Back to Athlete Central
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            Your crew is live and ready for members! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default RunCrewSuccess;

