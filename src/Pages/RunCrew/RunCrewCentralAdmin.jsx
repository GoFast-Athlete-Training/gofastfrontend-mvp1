import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

const initialRunForm = {
  title: '',
  date: '',
  time: '',
  meetUpPoint: ''
};

export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const {
    athlete: hydratedAthlete,
    athleteId,
    runCrewId,
    runCrewManagerId
  } = useHydratedAthlete();

  const [crew, setCrew] = useState(() => LocalStorageAPI.getRunCrewData());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [toast, setToast] = useState(null);

  const [announcementContent, setAnnouncementContent] = useState('');
  const [runForm, setRunForm] = useState(initialRunForm);
  const [editingRunId, setEditingRunId] = useState(null); // Track which run is being edited

  const isAdmin = useMemo(() => {
    if (!crew || !athleteId) {
      return false;
    }
    if (runCrewManagerId) {
      return true;
    }
    if (Array.isArray(crew.managers)) {
      return crew.managers.some(
        (manager) => manager.athleteId === athleteId && manager.role === 'admin'
      );
    }
    return false;
  }, [crew, athleteId, runCrewManagerId]);
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), []);

  const runs = crew?.runs || [];
  const announcements = crew?.announcements || [];
  const messages = crew?.messages || [];
  const memberships = crew?.memberships || crew?.members || [];

  const showToast = (message) => {
    setToast(message);
    if (message) {
      setTimeout(() => {
        setToast(null);
      }, 2400);
    }
  };

  const persistCrew = (updatedCrew) => {
    if (!updatedCrew) return;

    const enrichedCrew = {
      ...updatedCrew,
      isAdmin: isAdmin || updatedCrew.isAdmin
    };

    const idToPersist = enrichedCrew.id || runCrewId || null;
    const managerRecord = Array.isArray(enrichedCrew.managers)
      ? enrichedCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
      : null;
    const managerIdToPersist = managerRecord?.id || enrichedCrew.currentManagerId || runCrewManagerId || null;

    if (idToPersist) {
      LocalStorageAPI.setRunCrewId(idToPersist);
    }

    LocalStorageAPI.setRunCrewManagerId(managerIdToPersist);
    LocalStorageAPI.setRunCrewData(enrichedCrew);
    setCrew(enrichedCrew);
  };

  const handleResync = async () => {
    if (!runCrewId) {
      setSyncError('Missing crew context. Please return to Athlete Home.');
      return;
    }

    try {
      setSyncing(true);
      setSyncError(null);

      const { data } = await axios.post(`${API_BASE}/runcrew/hydrate`, {
        runCrewId,
        athleteId
      });

      if (!data?.success || !data.runCrew) {
        throw new Error(data?.error || data?.message || 'Unable to hydrate crew');
      }

      const managerRecord = Array.isArray(data.runCrew?.managers)
        ? data.runCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
        : null;

      LocalStorageAPI.setRunCrewData({
        ...data.runCrew,
        isAdmin: managerRecord ? true : data.runCrew.isAdmin
      });
      LocalStorageAPI.setRunCrewId(data.runCrew.id);
      LocalStorageAPI.setRunCrewManagerId(managerRecord?.id || data.runCrew.currentManagerId || null);

      setCrew({
        ...data.runCrew,
        isAdmin: managerRecord ? true : data.runCrew.isAdmin
      });
      showToast('Crew re-synced from server');
    } catch (error) {
      setSyncError(error.message || 'Unable to sync crew. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAnnouncementSubmit = (event) => {
    event.preventDefault();
    if (!crew) {
      showToast('Sync your crew before posting');
      return;
    }

    const trimmed = announcementContent.trim();
    if (!trimmed) {
      showToast('Please write an announcement first');
      return;
    }

    const newAnnouncement = {
      id: `local-ann-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      isLocalOnly: true,
      author: hydratedAthlete
        ? {
            id: athleteId,
            firstName: hydratedAthlete.firstName,
            lastName: hydratedAthlete.lastName
          }
        : null
    };

    const updatedCrew = {
      ...crew,
      announcements: [newAnnouncement, ...announcements]
    };

    setAnnouncementContent('');
    persistCrew(updatedCrew);
    showToast('Announcement added');
  };

  const handleRunSubmit = async (event) => {
    event.preventDefault();
    if (!crew) {
      showToast('Sync your crew before creating runs');
      return;
    }

    const title = runForm.title.trim();
    const date = runForm.date;
    const time = runForm.time;
    const meetUpPoint = runForm.meetUpPoint.trim();

    if (!title && !date) {
      showToast('Add at least a title or date for the run');
      return;
    }

    const isoDate = date ? `${date}T${time || '00:00'}` : null;

    // EDIT MODE: Update existing run via backend
    if (editingRunId) {
      try {
        const user = auth.currentUser;
        if (!user) {
          showToast('Please sign in to edit runs');
          return;
        }

        const token = await user.getIdToken();
        const { data } = await axios.patch(
          `${API_BASE}/runcrew/runs/${editingRunId}`,
          {
            title: title || 'Untitled Run',
            date: isoDate,
            startTime: time || null,
            meetUpPoint: meetUpPoint || null
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (data?.success && data.data) {
          // Update the run in the local crew object
          const updatedRuns = runs.map((r) =>
            r.id === editingRunId ? data.data : r
          );
          const updatedCrew = { ...crew, runs: updatedRuns };
          persistCrew(updatedCrew);
          showToast('Run updated successfully');
          setEditingRunId(null);
          setRunForm(initialRunForm);
        } else {
          throw new Error(data?.error || 'Failed to update run');
        }
      } catch (error) {
        console.error('Error updating run:', error);
        showToast(error.message || 'Failed to update run');
      }
      return;
    }

    // CREATE MODE: Add new run locally
    const newRun = {
      id: `local-run-${Date.now()}`,
      title: title || 'Untitled Run',
      date: isoDate,
      startTime: time || null,
      meetUpPoint: meetUpPoint || null,
      createdAt: new Date().toISOString(),
      createdBy: hydratedAthlete
        ? {
            id: athleteId,
            firstName: hydratedAthlete.firstName,
            lastName: hydratedAthlete.lastName
          }
        : null,
      rsvps: []
    };

    const updatedCrew = {
      ...crew,
      runs: [newRun, ...runs]
    };

    setRunForm(initialRunForm);
    persistCrew(updatedCrew);
    showToast('Run created');
  };

  const formatRunDate = (run) => {
    const candidate = run.date || run.scheduledAt || null;
    if (!candidate) return 'Date TBD';
    try {
      return new Date(candidate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return candidate;
    }
  };

  const handleRunFormChange = (field) => (event) => {
    const value = event.target.value;
    setRunForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnnouncementChange = (event) => {
    setAnnouncementContent(event.target.value);
  };

  const handleEditRun = (run) => {
    // Parse the date and time from the run object
    let dateValue = '';
    let timeValue = '';
    
    if (run.date) {
      try {
        const runDate = new Date(run.date);
        // Format date as YYYY-MM-DD for input[type="date"]
        dateValue = runDate.toISOString().split('T')[0];
        // Format time as HH:MM for input[type="time"]
        timeValue = run.startTime || runDate.toTimeString().slice(0, 5);
      } catch (error) {
        console.error('Error parsing run date:', error);
      }
    }

    setEditingRunId(run.id);
    setRunForm({
      title: run.title || '',
      date: dateValue,
      time: timeValue,
      meetUpPoint: run.meetUpPoint || ''
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRunId(null);
    setRunForm(initialRunForm);
  };

  const goToMemberView = () => {
    if (runCrewId) {
      navigate(`/runcrew/${runCrewId}`);
    } else {
      navigate('/athlete-home');
    }
  };

  const goToSettings = () => {
    navigate('/runcrew-settings');
  };

  const renderSyncGate = () => (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sync your RunCrew</h1>
        <p className="text-gray-600 text-sm">
          We couldn’t find cached crew data. Tap the button below to load the latest snapshot from the backend.
        </p>
        {syncError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {syncError}
          </div>
        )}
        <button
          onClick={handleResync}
          disabled={syncing}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
        >
          {syncing ? 'Syncing…' : 'Sync Crew Data'}
        </button>
        <button
          onClick={() => navigate('/athlete-home')}
          className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
        >
          Back to Athlete Home
        </button>
      </div>
    </main>
  );

  if (!crew) {
    return renderSyncGate();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg z-30">
          {toast}
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{crew.name || 'RunCrew Admin'}</h1>
              <p className="text-sm text-gray-500">{currentDate}</p>
              <p className="mt-2 text-base text-gray-700">
                Welcome back{hydratedAthlete?.firstName ? `, ${hydratedAthlete.firstName}` : ''}! You’re managing everything for this crew.
              </p>
              <div className="mt-2 bg-sky-100 border border-sky-200 rounded px-3 py-2 text-xs text-sky-900 space-y-1">
                <p>athleteId: {athleteId || '—'}</p>
                <p>runCrewId: {runCrewId || crew.id || '—'}</p>
                <p>managerId: {runCrewManagerId || '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToMemberView}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
            >
              View Member Experience
            </button>
            <button
              onClick={goToSettings}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
            >
              Settings
            </button>
            <button
              onClick={handleResync}
              disabled={syncing}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : 'Re-sync Crew Data'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {syncError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {syncError}
          </div>
        )}

        {/* Announcement Composer */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
              <p className="text-sm text-gray-500">Share updates with your crew. Posts stay local until we wire the backend.</p>
            </div>
          </div>

          <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
            <textarea
              value={announcementContent}
              onChange={handleAnnouncementChange}
              placeholder="What’s happening next?"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-[100px]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                Post Announcement
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500">No announcements yet. Be the first to post one.</p>
            )}
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>
                    {announcement.author?.firstName
                      ? `${announcement.author.firstName}${announcement.author.lastName ? ` ${announcement.author.lastName}` : ''}`
                      : 'Admin'}
                  </span>
                  <span>
                    {announcement.createdAt
                      ? new Date(announcement.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{announcement.content || announcement.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Run Creator */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingRunId ? 'Edit Run' : 'Create a Run'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingRunId ? 'Update the details below and save changes.' : 'Schedule meetups and keep your crew moving.'}
              </p>
            </div>
            {editingRunId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleRunSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title</label>
              <input
                type="text"
                value={runForm.title}
                onChange={handleRunFormChange('title')}
                placeholder="Saturday Sunrise Run"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={runForm.date}
                onChange={handleRunFormChange('date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Time</label>
              <input
                type="time"
                value={runForm.time}
                onChange={handleRunFormChange('time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meet-Up Point</label>
              <input
                type="text"
                value={runForm.meetUpPoint}
                onChange={handleRunFormChange('meetUpPoint')}
                placeholder="Central Park – Bethesda Terrace"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                {editingRunId ? 'Save Changes' : 'Add Run'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Runs</h3>
            {runs.length === 0 && (
              <p className="text-sm text-gray-500">No runs yet — create one above.</p>
            )}
            <div className="space-y-3">
              {runs.map((run) => {
                // Fix RSVP count: check both run.rsvps array and run._count.rsvps
                const rsvpCount = run.rsvps?.length || run._count?.rsvps || 0;
                const goingCount = run.rsvps?.filter(r => r.status === 'going').length || rsvpCount;
                
                return (
                  <div key={run.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{run.title || 'Untitled Run'}</p>
                        <p className="text-xs text-gray-500">{formatRunDate(run)}</p>
                        {run.meetUpPoint && (
                          <p className="text-xs text-gray-500 mt-1">Meet at {run.meetUpPoint}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {goingCount} going
                        </span>
                        <button
                          onClick={() => navigate(`/runcrew-run-detail/${run.id}`)}
                          className="text-xs text-orange-600 hover:text-orange-800 font-semibold border border-orange-300 rounded px-3 py-1 hover:bg-orange-50 transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleEditRun(run)}
                          className="text-xs text-sky-600 hover:text-sky-800 font-semibold border border-sky-300 rounded px-3 py-1 hover:bg-sky-50 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Messages */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-500">Recent chatter from the crew.</p>
            </div>
          </div>
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">No messages yet. Conversations appear here.</p>
          )}
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id || message.createdAt} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {message.athlete?.firstName
                      ? `${message.athlete.firstName}${message.athlete.lastName ? ` ${message.athlete.lastName}` : ''}`
                      : 'Member'}
                  </span>
                  <span>
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{message.content || message.body || message.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Members */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Members</h2>
              <p className="text-sm text-gray-500">Your crew roster. Admins are highlighted.</p>
            </div>
          </div>
          {memberships.length === 0 && (
            <p className="text-sm text-gray-500">No members yet. Share your join code to build the crew.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map((membership) => {
              const athlete = membership.athlete || membership;
              const managerRecord = Array.isArray(crew.managers)
                ? crew.managers.find((manager) => manager.athleteId === athlete?.id && manager.role === 'admin')
                : null;

              return (
                <div key={athlete?.id || membership.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">
                    {athlete?.firstName || 'Athlete'} {athlete?.lastName || ''}
                    {managerRecord && <span className="text-orange-600 text-xs font-bold ml-2">(Admin)</span>}
                  </p>
                  {athlete?.email && (
                    <p className="text-xs text-gray-500 mt-1">{athlete.email}</p>
                  )}
                  {membership.role && (
                    <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">{membership.role}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

