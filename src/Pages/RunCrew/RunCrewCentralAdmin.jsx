import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import GooglePlacesAutocomplete from '../../Components/RunCrew/GooglePlacesAutocomplete';
import StravaRoutePreview from '../../Components/RunCrew/StravaRoutePreview';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

const initialRunForm = {
  title: '',
  date: '',
  time: '',
  meetUpPoint: '',
  meetUpAddress: '',
  totalMiles: '',
  pace: '',
  description: '',
  stravaMapUrl: ''
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
  const [expandedRunId, setExpandedRunId] = useState(null); // Track which run details are expanded
  const [placeData, setPlaceData] = useState(null); // Google Places data (lat/lng/placeId)
  const [showEditModal, setShowEditModal] = useState(false); // Control edit modal visibility

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
    const meetUpAddress = runForm.meetUpAddress.trim();
    const totalMiles = runForm.totalMiles;
    const pace = runForm.pace.trim();
    const stravaMapUrl = runForm.stravaMapUrl.trim();
    const description = runForm.description.trim();

    if (!title || !date || !time || !meetUpPoint) {
      showToast('Please fill in all required fields (Title, Date, Time, Meet-Up Point)');
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
            title,
            date: isoDate,
            startTime: time,
            meetUpPoint,
            meetUpAddress: meetUpAddress || null,
            totalMiles: totalMiles ? parseFloat(totalMiles) : null,
            pace: pace || null,
            stravaMapUrl: stravaMapUrl || null,
            description: description || null
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
          setPlaceData(null);
          setShowEditModal(false);
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
      title,
      date: isoDate,
      startTime: time,
      meetUpPoint,
      meetUpAddress: meetUpAddress || null,
      totalMiles: totalMiles ? parseFloat(totalMiles) : null,
      pace: pace || null,
      stravaMapUrl: stravaMapUrl || null,
      description: description || null,
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
    setPlaceData(null);
    persistCrew(updatedCrew);
    showToast('Run created successfully!');
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

  const handlePlaceSelected = (place) => {
    setPlaceData({
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng
    });
    setRunForm((prev) => ({
      ...prev,
      meetUpAddress: place.address
    }));
  };

  const handleAnnouncementChange = (event) => {
    setAnnouncementContent(event.target.value);
  };

  const handleEditRun = (run) => {
    // Parse the date from the run object
    let dateValue = '';
    
    if (run.date) {
      try {
        const runDate = new Date(run.date);
        // Format date as YYYY-MM-DD for input[type="date"]
        dateValue = runDate.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error parsing run date:', error);
      }
    }

    setEditingRunId(run.id);
    setRunForm({
      title: run.title || '',
      date: dateValue,
      time: run.time || run.startTime || '', // Use existing time format (e.g., "6:30 AM")
      meetUpPoint: run.meetUpPoint || '',
      meetUpAddress: run.meetUpAddress || '',
      totalMiles: run.totalMiles || '',
      pace: run.pace || '',
      description: run.description || '',
      stravaMapUrl: run.stravaMapUrl || ''
    });
    
    // Open modal instead of scrolling
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setEditingRunId(null);
    setRunForm(initialRunForm);
    setPlaceData(null);
    setShowEditModal(false);
  };

  const toggleRunDetails = (runId) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const goToMemberView = () => {
    // Local-first: No params needed, member view reads from LocalStorageAPI
    navigate('/runcrew/central');
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <section className="bg-orange-50 rounded-2xl border border-orange-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 text-xl">📢</span>
                <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
                {isAdmin && <span className="text-xs text-orange-600 font-semibold">Admin</span>}
              </div>

              {isAdmin && (
                <form onSubmit={handleAnnouncementSubmit} className="space-y-3">
                  <textarea
                    value={announcementContent}
                    onChange={handleAnnouncementChange}
                    placeholder="What's happening next?"
                    className="w-full border border-orange-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      + New Announcement
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {announcements.length === 0 && (
                  <p className="text-sm text-gray-600">No announcements yet.</p>
                )}
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="bg-white border border-orange-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        📣 {announcement.title || 'Group Run Tomorrow!'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{announcement.content || announcement.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Posted {announcement.createdAt
                        ? new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'just now'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Crew Feed/Chat */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Crew Feed</h2>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full"># General</button>
                  <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"># Runs & Training</button>
                  <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"># Motivation</button>
                  <button className="px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-full">+ New Topic</button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="px-6 py-4 space-y-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                )}
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {message.athlete?.firstName?.[0] || 'A'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {message.athlete?.firstName || 'Athlete'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{message.content || message.text}</p>
                      {message.reactions && (
                        <div className="flex gap-2 mt-2">
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
                            👍 {message.reactions.thumbsUp || 0}
                          </button>
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
                            🔥 {message.reactions.fire || 0}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Text Message"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    Send
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Next Run Card */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Next Run</h2>
              {runs.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">{runs[0].date ? new Date(runs[0].date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Tomorrow'}</span>
                  </div>
                  <p className="text-sm text-gray-600">{runs[0].time || '6:00 AM'}</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{runs[0].meetUpPoint || 'Trailhead Park'}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">{(runs[0].rsvps?.filter(r => r.status === 'going').length || 0)} Going</p>
                    <div className="flex -space-x-2">
                      {runs[0].rsvps?.slice(0, 5).map((rsvp, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                          {rsvp.athlete?.firstName?.[0] || 'A'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold mt-4 transition">
                    I'm Going
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming runs</p>
              )}
            </section>

            {/* Who's Here */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Who's Here</h2>
              <div className="space-y-3">
                {memberships.slice(0, 6).map((membership) => {
                  const athlete = membership.athlete || membership;
                  return (
                    <div key={membership.id || athlete.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm relative">
                        {athlete.firstName?.[0] || 'A'}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{athlete.firstName || 'Athlete'} {athlete.lastName || ''}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {memberships.length > 6 && (
                <button className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                  View all {memberships.length} members
                </button>
              )}
            </section>

            {/* Leaderboard */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex gap-2 mb-4">
                <button className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">Miles</button>
                <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full">Pace</button>
                <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full">Cals</button>
              </div>
              <div className="space-y-3">
                {memberships.slice(0, 3).map((membership, index) => {
                  const athlete = membership.athlete || membership;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-sm font-semibold text-gray-900">{athlete.firstName || 'Athlete'}</p>
                      <p className="text-sm font-bold text-orange-600">52.1mi</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Admin: Run Creator (below main feed) */}
        {isAdmin && (
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

          <form onSubmit={handleRunSubmit} className="space-y-6">
            {/* Row 1: Title & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</label>
                <input
                  type="text"
                  value={runForm.title}
                  onChange={handleRunFormChange('title')}
                  placeholder="Saturday Sunrise Run"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date *</label>
                <input
                  type="date"
                  value={runForm.date}
                  onChange={handleRunFormChange('date')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Row 2: Time & Meet-Up Point */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Time *</label>
                <select
                  value={runForm.time}
                  onChange={handleRunFormChange('time')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                >
                  <option value="">Select time...</option>
                  <option value="5:00 AM">5:00 AM</option>
                  <option value="5:30 AM">5:30 AM</option>
                  <option value="6:00 AM">6:00 AM</option>
                  <option value="6:30 AM">6:30 AM</option>
                  <option value="7:00 AM">7:00 AM</option>
                  <option value="7:30 AM">7:30 AM</option>
                  <option value="8:00 AM">8:00 AM</option>
                  <option value="8:30 AM">8:30 AM</option>
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="9:30 AM">9:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="1:30 PM">1:30 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="2:30 PM">2:30 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="3:30 PM">3:30 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="4:30 PM">4:30 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="5:30 PM">5:30 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="6:30 PM">6:30 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="7:30 PM">7:30 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meet-Up Point *</label>
                <input
                  type="text"
                  value={runForm.meetUpPoint}
                  onChange={handleRunFormChange('meetUpPoint')}
                  placeholder="Central Park – Bethesda Terrace"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Row 3: Address (full width) with Google Places Autocomplete */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meetup Address</label>
              <GooglePlacesAutocomplete
                value={runForm.meetUpAddress}
                onChange={handleRunFormChange('meetUpAddress')}
                onPlaceSelected={handlePlaceSelected}
                placeholder="Start typing address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Row 4: Distance & Pace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Miles</label>
                <input
                  type="number"
                  step="0.1"
                  value={runForm.totalMiles}
                  onChange={handleRunFormChange('totalMiles')}
                  placeholder="5.0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pace (min/mile)</label>
                <select
                  value={runForm.pace}
                  onChange={handleRunFormChange('pace')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Select pace...</option>
                  <option value="6:00-6:30">6:00-6:30 (Fast)</option>
                  <option value="6:30-7:00">6:30-7:00</option>
                  <option value="7:00-7:30">7:00-7:30</option>
                  <option value="7:30-8:00">7:30-8:00</option>
                  <option value="8:00-8:30">8:00-8:30 (Moderate)</option>
                  <option value="8:30-9:00">8:30-9:00</option>
                  <option value="9:00-9:30">9:00-9:30</option>
                  <option value="9:30-10:00">9:30-10:00</option>
                  <option value="10:00-10:30">10:00-10:30 (Easy)</option>
                  <option value="10:30-11:00">10:30-11:00</option>
                  <option value="11:00+">11:00+ (Recovery)</option>
                </select>
              </div>
            </div>

            {/* Row 5: Strava Map URL with inline preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Strava Route URL (Optional)</label>
              <input
                type="url"
                value={runForm.stravaMapUrl}
                onChange={handleRunFormChange('stravaMapUrl')}
                placeholder="https://www.strava.com/routes/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              
              {/* Inline Strava Preview */}
              {runForm.stravaMapUrl && runForm.stravaMapUrl.includes('strava.com') && (
                <div className="mt-3">
                  <StravaRoutePreview 
                    polylineString="ypweFnzbjVhAWnAc@bAa@dAe@fAi@hAm@jAq@lAs@nAw@pAy@rA{@tA}@vA_AvAaAxAcAzAeA|AgA~AiA`BiAaBkAdBmAfBoBhBoBlBqBnBsBpBuBrBwBtByB"
                    stravaUrl={runForm.stravaMapUrl}
                  />
                </div>
              )}
            </div>

            {/* Row 6: Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
              <textarea
                value={runForm.description}
                onChange={handleRunFormChange('description')}
                placeholder="Tell your crew what to expect... route details, coffee after, etc."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              {editingRunId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                {editingRunId ? 'Save Changes' : 'Create Run'}
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
                const isExpanded = expandedRunId === run.id;
                
                return (
                  <div key={run.id} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                    {/* Run Card Header */}
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{run.title || 'Untitled Run'}</p>
                          <p className="text-xs text-gray-500">{formatRunDate(run)}</p>
                          {run.meetUpPoint && (
                            <p className="text-xs text-gray-500 mt-1">📍 {run.meetUpPoint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {goingCount} going
                          </span>
                          <button
                            onClick={() => toggleRunDetails(run.id)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-semibold border border-orange-300 rounded px-3 py-1 hover:bg-orange-50 transition"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
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

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                        {/* Run Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {run.totalMiles && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                              <p className="font-semibold text-gray-900">{run.totalMiles} miles</p>
                            </div>
                          )}
                          {run.pace && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Pace</p>
                              <p className="font-semibold text-gray-900">{run.pace}</p>
                            </div>
                          )}
                          {run.meetUpAddress && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                              <p className="text-sm text-gray-900">{run.meetUpAddress}</p>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {run.description && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{run.description}</p>
                          </div>
                        )}

                        {/* Strava Map */}
                        {run.stravaMapUrl && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Route Map</p>
                            <a
                              href={run.stravaMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                            >
                              View on Strava
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}

                        {/* Map Placeholder (if coordinates exist) */}
                        {(run.meetUpLat && run.meetUpLng) && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Location</p>
                            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-200">
                              <div className="text-center text-gray-500">
                                <p className="text-sm font-medium">Map View</p>
                                <p className="text-xs mt-1">Lat: {run.meetUpLat}, Lng: {run.meetUpLng}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* RSVPs */}
                        {run.rsvps && run.rsvps.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Who's Going</p>
                            <div className="flex flex-wrap gap-2">
                              {run.rsvps.filter(r => r.status === 'going').map((rsvp) => (
                                <div key={rsvp.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                                  {rsvp.athlete?.photoURL && (
                                    <img
                                      src={rsvp.athlete.photoURL}
                                      alt={rsvp.athlete.firstName}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                  )}
                                  <span className="text-xs font-medium text-green-900">
                                    {rsvp.athlete?.firstName} {rsvp.athlete?.lastName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}
      </main>

      {/* Edit Run Modal */}
      {showEditModal && editingRunId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Run</h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRunSubmit} className="p-6 space-y-6">
              {/* Row 1: Title & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</label>
                  <input
                    type="text"
                    value={runForm.title}
                    onChange={handleRunFormChange('title')}
                    placeholder="Saturday Sunrise Run"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date *</label>
                  <input
                    type="date"
                    value={runForm.date}
                    onChange={handleRunFormChange('date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Time & Meet-Up Point */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Time *</label>
                  <select
                    value={runForm.time}
                    onChange={handleRunFormChange('time')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  >
                    <option value="">Select time...</option>
                    <option value="5:00 AM">5:00 AM</option>
                    <option value="5:30 AM">5:30 AM</option>
                    <option value="6:00 AM">6:00 AM</option>
                    <option value="6:30 AM">6:30 AM</option>
                    <option value="7:00 AM">7:00 AM</option>
                    <option value="7:30 AM">7:30 AM</option>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="8:30 AM">8:30 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="9:30 AM">9:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="1:30 PM">1:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="2:30 PM">2:30 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="3:30 PM">3:30 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="4:30 PM">4:30 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="5:30 PM">5:30 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="6:30 PM">6:30 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                    <option value="7:30 PM">7:30 PM</option>
                    <option value="8:00 PM">8:00 PM</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meet-Up Point *</label>
                  <input
                    type="text"
                    value={runForm.meetUpPoint}
                    onChange={handleRunFormChange('meetUpPoint')}
                    placeholder="Central Park – Bethesda Terrace"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Address */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meetup Address</label>
                <GooglePlacesAutocomplete
                  value={runForm.meetUpAddress}
                  onChange={handleRunFormChange('meetUpAddress')}
                  onPlaceSelected={handlePlaceSelected}
                  placeholder="Start typing address..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Row 4: Distance & Pace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Miles</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runForm.totalMiles}
                    onChange={handleRunFormChange('totalMiles')}
                    placeholder="5.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pace (min/mile)</label>
                  <select
                    value={runForm.pace}
                    onChange={handleRunFormChange('pace')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="">Select pace...</option>
                    <option value="6:00-6:30">6:00-6:30 (Fast)</option>
                    <option value="6:30-7:00">6:30-7:00</option>
                    <option value="7:00-7:30">7:00-7:30</option>
                    <option value="7:30-8:00">7:30-8:00</option>
                    <option value="8:00-8:30">8:00-8:30 (Moderate)</option>
                    <option value="8:30-9:00">8:30-9:00</option>
                    <option value="9:00-9:30">9:00-9:30</option>
                    <option value="9:30-10:00">9:30-10:00</option>
                    <option value="10:00-10:30">10:00-10:30 (Easy)</option>
                    <option value="10:30-11:00">10:30-11:00</option>
                    <option value="11:00+">11:00+ (Recovery)</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Strava URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Strava Route URL (Optional)</label>
                <input
                  type="url"
                  value={runForm.stravaMapUrl}
                  onChange={handleRunFormChange('stravaMapUrl')}
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Row 6: Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                <textarea
                  value={runForm.description}
                  onChange={handleRunFormChange('description')}
                  placeholder="Tell your crew what to expect..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

