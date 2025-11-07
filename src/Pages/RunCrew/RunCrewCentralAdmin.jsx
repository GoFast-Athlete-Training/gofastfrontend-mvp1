import React, { useState, useEffect } from 'react';
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
  
  // Hydrated crew data from localStorage
  const [crew, setCrew] = useState(null);
  const [crewMembers, setCrewMembers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

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
      // Try to get from myCrews
      const myCrewsStr = localStorage.getItem('myCrews');
      if (myCrewsStr) {
        const myCrews = JSON.parse(myCrewsStr);
        const foundCrew = myCrews.find(c => c.id === id);
        if (foundCrew) {
          setCrew({
            id: foundCrew.id,
            name: foundCrew.name || 'RunCrew',
            joinCode: foundCrew.joinCode
          });
        }
      }

      // Try to get hydrated crew data (from /api/runcrew/:id)
      const hydratedCrewStr = localStorage.getItem(`runCrew_${id}`);
      if (hydratedCrewStr) {
        const hydratedCrew = JSON.parse(hydratedCrewStr);
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
        if (hydratedCrew.events && Array.isArray(hydratedCrew.events)) {
          setUpcomingEvents(hydratedCrew.events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= new Date();
          }).sort((a, b) => new Date(a.date) - new Date(b.date)));
        }
      }

      // Fallback: use crew name from myCrews if available
      if (!crew) {
        const myCrewsStr = localStorage.getItem('myCrews');
        if (myCrewsStr) {
          const myCrews = JSON.parse(myCrewsStr);
          const foundCrew = myCrews.find(c => c.id === id);
          if (foundCrew) {
            setCrew({
              id: foundCrew.id,
              name: foundCrew.name || 'RunCrew',
              joinCode: foundCrew.joinCode
            });
          }
        }
      }
    } catch (error) {
      console.error('Error hydrating crew data:', error);
    }
  };

  // Get current date for welcome message
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
          {/* Left - Admin Actions & Event Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Event Section */}
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

          {/* Right Sidebar - Members */}
          <div className="space-y-6">
            {/* Members Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Members</h3>
              {crewMembers.length > 0 ? (
                <div className="space-y-3">
                  {crewMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {member.initials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No members yet</p>
                </div>
              )}

              {/* Invite Prompt - Always at bottom */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-orange-900 mb-2">Invite More Members</p>
                  <p className="text-xs text-orange-700 mb-3">
                    Share your join code: <strong className="font-mono">{crew?.joinCode || 'N/A'}</strong>
                  </p>
                  <button
                    onClick={() => navigate('/join-crew')}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium"
                  >
                    Invite Members
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
