import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

/**
 * RunCrewList - MVP Modular Component
 * Shows a list of crews the user belongs to as cards
 * Simple hydration: Just fetch /api/runcrew/mine
 */
export default function RunCrewList() {
  const navigate = useNavigate();
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyCrews();
  }, []);

  const fetchMyCrews = async () => {
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
      const res = await fetch(`${API_BASE}/runcrew/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch crews');
      }
      
      const data = await res.json();
      if (data.success && data.runCrews) {
        setCrews(data.runCrews);
      } else {
        setCrews([]);
      }
    } catch (err) {
      console.error('Error fetching crews:', err);
      setError(err.message || 'Failed to load crews');
    } finally {
      setLoading(false);
    }
  };

  const handleCrewClick = (crew) => {
    // Route based on admin status - crew is the primary relationship manager (per RunCrewArchitecture.md)
    if (crew.isAdmin) {
      navigate(`/runcrew/admin/${crew.id}`);
    } else {
      navigate(`/runcrew/${crew.id}`);
    }
  };

  const handleCreateCrew = () => {
    navigate('/form-run-crew');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your crews...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMyCrews}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/athlete-home')} className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Your RunCrews</h1>
            </div>
            <button
              onClick={handleCreateCrew}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
            >
              + Create Crew
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {crews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No crews yet</h2>
            <p className="text-gray-600 mb-6">Create or join a crew to get started!</p>
            <button
              onClick={handleCreateCrew}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-medium"
            >
              Create Your First Crew
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crews.map((crew) => (
              <div
                key={crew.id}
                onClick={() => handleCrewClick(crew)}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{crew.name}</h3>
                    <p className="text-sm text-gray-500">{crew.memberCount || 0} members</p>
                  </div>
                  {crew.isAdmin && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                
                {crew.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{crew.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Code: {crew.joinCode}</span>
                  <span className="text-orange-600 font-medium">View →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

