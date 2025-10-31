// RunCrew Demo Navigation
// Simple nav page to jump to different RunCrew views for demo purposes

import { useNavigate } from 'react-router-dom';

export default function RunCrewDemoNav() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RunCrew Demo Navigation</h1>
          <p className="text-gray-600 mb-8">Jump to any RunCrew view to see the UX</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Onboarding Flow */}
            <div className="border-2 border-orange-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Onboarding</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/crew-explainer')}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600"
                >
                  Crew Explainer
                </button>
                <button
                  onClick={() => navigate('/runcrew/join')}
                  className="w-full bg-orange-100 text-orange-700 py-3 rounded-lg font-medium hover:bg-orange-200"
                >
                  Join or Start Crew
                </button>
                <button
                  onClick={() => navigate('/form-run-crew')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                >
                  Create Crew Form
                </button>
                <button
                  onClick={() => navigate('/run-crew-join')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                >
                  Join Crew (Enter Code)
                </button>
              </div>
            </div>

            {/* Crew Views */}
            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Crew Views</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/runcrew-home')}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600"
                >
                  RunCrew Home
                </button>
                <button
                  onClick={() => navigate('/athlete-home')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                >
                  Back to Athlete Home
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/athlete-home')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

