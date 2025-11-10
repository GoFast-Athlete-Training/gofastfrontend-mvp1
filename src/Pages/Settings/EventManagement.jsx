import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Calendar, MapPin, ExternalLink, X, Save } from 'lucide-react';
import api from '../../api/axiosConfig';

const API_BASE = import.meta.env.PROD 
  ? 'https://gofastbackendv2-fall2025.onrender.com/api' 
  : 'http://localhost:4000/api';

// Hardcoded volunteer roles (future: make configurable)
const VOLUNTEER_ROLES = [
  'Course Marshals (5)',
  'Pacers – Fast',
  'Pacers – Medium',
  'Pacers – Finish Crew',
  'Finish Line Holders (2)',
  'Water Station Crew',
  'Setup & Teardown',
];

const EventManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState({}); // { eventId: [volunteers] }
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Form state for creating event
  const [eventForm, setEventForm] = useState({
    eventSlug: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    location: '',
    address: '',
    stravaRouteUrl: '',
    stravaRouteId: '',
    distance: '',
    eventType: 'race',
  });

  // Pre-fill form with Boys on Run 5K data
  const prefillBoysOnRun5K = () => {
    const eventDate = new Date('2025-11-12T07:55:00'); // Wednesday, November 12, 2025 – 7:55 AM
    const formattedDate = eventDate.toISOString().slice(0, 16); // Format for datetime-local input
    
    setEventForm({
      eventSlug: 'boys-on-run-5k-2025',
      title: 'Boys on Run 5K',
      description: 'Final week of our Boys Gotta Run season. We\'re keeping it low-key, warm, and all about the kids.',
      date: formattedDate,
      startTime: '7:55 AM',
      location: 'Discovery Elementary School',
      address: '5275 N 36th St, Arlington, VA 22207',
      stravaRouteUrl: 'https://www.strava.com/routes/3420808564668746102',
      stravaRouteId: '3420808564668746102',
      distance: '5K',
      eventType: 'race',
    });
  };

  // Form state for editing volunteer
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    role: '',
    notes: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/event?isActive=true`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
        // Fetch volunteers for each event
        data.data?.forEach((event) => {
          fetchVolunteers(event.id);
        });
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async (eventId) => {
    try {
      const event = events.find((e) => e.id === eventId);
      const eventSlug = event?.eventSlug;
      
      if (!eventSlug) return;

      const response = await fetch(`${API_BASE}/event-volunteer?eventSlug=${eventSlug}`);
      const data = await response.json();
      
      if (data.success) {
        setVolunteers((prev) => ({
          ...prev,
          [eventId]: data.data || [],
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching volunteers:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventForm,
          date: new Date(eventForm.date).toISOString(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setEventForm({
          eventSlug: '',
          title: '',
          description: '',
          date: '',
          startTime: '',
          location: '',
          address: '',
          stravaRouteUrl: '',
          stravaRouteId: '',
          distance: '',
          eventType: 'race',
        });
        fetchEvents();
        alert('Event created successfully!');
      } else {
        alert('Failed to create event: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleEditVolunteer = (volunteer) => {
    setEditingVolunteer(volunteer);
    setVolunteerForm({
      name: volunteer.name,
      email: volunteer.email,
      role: volunteer.role,
      notes: volunteer.notes || '',
    });
    setSelectedEventId(volunteer.eventId || volunteer.event?.id);
  };

  const handleSaveVolunteer = async () => {
    if (!editingVolunteer || !selectedEventId) return;

    try {
      const event = events.find((e) => e.id === selectedEventId);
      const eventSlug = event?.eventSlug;

      if (!eventSlug) {
        alert('Event not found');
        return;
      }

      // For now, we'll need to create a new volunteer entry since we don't have an update endpoint
      // TODO: Add PUT endpoint for updating volunteers
      const response = await fetch(`${API_BASE}/event-volunteer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventSlug,
          name: volunteerForm.name,
          email: volunteerForm.email,
          role: volunteerForm.role,
          notes: volunteerForm.notes || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingVolunteer(null);
        setVolunteerForm({ name: '', email: '', role: '', notes: '' });
        fetchVolunteers(selectedEventId);
        alert('Volunteer updated successfully!');
      } else {
        alert('Failed to update volunteer: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error updating volunteer:', error);
      alert('Failed to update volunteer: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Event Management</h1>
              <p className="text-gray-600">Create and manage events, view volunteers</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Event
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                        {event.startTime && <span>• {event.startTime}</span>}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.stravaRouteUrl && (
                        <a
                          href={event.stravaRouteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>View Route</span>
                        </a>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-3 text-gray-700">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {volunteers[event.id]?.length || 0} Volunteers
                    </span>
                  </div>
                </div>

                {/* Volunteers Section */}
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Volunteers
                    </h3>
                    <button
                      onClick={() => fetchVolunteers(event.id)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Refresh
                    </button>
                  </div>

                  {volunteers[event.id]?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {volunteers[event.id].map((volunteer) => (
                            <tr key={volunteer.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {volunteer.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {volunteer.email}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {volunteer.role}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {volunteer.notes || '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleEditVolunteer(volunteer)}
                                  className="text-orange-600 hover:text-orange-700 font-medium"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>No volunteers yet for this event</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prefillBoysOnRun5K}
                  className="px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                >
                  Pre-fill: Boys on Run 5K
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.eventSlug}
                  onChange={(e) => setEventForm({ ...eventForm, eventSlug: e.target.value })}
                  placeholder="boys-gotta-run-2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (no spaces, lowercase)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Boys Gotta Run – Discovery 5K (Final Run)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Event description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="text"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    placeholder="7:55 AM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Discovery Elementary"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={eventForm.address}
                  onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                  placeholder="5275 N 36th St, Arlington, VA 22207"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Distance</label>
                <input
                  type="text"
                  value={eventForm.distance}
                  onChange={(e) => setEventForm({ ...eventForm, distance: e.target.value })}
                  placeholder="5K, 10K, 3.1 miles, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Strava Route URL</label>
                  <input
                    type="url"
                    value={eventForm.stravaRouteUrl}
                    onChange={(e) => setEventForm({ ...eventForm, stravaRouteUrl: e.target.value })}
                    placeholder="https://www.strava.com/routes/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Strava Route ID</label>
                  <input
                    type="text"
                    value={eventForm.stravaRouteId}
                    onChange={(e) => setEventForm({ ...eventForm, stravaRouteId: e.target.value })}
                    placeholder="3420808564668746102"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Volunteer Modal */}
      {editingVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Volunteer</h2>
              <button
                onClick={() => {
                  setEditingVolunteer(null);
                  setVolunteerForm({ name: '', email: '', role: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerForm.name}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={volunteerForm.email}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={volunteerForm.role}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role</option>
                  {VOLUNTEER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={volunteerForm.notes}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVolunteer(null);
                    setVolunteerForm({ name: '', email: '', role: '', notes: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVolunteer}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;

