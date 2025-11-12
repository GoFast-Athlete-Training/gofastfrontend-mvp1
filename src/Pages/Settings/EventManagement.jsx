import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Calendar, MapPin, ExternalLink, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosConfig';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import { getCategoryFromRole, getCategoryDisplayName, calculateVolunteerStats, groupVolunteersByCategory } from '../../utils/volunteerCategoryMapper';

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

// Time options for time picker (matching RunCrewCentralAdmin pattern)
const timeOptions = [
  '5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','7:55 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM'
];

const EventManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState({}); // { eventId: [volunteers] }
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Form state for creating event - LOCKED IN MODEL
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '', // YYYY-MM-DD format for date input
    startTime: '', // Time from timeOptions dropdown (e.g., "7:55 AM")
    location: '',
    address: '',
    stravaRouteUrl: '', // Just the URL - users paste it directly
    distance: '',
    eventType: 'race',
  });

  // Pre-fill form with Boys on Run 5K data - HARDCODED, NO TYPING REQUIRED!
  const prefillBoysOnRun5K = () => {
    // HARDCODED VALUES - NO TYPING REQUIRED!
    // Wednesday, November 12, 2025 – 7:55 AM
    const eventDate = new Date('2025-11-12T00:00:00');
    const formattedDate = eventDate.toISOString().split('T')[0]; // "2025-11-12"
    
    // Set ALL fields immediately - form will be 100% filled
    setEventForm({
      title: 'Boys on Run 5K',
      description: 'Final week of our Boys Gotta Run season. We\'re keeping it low-key, warm, and all about the kids.',
      date: formattedDate, // "2025-11-12"
      startTime: '7:55 AM', // Must be in timeOptions array
      location: 'Discovery Elementary School',
      address: '5275 N 36th St, Arlington, VA 22207',
      stravaRouteUrl: 'https://www.strava.com/routes/3420808564668746102',
      distance: '5K',
      eventType: 'race',
    });
    
    // Scroll to top of form to see the filled fields
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Form state for editing volunteer
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    notes: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Get athleteId from localStorage (hydrated from welcome screen)
      const athleteId = LocalStorageAPI.getAthleteId();
      if (!athleteId) {
        alert('Athlete ID not found. Please sign in again.');
        navigate('/signin');
        return;
      }

      // Axios automatically sends Firebase token via interceptor
      // Send athleteId from localStorage as query param
      const response = await api.get('/event', {
        params: { 
          isActive: 'true',
          athleteId: athleteId // From localStorage (welcome screen hydration)
        }
      });
      if (response.data.success) {
        setEvents(response.data.data || []);
        // Fetch volunteers for each event
        response.data.data?.forEach((event) => {
          fetchVolunteers(event.id);
        });
      } else {
        console.error('❌ Error fetching events:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please sign in again.');
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async (eventId) => {
    try {
      if (!eventId) return;

      // Use admin-hydrate endpoint to get volunteers WITH emails (for admin management)
      const response = await fetch(`${API_BASE}/event-volunteer/admin-hydrate?eventId=${eventId}`);
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

  // Helper function to convert time from "7:55 AM" to "07:55" (24-hour format)
  const convertTimeTo24Hour = (timeStr) => {
    if (!timeStr) return '00:00';
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minutes || '00'}`;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!eventForm.title?.trim() || !eventForm.date) {
      alert('Please fill in title and date');
      return;
    }

    try {
      // Build ISO date string from date + startTime (matching RunCrewCentralAdmin pattern)
      const isoDate = eventForm.date && eventForm.startTime
        ? `${eventForm.date}T${convertTimeTo24Hour(eventForm.startTime)}:00`
        : eventForm.date
        ? `${eventForm.date}T00:00:00`
        : null;

      // Get athleteId from localStorage (hydrated from welcome screen)
      const athleteId = LocalStorageAPI.getAthleteId();
      if (!athleteId) {
        alert('Athlete ID not found. Please sign in again.');
        navigate('/signin');
        return;
      }

      // Axios automatically sends Firebase token via interceptor
      // Send athleteId from localStorage in request body
      const response = await api.post('/event', {
        title: eventForm.title.trim(),
        description: eventForm.description?.trim() || null,
        date: isoDate ? new Date(isoDate).toISOString() : new Date().toISOString(),
        startTime: eventForm.startTime?.trim() || null,
        location: eventForm.location?.trim() || null,
        address: eventForm.address?.trim() || null,
        stravaRouteUrl: eventForm.stravaRouteUrl?.trim() || null,
        distance: eventForm.distance?.trim() || null,
        eventType: eventForm.eventType?.trim() || null,
        athleteId: athleteId, // From localStorage (welcome screen hydration)
      });

      const data = response.data;
      
      if (data.success) {
        setShowCreateModal(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          startTime: '',
          location: '',
          address: '',
          stravaRouteUrl: '',
          distance: '',
          eventType: 'race',
        });
        fetchEvents();
        alert(data.wasUpdated ? 'Event updated successfully!' : 'Event created successfully!');
      } else {
        alert('Failed to create event: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please sign in again.');
        navigate('/signin');
      } else {
        alert('Failed to create event: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleEditVolunteer = (volunteer) => {
    setEditingVolunteer(volunteer);
    setVolunteerForm({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone || '',
      role: volunteer.role,
      notes: volunteer.notes || '',
    });
    setSelectedEventId(volunteer.eventId || volunteer.event?.id);
  };

  const handleDeleteVolunteer = async (volunteer) => {
    if (!confirm(`Are you sure you want to delete ${volunteer.name} from ${volunteer.role}?`)) {
      return;
    }

    try {
      const response = await api.delete(`/event-volunteer/${volunteer.id}`);
      
      if (response.data.success) {
        alert(`✅ Volunteer deleted successfully`);
        // Refresh volunteers for this event
        const eventId = volunteer.eventId || volunteer.event?.id;
        if (eventId) {
          fetchVolunteers(eventId);
        }
      }
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      alert('❌ Failed to delete volunteer: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSaveVolunteer = async () => {
    if (!editingVolunteer || !selectedEventId) return;

    try {
      if (!selectedEventId) {
        alert('Event not found');
        return;
      }

      // Use PUT endpoint to update volunteer
      const response = await fetch(`${API_BASE}/event-volunteer/${editingVolunteer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: volunteerForm.name,
          email: volunteerForm.email,
          phone: volunteerForm.phone || undefined,
          notes: volunteerForm.notes || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingVolunteer(null);
        setVolunteerForm({ name: '', email: '', phone: '', role: '', notes: '' });
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
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Volunteers
                      </h3>
                      {(() => {
                        const stats = calculateVolunteerStats(volunteers[event.id] || []);
                        return (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-semibold">{stats.totalFilled}</span> Filled
                            </span>
                            <span className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-semibold">{stats.totalVacant}</span> Vacant
                            </span>
                            {stats.totalVacant > 0 && (
                              <button
                                onClick={() => navigate(`/volunteer-management/vacant?eventId=${event.id}`)}
                                className="text-orange-600 hover:text-orange-700 font-medium underline"
                              >
                                View Vacant Roles
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
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
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Phone
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
                          {volunteers[event.id]
                            .sort((a, b) => {
                              // Sort by category first, then by role name
                              const catA = getCategoryFromRole(a.role);
                              const catB = getCategoryFromRole(b.role);
                              if (catA !== catB) {
                                const order = ['marshal', 'pacer', 'water', 'finish', 'other'];
                                return order.indexOf(catA) - order.indexOf(catB);
                              }
                              return a.role.localeCompare(b.role);
                            })
                            .map((volunteer) => {
                              const category = getCategoryFromRole(volunteer.role);
                              const categoryDisplay = getCategoryDisplayName(category);
                              
                              return (
                                <tr key={volunteer.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {categoryDisplay}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {volunteer.role}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {volunteer.name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {volunteer.email}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {volunteer.phone ? (
                                      <a href={`tel:${volunteer.phone}`} className="text-orange-600 hover:text-orange-700 hover:underline">
                                        {volunteer.phone}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {volunteer.notes || '—'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => handleEditVolunteer(volunteer)}
                                        className="text-orange-600 hover:text-orange-700 font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVolunteer(volunteer)}
                                        className="text-red-600 hover:text-red-700 font-medium"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
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
                  className="px-5 py-2.5 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
                  title="Click to fill ALL fields automatically - no typing required!"
                >
                  🚀 Pre-fill: Boys on Run 5K
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
              {/* Pre-fill Notice */}
              {!eventForm.title && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-700 font-medium">
                    💡 Click the "🚀 Pre-fill: Boys on Run 5K" button above to automatically fill ALL fields - no typing required!
                  </p>
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <select
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select time...</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Strava Route URL</label>
                <input
                  type="url"
                  value={eventForm.stravaRouteUrl}
                  onChange={(e) => setEventForm({ ...eventForm, stravaRouteUrl: e.target.value })}
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Just paste the Strava route URL - no need to extract the ID</p>
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
                  setVolunteerForm({ name: '', email: '', phone: '', role: '', notes: '' });
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">For text strand communication</p>
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
                    setVolunteerForm({ name: '', email: '', phone: '', role: '', notes: '' });
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

