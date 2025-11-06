import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

/**
 * RunCrewCentral - Member View
 * Crew ID is the primary relationship manager
 * Hydrates: /api/runcrew/:id (members, runs, etc.)
 */
export default function RunCrewCentral() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [crew, setCrew] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate('/runcrew-list', { replace: true });
      return;
    }
    fetchCrewData();
  }, [id, navigate]);

  const fetchCrewData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in');
        navigate('/athlete-home');
        return;
      }
      
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/runcrew/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch crew data');
      }
      
      const data = await res.json();
      if (data.success && data.runCrew) {
        setCrew(data.runCrew);
      } else {
        throw new Error('Crew not found');
      }
    } catch (err) {
      console.error('Error fetching crew:', err);
      setError(err.message || 'Failed to load crew');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crew...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <p className="text-red-600 mb-4">{error || 'Crew not found'}</p>
          <button
            onClick={() => navigate('/runcrew-list')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  // Get crew members from hydrated data
  const crewMembers = crew?.memberships?.map(membership => {
    const athlete = membership.athlete;
    const firstName = athlete?.firstName || '';
    const lastName = athlete?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || athlete?.email || 'Unknown';
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
    
    return {
      id: athlete?.id,
      name,
      avatar: athlete?.photoURL || null,
      status: 'Active',
      initials,
      athlete
    };
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/runcrew-list')} className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{crew.name}</h1>
            </div>
            {crew.isAdmin && (
              <button
                onClick={() => navigate(`/runcrew-central-admin/${id}`)}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                Admin View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>
          {crewMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-600 mb-4">No members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crewMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {member.initials}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TODO: Add runs/events section when model is ready */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Runs</h2>
          <p className="text-gray-500 text-center py-8">Runs feature coming soon</p>
        </div>
      </div>
    </div>
  );
}
