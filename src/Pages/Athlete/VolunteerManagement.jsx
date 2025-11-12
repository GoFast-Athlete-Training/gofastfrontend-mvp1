import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Mail, Trash2, Download, RefreshCw, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosConfig';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

const API_BASE = import.meta.env.PROD 
  ? 'https://gofastbackendv2-fall2025.onrender.com/api' 
  : 'http://localhost:4000/api';

const VolunteerManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState({}); // { eventId: [volunteers] }
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [deletingVolunteerId, setDeletingVolunteerId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchVolunteers(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const athleteId = LocalStorageAPI.getAthleteId();
      if (!athleteId) {
        setError('Athlete ID not found. Please sign in again.');
        navigate('/athlete-welcome');
        return;
      }

      const response = await api.get(`/event?athleteId=${athleteId}`);
      if (response.data?.success && response.data.data) {
        const eventsList = Array.isArray(response.data.data) ? response.data.data : [];
        setEvents(eventsList);
        
        // Auto-select first event if available
        if (eventsList.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsList[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async (eventId) => {
    if (!eventId) return;
    
    try {
      // Use admin-hydrate endpoint to get volunteers WITH emails (for admin management)
      const response = await fetch(`${API_BASE}/event-volunteer/admin-hydrate?eventId=${eventId}`);
      if (response.ok) {
        const payload = await response.json();
        if (payload.success && payload.data) {
          setVolunteers(prev => ({
            ...prev,
            [eventId]: Array.isArray(payload.data) ? payload.data : [],
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
      setError('Failed to load volunteers. Please try again.');
    }
  };

  const handleDeleteVolunteer = async (volunteerId, eventId) => {
    if (!window.confirm('Are you sure you want to remove this volunteer?')) {
      return;
    }

    setDeletingVolunteerId(volunteerId);
    setError(null);
    setSuccess(null);

    try {
      // Check if DELETE endpoint exists, otherwise we'll need to add it
      const response = await fetch(`${API_BASE}/event-volunteer/${volunteerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Volunteer removed successfully.');
        // Refresh volunteers for this event
        await fetchVolunteers(eventId);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to remove volunteer');
      }
    } catch (error) {
      console.error('Failed to delete volunteer:', error);
      setError(error.message || 'Failed to remove volunteer. The DELETE endpoint may not be implemented yet.');
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingVolunteerId(null);
    }
  };

  const handleExportVolunteers = (eventId) => {
    const event = events.find(e => e.id === eventId);
    const eventVolunteers = volunteers[eventId] || [];
    
    if (eventVolunteers.length === 0) {
      alert('No volunteers to export.');
      return;
    }

    // Group by role
    const groupedByRole = eventVolunteers.reduce((acc, volunteer) => {
      const role = volunteer.role || 'Unassigned';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(volunteer);
      return acc;
    }, {});

    // Create CSV content
    let csvContent = `Event: ${event?.title || 'Unknown Event'}\n`;
    csvContent += `Date: ${event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'}\n`;
    csvContent += `Location: ${event?.location || 'N/A'}\n`;
    csvContent += `\n`;
    csvContent += `Total Volunteers: ${eventVolunteers.length}\n`;
    csvContent += `\n`;

    // Add volunteers grouped by role
    Object.entries(groupedByRole).forEach(([role, roleVolunteers]) => {
      csvContent += `\n${role} (${roleVolunteers.length})\n`;
      csvContent += `Name,Email,Phone,Notes,Signup Date\n`;
      roleVolunteers.forEach(volunteer => {
        const name = volunteer.name || '';
        const email = volunteer.email || '';
        const phone = volunteer.phone || '';
        const notes = volunteer.notes || '';
        const date = volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : '';
        csvContent += `"${name}","${email}","${phone}","${notes}","${date}"\n`;
      });
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `volunteers-${event?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVolunteersByRole = (eventId) => {
    const eventVolunteers = volunteers[eventId] || [];
    const grouped = eventVolunteers.reduce((acc, volunteer) => {
      const role = volunteer.role || 'Unassigned';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(volunteer);
      return acc;
    }, {});
    return grouped;
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventVolunteers = selectedEventId ? (volunteers[selectedEventId] || []) : [];
  const volunteersByRole = selectedEventId ? getVolunteersByRole(selectedEventId) : {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/athlete-home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
                <p className="text-sm text-gray-600 mt-1">View and manage volunteers for your events</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings/events')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Manage Events
              </button>
              <button
                onClick={fetchEvents}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Create an event to start managing volunteers.</p>
            <button
              onClick={() => navigate('/settings/events')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Event List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Events</h2>
                <div className="space-y-2">
                  {events.map((event) => {
                    const eventVolCount = volunteers[event.id]?.length || 0;
                    const isSelected = selectedEventId === event.id;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          isSelected
                            ? 'bg-orange-50 border-2 border-orange-200'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="text-xs text-orange-600 mt-1 font-medium">
                          {eventVolCount} volunteer{eventVolCount !== 1 ? 's' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Volunteer List Main Content */}
            <div className="lg:col-span-3">
              {selectedEvent ? (
                <div className="space-y-6">
                  {/* Event Header */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                          {selectedEvent.date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {selectedEvent.location && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{selectedEvent.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleExportVolunteers(selectedEventId)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{eventVolunteers.length} total volunteer{eventVolunteers.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Volunteers by Role */}
                  {Object.keys(volunteersByRole).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(volunteersByRole).map(([role, roleVolunteers]) => (
                        <div key={role} className="bg-white rounded-xl shadow-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {role} <span className="text-gray-500 text-sm">({roleVolunteers.length})</span>
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {roleVolunteers.map((volunteer) => (
                              <div
                                key={volunteer.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{volunteer.name}</div>
                                  <div className="text-sm text-gray-600 mt-1">{volunteer.email}</div>
                                  {volunteer.phone && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      <a href={`tel:${volunteer.phone}`} className="text-orange-600 hover:text-orange-700 hover:underline">
                                        {volunteer.phone}
                                      </a>
                                    </div>
                                  )}
                                  {volunteer.notes && (
                                    <div className="text-xs text-gray-500 mt-1">{volunteer.notes}</div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    Signed up: {volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : 'Unknown'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteVolunteer(volunteer.id, selectedEventId)}
                                  disabled={deletingVolunteerId === volunteer.id}
                                  className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove volunteer"
                                >
                                  {deletingVolunteerId === volunteer.id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Volunteers Yet</h3>
                      <p className="text-gray-600">
                        Volunteers will appear here once they sign up for this event.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Event</h3>
                  <p className="text-gray-600">Choose an event from the list to view volunteers.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerManagement;

