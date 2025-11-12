import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../../firebase';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import GooglePlacesAutocomplete from '../../Components/RunCrew/GooglePlacesAutocomplete';
import StravaRoutePreview from '../../Components/RunCrew/StravaRoutePreview';
import { copyInviteLink } from '../../utils/InviteLinkGenerator';
import { generateUniversalInviteLink } from '../../utils/AuthDetectionService';
import { Settings } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

// Prefill run form for testing
const getInitialRunForm = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return {
    title: 'Saturday Sunrise Run',
    date: formattedDate,
    time: '6:30 AM',
    meetUpPoint: 'Central Park – Bethesda Terrace',
    meetUpAddress: 'Central Park, New York, NY',
    totalMiles: '5.0',
    pace: '8:00-8:30',
    description: 'Early morning run to start the weekend right. All paces welcome!',
    stravaMapUrl: ''
  };
};

const initialRunForm = getInitialRunForm();

const paceOptions = [
  '6:00-6:30',
  '6:30-7:00',
  '7:00-7:30',
  '7:30-8:00',
  '8:00-8:30',
  '8:30-9:00',
  '9:00-9:30',
  '9:30-10:00',
  '10:00-10:30',
  '10:30-11:00',
  '11:00+'
];

const timeOptions = [
  '5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM'
];

