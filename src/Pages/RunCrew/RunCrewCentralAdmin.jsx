import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const { id: runCrewId } = useParams();

  const [crew, setCrew] = useState(null);
  const [crewLoading, setCrewLoading] = useState(true);
  const [crewError, setCrewError] = useState(null);

  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsMessage, setRunsMessage] = useState(null);
  const [runsError, setRunsError] = useState(null);
  const [showRuns, setShowRuns] = useState(false);

  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please sign in to manage this crew.');
    }
    return user.getIdToken();
  }, []);

  const hydrateCrew = useCallback(async () => {
    try {
      setCrewLoading(true);
      setCrewError(null);

      const token = await getToken();
      const response = await fetch(`${API_BASE}/runcrew/${runCrewId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data.runCrew) {
        throw new Error(data?.error || data?.message || 'Failed to load crew.');
      }

      setCrew(data.runCrew);
    } catch (error) {
      setCrewError(error.message || 'Unable to hydrate crew.');
    } finally {
      setCrewLoading(false);
    }
  }, [getToken, runCrewId]);

  const refreshRuns = useCallback(async () => {
    try {
      setRunsLoading(true);
      setRunsError(null);
      setRunsMessage(null);

      const token = await getToken();
      const response = await fetch(`${API_BASE}/runcrew/${runCrewId}/runs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to fetch runs.');
      }

      const runList = Array.isArray(data.runs) ? data.runs : [];
      setRuns(runList);
      setRunsMessage(`Received ${runList.length} run${runList.length === 1 ? '' : 's'}.`);
      setShowRuns(runList.length > 0);
    } catch (error) {
      setRunsError(error.message || 'Unable to fetch runs.');
    } finally {
      setRunsLoading(false);
    }
  }, [getToken, runCrewId]);

  useEffect(() => {
    hydrateCrew();
  }, [hydrateCrew]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">RunCrew Admin</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/runcrew/${runCrewId}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              See as Member
            </button>
            <button
              onClick={() => navigate(`/runcrew-settings/${runCrewId}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {crewLoading ? 'Loading crew…' : crew?.name || 'RunCrew'}
            </h2>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>

          <p className="text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            Welcome back. Crew hydration now comes directly from the backend. Use the controls below to fetch the latest runs once the routes are live.
          </p>

          {crewError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {crewError}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Runs Module</h3>
            <button
              onClick={refreshRuns}
              disabled={runsLoading}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
            >
              {runsLoading ? 'Checking runs…' : 'Refresh Runs'}
            </button>
          </div>

          {runsMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
              {runsMessage}
            </div>
          )}
          {runsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {runsError}
            </div>
          )}

          <div className="border border-dashed border-gray-300 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
            Add Run · Add Event · Add Announcement
          </div>

          <button
            type="button"
            onClick={() => setShowRuns(prev => !prev)}
            disabled={runs.length === 0}
            className="w-full border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            {showRuns ? 'Hide Runs' : 'See Built Runs'}
          </button>

          {showRuns && runs.length > 0 && (
            <div className="space-y-3">
              {runs.map(run => (
                <div key={run.id} className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{run.title || 'Untitled Run'}</p>
                  <p className="text-xs text-gray-500">
                    {run.date ? new Date(run.date).toLocaleString() : 'Date TBD'}
                    {run.startTime ? ` • ${run.startTime}` : ''}
                  </p>
                  {run.meetUpPoint && (
                    <p className="text-xs text-gray-500">Meet at {run.meetUpPoint}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

