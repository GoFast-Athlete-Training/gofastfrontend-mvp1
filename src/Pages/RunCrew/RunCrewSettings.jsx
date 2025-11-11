// RunCrewSettings.jsx
// Admin-only settings page for RunCrew management
// Features: Delegate admins, broadcast messages, crew configuration, delete crew

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import { auth } from '../../firebase';
import api from '../../api/axiosConfig';
import { UserX, Crown, Trash2, Users } from 'lucide-react';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function RunCrewSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [crew, setCrew] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);

  // Get crew data from localStorage or hydrate
  useEffect(() => {
    const loadCrew = async () => {
      try {
        const runCrewId = LocalStorageAPI.getRunCrewId();
        if (!runCrewId) {
          setError('No crew selected');
          return;
        }

        // Try to get from localStorage first
        const storedCrew = LocalStorageAPI.getRunCrewData();
        if (storedCrew) {
          setCrew(storedCrew);
          setLoading(false);
        }

        // Hydrate from backend
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const response = await api.post(`${API_BASE}/runcrew/hydrate`, {
            runCrewId,
            athleteId: LocalStorageAPI.getAthleteId()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            setCrew(response.data.runCrew);
            LocalStorageAPI.setRunCrewData(response.data.runCrew);
          }
        }
      } catch (err) {
        console.error('Error loading crew:', err);
        setError('Failed to load crew data');
      } finally {
        setLoading(false);
      }
    };

    loadCrew();
  }, []);

  const handleDeleteCrew = async () => {
    if (!crew) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to delete a crew');
        return;
      }

      const token = await user.getIdToken();
      const response = await api.delete(`${API_BASE}/runcrew/${crew.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Clear localStorage
        LocalStorageAPI.clearRunCrewData();
        // Redirect to home
        navigate('/athlete-home');
      }
    } catch (err) {
      console.error('Error deleting crew:', err);
      setError(err.response?.data?.message || 'Failed to delete crew');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crew settings...</p>
        </div>
      </div>
    );
  }

  if (error && !crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/athlete-home')}
            className="text-orange-600 hover:text-orange-800"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const crewData = crew || {
    name: 'Loading...',
    joinCode: '',
    description: '',
    members: 0
  };

  // Compute admins and members from crew data
  const admins = crew?.managers?.filter(m => m.role === 'admin') || [];
  const members = crew?.memberships || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Run Crew Settings</h1>
            <button
              onClick={() => navigate('/runcrew/central')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Central
            </button>
          </div>
          <p className="text-gray-600">Manage your crew configuration and permissions</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Transfer Ownership Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-3">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Transfer Ownership</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Transfer admin rights to another member
            </p>
            <button
              onClick={() => setShowTransferModal(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Transfer
            </button>
          </div>

          {/* Add Manager Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Add a Manager</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Grant manager permissions to a member
            </p>
            <button
              onClick={() => setShowAddManagerModal(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Add Manager
            </button>
          </div>

          {/* Delete RunCrew Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-lg mr-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete RunCrew</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete this crew (cannot be undone)
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete RunCrew?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{crewData.name}</strong>? This action cannot be undone and will remove all crew data, members, and history.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCrew}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-3 font-medium ${
                  activeTab === 'general'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-3 font-medium ${
                  activeTab === 'admins'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admins ({admins.length})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-3 font-medium ${
                  activeTab === 'members'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members ({members.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Crew Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Crew Name</label>
                      <input
                        type="text"
                        defaultValue={crewData.name}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        defaultValue={crewData.description || ''}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Join Code</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={crewData.joinCode || ''}
                          readOnly
                          className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Broadcast Messages</h3>
                  <div className="space-y-4">
                    <textarea
                      placeholder="Send a message to all crew members..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <button className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
                      Broadcast to Crew
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Crew Admins</h3>
                  <button
                    onClick={() => setShowAddManagerModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Add Admin
                  </button>
                </div>
                {crew?.managers?.filter(m => m.role === 'admin').map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{admin.athlete?.firstName} {admin.athlete?.lastName}</p>
                      <p className="text-sm text-gray-600">{admin.athlete?.email}</p>
                      <span className="text-xs text-orange-600 font-medium">Admin</span>
                    </div>
                    {crew.runcrewAdminId !== admin.athleteId && (
                      <button className="text-red-600 hover:text-red-800">Remove</button>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No admins found</p>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Crew Members</h3>
                {crew?.memberships?.map((membership) => (
                  <div key={membership.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{membership.athlete?.firstName} {membership.athlete?.lastName}</p>
                      <p className="text-sm text-gray-600">Joined {new Date(membership.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm">
                        Make Admin
                      </button>
                      <button className="text-red-600 hover:text-red-800">Remove</button>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No members found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