const metricFormatters = {
  miles: (entry) => `${(entry.totalDistanceMiles ?? 0).toFixed(1)} mi`,
  runs: (entry) => `${entry.activityCount ?? 0} runs`,
  calories: (entry) => `${Math.round(entry.totalCalories ?? 0)} cal`
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
  const [messageContent, setMessageContent] = useState('');
  const [runForm, setRunForm] = useState(initialRunForm);
  const [editingRunId, setEditingRunId] = useState(null);
  const [expandedRunId, setExpandedRunId] = useState(null);
  const [placeData, setPlaceData] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState('miles');

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
  const joinCode = crew?.joinCode || crew?.inviteCode || null;
  const leaderboard = crew?.leaderboardDynamic || [];

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

    const optimistic = {
      ...crew,
      announcements: [newAnnouncement, ...announcements]
    };

    setAnnouncementContent('');
    persistCrew(optimistic);
    showToast('Announcement added (syncing...)');

    // Fire-and-forget until backend is wired
  };

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    if (!crew) {
      showToast('Sync your crew before posting');
      return;
    }

    const trimmed = messageContent.trim();
    if (!trimmed) return;

    const optimisticMessage = {
      id: `local-msg-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      athlete: hydratedAthlete
        ? {
            id: athleteId,
            firstName: hydratedAthlete.firstName,
            lastName: hydratedAthlete.lastName,
            photoURL: hydratedAthlete.photoURL
          }
        : null
    };

    persistCrew({ ...crew, messages: [...messages, optimisticMessage] });
    setMessageContent('');

    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      if (!token) return;

      await axios.post(
        `${API_BASE}/runcrew/messages`,
        {
          runCrewId: crew.id || runCrewId,
          message: trimmed
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showToast('Message sent');
      handleResync();
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Message saved locally (sync later)');
    }
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
          setShowRunModal(false);
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

    const optimisticRuns = [newRun, ...runs];
    persistCrew({ ...crew, runs: optimisticRuns });
    setRunForm(initialRunForm);
    setPlaceData(null);
    setShowRunModal(false);
    showToast('Run created (sync later)');
  };

  const openCreateRun = () => {
    setEditingRunId(null);
    setRunForm(getInitialRunForm()); // Use function to get fresh prefilled data
    setPlaceData(null);
    setShowRunModal(true);
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
    setShowRunModal(true);
  };

  const handleCancelEdit = () => {
    setEditingRunId(null);
    setRunForm(initialRunForm);
    setPlaceData(null);
    setShowRunModal(false);
  };

  const getLeaderboardDisplay = (entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    return entries
      .map((entry) => ({
        ...entry,
        display: metricFormatters[activeMetric](entry)
      }))
      .slice(0, 5);
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
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
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
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-sky-900">
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">athleteId: {athleteId || '—'}</span>
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">runCrewId: {runCrewId || crew.id || '—'}</span>
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">managerId: {runCrewManagerId || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/athlete-home')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-300"
            >
              Home
            </button>
            <button
              onClick={goToMemberView}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 transition"
            >
              View Member Experience
            </button>
            <button
              onClick={goToSettings}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 border border-orange-600 rounded-lg px-4 py-2 transition shadow-sm"
            >
              <Settings className="w-4 h-4" />
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

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
        {syncError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {syncError}
          </div>
        )}

        {/* 3-Column Layout: Members (Left) | Main Content (Center) | Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: Members (Prominent) */}
          <aside className="lg:col-span-3 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Members</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{memberships.length}</span>
              </div>
              
              {memberships.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                  No members yet. Share your join code to build the crew.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {memberships.map((membership) => {
                    const athlete = membership.athlete || membership;
                    const managerRecord = Array.isArray(crew.managers)
                      ? crew.managers.find((manager) => manager.athleteId === athlete?.id && manager.role === 'admin')
                      : null;

                    return (
                      <div key={athlete?.id || membership.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        {athlete?.photoURL ? (
                          <img
                            src={athlete.photoURL}
                            alt={`${athlete.firstName} ${athlete.lastName}`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                            {(athlete?.firstName?.[0] || 'A').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {athlete?.firstName || 'Athlete'} {athlete?.lastName || ''}
                            {managerRecord && <span className="text-orange-600 text-xs font-bold ml-1">Admin</span>}
                          </p>
                          {athlete?.email && (
                            <p className="text-xs text-gray-500 truncate">{athlete.email}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Invite Section */}
              {joinCode && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Invite Teammates</p>
                  
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 space-y-3">
                    <code className="block text-xs text-gray-700 break-all bg-white px-3 py-2 rounded border border-gray-200">
                      {generateUniversalInviteLink(joinCode)}
                    </code>
                    <button
                      onClick={async () => {
                        const success = await copyInviteLink(generateUniversalInviteLink(joinCode));
                        showToast(success ? 'Invite link copied!' : 'Failed to copy');
                      }}
                      className="w-full text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Copy Invite Link
                    </button>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Or share code:</p>
                      <code className="text-base font-bold text-emerald-600">{joinCode}</code>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </aside>

          {/* MAIN CONTENT: Announcements, Runs, Messages */}
          <div className="lg:col-span-6 space-y-6">
            {/* Announcements */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
                  <p className="text-sm text-gray-500">Share updates with your crew</p>
                </div>
              </div>

              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <textarea
                  value={announcementContent}
                  onChange={handleAnnouncementChange}
                  placeholder="What's happening next?"
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

            {/* Runs Module */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Runs</h3>
            {runs.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                No runs yet — click "Create Run" to add one.
              </div>
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

        {/* Messages */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-500">Crew chatter and updates.</p>
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

          <form onSubmit={handleMessageSubmit} className="pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
                placeholder="Drop a note for the crew…"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!messageContent.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Send
              </button>
            </div>
          </form>
        </section>
          </div>

          {/* RIGHT SIDEBAR: Actions & Stats */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Create Run Button */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <button
                onClick={openCreateRun}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl text-base font-bold transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Run
              </button>
            </section>

            {/* Crew Stats */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Crew Stats</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Upcoming Runs</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{runs.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Keep the calendar full</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-orange-50 to-orange-100">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Messages</p>
                  <p className="text-3xl font-bold text-orange-700 mt-1">{messages.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Crew engagement</p>
                </div>
              </div>
            </section>

            {/* Leaderboard */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
                <div className="flex gap-1">
                  {['miles','runs','calories'].map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setActiveMetric(metric)}
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${activeMetric === metric ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {metric === 'miles' ? 'Miles' : metric === 'runs' ? 'Runs' : 'Cals'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {getLeaderboardDisplay(leaderboard).length === 0 && (
                  <p className="text-xs text-gray-500">Stats will appear once your crew syncs activities.</p>
                )}
                {getLeaderboardDisplay(leaderboard).map((entry, index) => (
                  <div key={entry.athleteId || index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm font-semibold text-gray-900">{entry.firstName || 'Athlete'}</p>
                    <p className="text-sm font-bold text-orange-600">{entry.display}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingRunId ? 'Edit Run' : 'Create Run'}</h2>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRunSubmit} className="p-6 space-y-6">
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
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
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
                    {paceOptions.map((pace) => (
                      <option key={pace} value={pace}>{pace}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Strava Route URL (Optional)</label>
                <input
                  type="url"
                  value={runForm.stravaMapUrl}
                  onChange={handleRunFormChange('stravaMapUrl')}
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                {runForm.stravaMapUrl && runForm.stravaMapUrl.includes('strava.com') && (
                  <div className="mt-3">
                    <StravaRoutePreview
                      polylineString="ypweFnzbjVhAWnAc@bAa@dAe@fAi@hAm@jAq@lAs@nAw@pAy@rA{@tA}@vA_AvAaAxAcAzAeA|AgA~AiA`BiAaBkAdBmAfBoBhBoBlBqBnBsBpBuBrBwBtByB"
                      stravaUrl={runForm.stravaMapUrl}
                    />
                  </div>
                )}
              </div>

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
                  {editingRunId ? 'Save Changes' : 'Create Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

