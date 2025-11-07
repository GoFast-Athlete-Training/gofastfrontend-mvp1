import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

/**
 * RunCrewCentralAdmin - Admin View
 * Per RunCrewArchitecture.md: Admin view for RunCrew management
 * Hydrates from localStorage (local-first architecture)
 */
export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showEventForm, setShowEventForm] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState(null);

  const [showRunForm, setShowRunForm] = useState(false);
  const [creatingRun, setCreatingRun] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);

  // Hydrated crew data from localStorage
  const [crew, setCrew] = useState(null);
  const [crewMembers, setCrewMembers] = useState([]);
  const [runs, setRuns] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const [runForm, setRunForm] = useState({
    title: '',
    runType: 'single',
    date: '',
    startTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    meetUpPoint: '',
    meetUpAddress: '',
    totalMiles: '',
    pace: '',
    stravaMapUrl: '',
    description: '',
    recurrenceRule: '',
    recurrenceEndsOn: '',
    recurrenceNote: '',
    meetUpPlaceId: '',
    meetUpLat: '',
    meetUpLng: ''
  });

  // Event creation form state
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    address: '',
    description: '',
    eventType: ''
  });

  // Hydrate crew data from localStorage on mount
  useEffect(() => {
    hydrateCrewData();
  }, [id]);

  const hydrateCrewData = () => {
    try {
      let hydratedRuns = [];
      let hydratedEvents = [];
      let storedCrewPayload = null;

      // Try to get hydrated crew data (from /api/runcrew/:id)
      const hydratedCrewStr = localStorage.getItem(`runCrew_${id}`);
      if (hydratedCrewStr) {
        const hydratedCrew = JSON.parse(hydratedCrewStr);
        storedCrewPayload = hydratedCrew;
        if (hydratedCrew.name) {
          setCrew({
            id: hydratedCrew.id,
            name: hydratedCrew.name,
            joinCode: hydratedCrew.joinCode
          });
        }
        if (hydratedCrew.members && Array.isArray(hydratedCrew.members)) {
          setCrewMembers(hydratedCrew.members.map(m => ({
            id: m.athlete?.id || m.id,
            firstName: m.athlete?.firstName || m.firstName,
            lastName: m.athlete?.lastName || m.lastName,
            photoURL: m.athlete?.photoURL || m.photoURL,
            initials: `${(m.athlete?.firstName || m.firstName || '')?.[0] || ''}${(m.athlete?.lastName || m.lastName || '')?.[0] || ''}`.toUpperCase()
          })));
        }
        if (hydratedCrew.runs && Array.isArray(hydratedCrew.runs)) {
          hydratedRuns = hydratedCrew.runs;
          setRuns(sortRuns(hydratedRuns));
        }
        if (hydratedCrew.events && Array.isArray(hydratedCrew.events)) {
          hydratedEvents = hydratedCrew.events;
          setUpcomingEvents(hydratedEvents.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)));
        }
      }

      // Fallback to myCrews for basic info
      const myCrewsStr = localStorage.getItem('myCrews');
      if (myCrewsStr) {
        const myCrews = JSON.parse(myCrewsStr);
        const foundCrew = myCrews.find(c => c.id === id);
        if (foundCrew) {
          setCrew(prev => ({
            id: foundCrew.id,
            name: prev?.name || foundCrew.name || 'RunCrew',
            joinCode: foundCrew.joinCode
          }));
          // if runs missing but myCrews has them (future hydration)
          if (!hydratedRuns.length && foundCrew.runs) {
            setRuns(sortRuns(foundCrew.runs));
          }
        }
      }
    } catch (error) {
      console.error('Error hydrating crew data:', error);
    }
  };

  const sortRuns = (runsList = []) => {
    return [...runsList].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingRuns = useMemo(() => (
    runs.filter(run => new Date(run.date) >= new Date())
  ), [runs]);

  // Get current date for welcome message
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleRunFormChange = (field, value) => {
    setRunForm(prev => ({ ...prev, [field]: value }));
    setRunError(null);
    setRunSuccess(null);
  };

  const appendRunToLocalStorage = (newRun) => {
    try {
      const key = `runCrew_${id}`;
      const existingStr = localStorage.getItem(key);
      if (!existingStr) return;
      const existing = JSON.parse(existingStr);
      const updated = {
        ...existing,
        runs: existing.runs ? [newRun, ...existing.runs] : [newRun]
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to append run to localStorage', error);
    }
  };

  const handleCreateRun = async () => {
    if (!runForm.title.trim() || !runForm.date || !runForm.startTime.trim() || !runForm.meetUpPoint.trim()) {
      setRunError('Please fill in Title, Date, Start Time, and Meet-Up Point.');
      return;
    }

    setCreatingRun(true);
    setRunError(null);
    setRunSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setRunError('Please sign in');
        setCreatingRun(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/runcrew/${id}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: runForm.title.trim(),
          runType: runForm.runType,
          date: runForm.date,
          startTime: runForm.startTime.trim(),
          timezone: runForm.timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
          meetUpPoint: runForm.meetUpPoint.trim(),
          meetUpAddress: runForm.meetUpAddress?.trim(),
          meetUpPlaceId: runForm.meetUpPlaceId?.trim(),
          meetUpLat: runForm.meetUpLat !== '' ? runForm.meetUpLat : null,
          meetUpLng: runForm.meetUpLng !== '' ? runForm.meetUpLng : null,
          totalMiles: runForm.totalMiles !== '' ? runForm.totalMiles : null,
          pace: runForm.pace?.trim(),
          stravaMapUrl: runForm.stravaMapUrl?.trim(),
          description: runForm.description?.trim(),
          recurrenceRule: runForm.runType === 'recurring' ? runForm.recurrenceRule?.trim() : null,
          recurrenceEndsOn: runForm.runType === 'recurring' ? runForm.recurrenceEndsOn || null : null,
          recurrenceNote: runForm.runType === 'recurring' ? runForm.recurrenceNote?.trim() : null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to create run');
      }

      const newRun = data.data;
      setRuns(prev => sortRuns([newRun, ...prev]));
      appendRunToLocalStorage(newRun);
      setRunSuccess('Run created successfully');
      setShowRunForm(false);
      setRunForm({
        title: '',
        runType: 'single',
        date: '',
        startTime: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        meetUpPoint: '',
        meetUpAddress: '',
        totalMiles: '',
        pace: '',
        stravaMapUrl: '',
        description: '',
        recurrenceRule: '',
        recurrenceEndsOn: '',
        recurrenceNote: '',
        meetUpPlaceId: '',
        meetUpLat: '',
        meetUpLng: ''
      });
    } catch (error) {
      console.error('Error creating run:', error);
      setRunError(error.message || 'Failed to create run.');
    } finally {
      setCreatingRun(false);
    }
  };

  const handleAssignManager = async (athleteId, action) => {
    if (action === 'remove') {
      // Delete manager role
      try {
        const user = auth.currentUser;
        if (!user) {
          alert('Please sign in');
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE}/runcrew/${id}/managers/${athleteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          alert('Manager role removed successfully');
          // Refresh crew data
          hydrateCrewData();
        } else {
          alert(data.error || 'Failed to remove manager role');
        }
      } catch (error) {
        console.error('Error removing manager:', error);
        alert('Failed to remove manager role');
      }
    } else {
      // Upsert manager role
      try {
        const user = auth.currentUser;
        if (!user) {
          alert('Please sign in');
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE}/runcrew/${id}/managers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            athleteId,
            role: action // 'admin' or 'manager'
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          alert(`Role assigned successfully: ${action}`);
          // Refresh crew data
          hydrateCrewData();
        } else {
          alert(data.error || 'Failed to assign role');
        }
      } catch (error) {
        console.error('Error assigning manager:', error);
        alert('Failed to assign role');
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location) {
      setEventError('Please fill in all required fields');
      return;
    }

    setCreatingEvent(true);
    setEventError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setEventError('Please sign in');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/runcrew/${id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventForm.title,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
          address: eventForm.address || undefined,
          description: eventForm.description || undefined,
          eventType: eventForm.eventType || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event');
      }

      // Add to local state
      const newEvent = {
        id: data.data.id,
        title: data.data.title,
        date: data.data.date,
        time: data.data.time,
        location: data.data.location,
        attendees: data.data.rsvps?.length || 0
      };
      setUpcomingEvents([...upcomingEvents, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Reset form
      setEventForm({
        title: '',
        date: '',
        time: '',
        location: '',
        address: '',
        description: '',
        eventType: ''
      });
      setShowEventForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
      setEventError(error.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const runTypeOptions = [
    { value: 'single', label: 'Single Day' },
    { value: 'recurring', label: 'Recurring' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/athlete-home')} className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(`/runcrew/${id}`)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                See as Member
              </button>
              <button
                onClick={() => navigate(`/runcrew-settings/${id}`)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-orange-800">Admin Mode - You can create events and manage the crew</span>
          </div>
        </div>
      </div>

      {/* Welcome Section with Crew Name and Date */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {crew?.name || 'RunCrew'}
            </h1>
            <p className="text-gray-600">{currentDate}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900">
              <strong>Welcome to the admin dashboard!</strong> Here you can manage your crew, create events, and coordinate activities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Members */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Members</span>
                <button
                  onClick={() => navigate(`/runcrew/${id}`)}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  See as Member
                </button>
              </h3>
              {crewMembers.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {crewMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.firstName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold">
                            {member.initials || 'RC'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members yet</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Invite More Members</h3>
              <p className="text-sm text-gray-600 mb-3">Share your join code: <strong>{crew?.joinCode || 'N/A'}</strong></p>
              <button
                onClick={() => navigator.clipboard.writeText(crew?.joinCode || '')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-semibold"
              >
                Copy Join Code
              </button>
            </div>
          </div>

          {/* Right Column - Actions (Runs + Events) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Run Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Run</h2>
                {!showRunForm && (
                  <button
                    onClick={() => {
                      setShowRunForm(true);
                      setRunError(null);
                      setRunSuccess(null);
                    }}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Run</span>
                  </button>
                )}
              </div>

              {showRunForm && (
                <div className="border border-sky-200 rounded-lg p-4 space-y-4 bg-sky-50">
                  <h3 className="font-semibold text-gray-900">New Run</h3>

                  {runError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                      {runError}
                    </div>
                  )}
                  {runSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
                      {runSuccess}
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Run Title *"
                      value={runForm.title}
                      onChange={(e) => handleRunFormChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    <div className="flex space-x-3">
                      {runTypeOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleRunFormChange('runType', option.value)}
                          type="button"
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${runForm.runType === option.value ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={runForm.date}
                        onChange={(e) => handleRunFormChange('date', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Start Time (e.g., 06:30 AM) *"
                        value={runForm.startTime}
                        onChange={(e) => handleRunFormChange('startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Timezone (e.g., America/Chicago)"
                        value={runForm.timezone}
                        onChange={(e) => handleRunFormChange('timezone', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Meet-Up Point *"
                        value={runForm.meetUpPoint}
                        onChange={(e) => handleRunFormChange('meetUpPoint', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Address Notes (optional)"
                        value={runForm.meetUpAddress}
                        onChange={(e) => handleRunFormChange('meetUpAddress', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Miles"
                        value={runForm.totalMiles}
                        onChange={(e) => handleRunFormChange('totalMiles', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Pace (e.g., 8:00-9:00)"
                        value={runForm.pace}
                        onChange={(e) => handleRunFormChange('pace', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="url"
                        placeholder="Strava Map URL"
                        value={runForm.stravaMapUrl}
                        onChange={(e) => handleRunFormChange('stravaMapUrl', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    {runForm.runType === 'recurring' && (
                      <div className="space-y-3 border border-orange-200 rounded-lg p-3 bg-white/80">
                        <p className="text-sm font-semibold text-orange-600">Recurring Run Details</p>
                        <textarea
                          placeholder="Recurrence Note (e.g., Every Tue/Thu)"
                          value={runForm.recurrenceNote}
                          onChange={(e) => handleRunFormChange('recurrenceNote', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={2}
                        />
                        <input
                          type="text"
                          placeholder="Recurrence Rule (optional, RFC5545)"
                          value={runForm.recurrenceRule}
                          onChange={(e) => handleRunFormChange('recurrenceRule', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          placeholder="Ends On"
                          value={runForm.recurrenceEndsOn}
                          onChange={(e) => handleRunFormChange('recurrenceEndsOn', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}

                    <textarea
                      placeholder="Run Description"
                      value={runForm.description}
                      onChange={(e) => handleRunFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCreateRun}
                        disabled={creatingRun}
                        className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 text-sm font-semibold disabled:opacity-50"
                      >
                        {creatingRun ? 'Saving...' : 'Save Run'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRunForm(false);
                          setRunError(null);
                          setRunSuccess(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showRunForm && upcomingRuns.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                    <span>Upcoming Runs</span>
                    <span className="text-xs text-gray-400">{upcomingRuns.length}</span>
                  </h3>
                  {upcomingRuns.map(run => (
                    <div key={run.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{run.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(run.date).toLocaleDateString()} · {run.startTime} {run.timezone ? `(${run.timezone})` : ''}
                          </p>
                          <p className="text-xs text-gray-500">Meet at {run.meetUpPoint}{run.meetUpAddress ? ` · ${run.meetUpAddress}` : ''}</p>
                        </div>
                        {run.totalMiles && (
                          <div className="text-xs font-semibold text-orange-600">
                            {run.totalMiles} mi
                          </div>
                        )}
                      </div>
                      {run.pace && (
                        <p className="text-xs text-gray-500 mt-1">Target pace: {run.pace}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!showRunForm && upcomingRuns.length === 0 && (
                <p className="text-sm text-gray-500 mt-4">No runs scheduled yet. Create your first run to get started.</p>
              )}
            </div>

            {/* Event Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Event</h2>
                {!showEventForm && (
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Event</span>
                  </button>
                )}
              </div>

              {/* Event Creation Form */}
              {showEventForm && (
                <div className="border border-orange-200 rounded-lg p-4 space-y-4 bg-orange-50">
                  <h3 className="font-semibold text-gray-900">New Event</h3>

                  {eventError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                      {eventError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Event Title *"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Location *"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Address (optional)"
                      value={eventForm.address}
                      onChange={(e) => setEventForm({...eventForm, address: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Event Type (optional)"
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({...eventForm, eventType: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <textarea
                    placeholder="Description (optional)"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateEvent}
                      disabled={creatingEvent || !eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {creatingEvent ? 'Creating...' : 'Create Event'}
                    </button>
                    <button
                      onClick={() => {
                        setShowEventForm(false);
                        setEventError(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Upcoming Events List */}
              {!showEventForm && upcomingEvents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Events:</h3>
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} at {event.time} · {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
