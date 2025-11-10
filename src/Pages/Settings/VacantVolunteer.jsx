import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import { calculateVolunteerStats, getCategoryFromRole, getCategoryDisplayName, EXPECTED_ROLES } from '../../utils/volunteerCategoryMapper';

const API_BASE = import.meta.env.PROD 
  ? 'https://gofastbackendv2-fall2025.onrender.com/api' 
  : 'http://localhost:4000/api';

const VacantVolunteer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [volunteers, setVolunteers] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventAndVolunteers();
    }
  }, [eventId]);

  const fetchEventAndVolunteers = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventResponse = await fetch(`${API_BASE}/event/${eventId}`);
      const eventData = await eventResponse.json();
      if (eventData.success) {
        setEvent(eventData.data);
      }

      // Fetch volunteers
      const volunteerResponse = await fetch(`${API_BASE}/event-volunteer/admin-hydrate?eventId=${eventId}`);
      const volunteerData = await volunteerResponse.json();
      if (volunteerData.success) {
        setVolunteers(volunteerData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vacant roles...</p>
        </div>
      </div>
    );
  }

  const stats = calculateVolunteerStats(volunteers, EXPECTED_ROLES);
  const vacantByCategory = {};

  stats.vacantRoles.forEach(role => {
    const category = getCategoryFromRole(role);
    if (!vacantByCategory[category]) {
      vacantByCategory[category] = [];
    }
    vacantByCategory[category].push(role);
  });

  const categoryOrder = ['marshal', 'pacer', 'water', 'finish'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate('/settings/events')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">Vacant Volunteer Roles</h1>
              </div>
              {event && (
                <p className="text-gray-600 ml-8">{event.title}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-2xl font-bold">{stats.totalFilled}</span>
              </div>
              <p className="text-sm text-gray-600">Filled Roles</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="text-2xl font-bold">{stats.totalVacant}</span>
              </div>
              <p className="text-sm text-gray-600">Vacant Roles</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">{stats.totalExpected}</span>
              </div>
              <p className="text-sm text-gray-600">Total Expected</p>
            </div>
          </div>
        </div>

        {/* Vacant Roles by Category */}
        {stats.totalVacant === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Roles Filled!</h3>
            <p className="text-gray-600">All volunteer positions have been filled. Great job!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoryOrder.map(category => {
              if (!vacantByCategory[category] || vacantByCategory[category].length === 0) {
                return null;
              }

              return (
                <div key={category} className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {getCategoryDisplayName(category)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({vacantByCategory[category].length} vacant)
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {vacantByCategory[category].map(role => (
                      <div
                        key={role}
                        className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900">{role}</span>
                        <span className="text-xs text-orange-600 font-medium">Vacant</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VacantVolunteer;
