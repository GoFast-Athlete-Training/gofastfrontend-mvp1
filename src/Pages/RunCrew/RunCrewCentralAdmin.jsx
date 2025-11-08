import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const {
    athlete: hydratedAthlete,
    athleteId,
    runCrewId,
    runCrewAdminId
  } = useHydratedAthlete();

  const [crew, setCrew] = useState(hydratedAthlete?.runCrew || null);
  const [crewLoading, setCrewLoading] = useState(!hydratedAthlete?.runCrew && !!runCrewId);
  const [crewError, setCrewError] = useState(null);

  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsMessage, setRunsMessage] = useState(null);
  const [runsError, setRunsError] = useState(null);
  const [showRuns, setShowRuns] = useState(false);

  useEffect(() => {
    if (hydratedAthlete?.runCrew) {
      setCrew(hydratedAthlete.runCrew);
      setCrewLoading(false);
    }
  }, [hydratedAthlete?.runCrew]);

  const missingContext = !athleteId || !runCrewId;

  useEffect(() => {
    if (missingContext) {
      navigate('/athlete-welcome');
    }
  }, [missingContext, navigate]);

  const hydrateCrew = useCallback(async () => {
    if (missingContext) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.warn('[WARN] RUNCREW ADMIN: Firebase user missing during hydrateCrew');
      return;
    }

    try {
      setCrewLoading(true);
      setCrewError(null);

      const token = await user.getIdToken();
      const { data } = await axios.get(`${API_BASE}/runcrew/${runCrewId}/context/${athleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!data?.success || !data.runCrew) {
        throw new Error(data?.error || data?.message || 'Failed to load crew context.');
      }

      setCrew(data.runCrew);
    } catch (error) {
      setCrewError(error.message || 'Unable to hydrate crew.');
    } finally {
      setCrewLoading(false);
    }
  }, [athleteId, missingContext, runCrewId]);

  const refreshRuns = useCallback(async () => {
    if (missingContext) {
      setRunsMessage('Runs will appear once your crew context is ready.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setRunsMessage('Runs will appear once you refresh after signing in.');
      return;
    }

    try {
      setRunsLoading(true);
      setRunsError(null);
      setRunsMessage(null);

      const token = await user.getIdToken();
      const { data } = await axios.get(`${API_BASE}/runcrew/${runCrewId}/runs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!data?.success) {
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
  }, [missingContext, runCrewId]);

  useEffect(() => {
    if (!missingContext) {
      hydrateCrew();
    }
  }, [hydrateCrew, missingContext]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const actingAthleteName = hydratedAthlete?.firstName
    ? `${hydratedAthlete.firstName}${hydratedAthlete.lastName ? ` ${hydratedAthlete.lastName}` : ''}`
    : null;

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {crewLoading ? 'RunCrew' : crew?.name || 'RunCrew'}
              </h1>
              <p className="text-sm text-gray-500">{currentDate}</p>
              {athleteId && (
                <p className="mt-2 text-base text-gray-700">
                  Welcome, athlete #{athleteId}{actingAthleteName ? ` (${actingAthleteName})` : ''}. How do you want to manage your crew today?
                </p>
              )}
              <div className="mt-2 bg-sky-100 border border-sky-200 rounded px-3 py-2 text-xs text-sky-900">
                <p>runCrewId: {runCrewId || '—'}</p>
                <p>runCrewAdminId: {runCrewAdminId || '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/runcrew-list')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              See as Member
            </button>
            <button
              onClick={() => navigate('/runcrew-settings')}
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
                    {run.startTime ? ` · ${run.startTime}` : ''}
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

