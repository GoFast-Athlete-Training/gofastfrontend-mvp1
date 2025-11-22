// RunCrewSettings.jsx
// Admin-only settings page for RunCrew management
// Features: Delegate admins, crew configuration, delete crew

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import { auth } from '../../firebase';
import api from '../../api/axiosConfig';
import { UserX, Crown, Trash2, Users, Image, Link } from 'lucide-react';

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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('manager'); // 'admin' or 'manager'
  const [isAddingManager, setIsAddingManager] = useState(false);
  const [crewName, setCrewName] = useState('');
  const [crewDescription, setCrewDescription] = useState('');
  const [crewLogo, setCrewLogo] = useState('');
  const [crewIcon, setCrewIcon] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

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
          setCrewName(storedCrew.name || '');
          setCrewDescription(storedCrew.description || '');
          setCrewLogo(storedCrew.logo || '');
          setCrewIcon(storedCrew.icon || '');
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
            setCrewName(response.data.runCrew.name || '');
            setCrewDescription(response.data.runCrew.description || '');
            setCrewLogo(response.data.runCrew.logo || '');
            setCrewIcon(response.data.runCrew.icon || '');
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

  const handleSaveCrewInfo = async () => {
    if (!crew) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to update crew');
        return;
      }

      setIsSaving(true);
      const token = await user.getIdToken();
      const response = await api.patch(`${API_BASE}/runcrew/${crew.id}`, {
        name: crewName.trim(),
        description: crewDescription.trim() || null,
        logo: crewLogo.trim() || null,
        icon: crewIcon.trim() || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update local state and localStorage
        const updatedCrew = { 
          ...crew, 
          name: crewName.trim(), 
          description: crewDescription.trim() || null,
          logo: crewLogo.trim() || null,
          icon: crewIcon.trim() || null
        };
        setCrew(updatedCrew);
        LocalStorageAPI.setRunCrewData(updatedCrew);
        setError(null);
        // Show success message (you could add a toast here)
      }
    } catch (err) {
      console.error('Error updating crew:', err);
      setError(err.response?.data?.message || 'Failed to update crew');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCrew = async () => {
    if (!crew) return;

    setIsDeleting(true);
    setError(null);
    setShowDeleteConfirm(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to delete a crew');
        setIsDeleting(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await api.delete(`${API_BASE}/runcrew/${crew.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Show success message FIRST before clearing
        setDeleteSuccess(true);
        
        // Clear ALL crew-related localStorage data
        LocalStorageAPI.clearRunCrewData();
        
        // Also clear the full hydration model's crew data
        const fullModel = LocalStorageAPI.getFullHydrationModel();
        if (fullModel?.athlete) {
          // Remove crew-related data from athlete object
          const cleanedAthlete = { ...fullModel.athlete };
          delete cleanedAthlete.runCrewMemberships;
          delete cleanedAthlete.runCrewManagers;
          delete cleanedAthlete.adminRunCrews;
          delete cleanedAthlete.MyCrew;
          delete cleanedAthlete.MyCrewManagerId;
          delete cleanedAthlete.runCrews;
          
          // Update the hydration model
          LocalStorageAPI.setFullHydrationModel({
            ...fullModel,
            athlete: cleanedAthlete
          });
        }
        
        // Redirect to home after 3 seconds (give user time to see success message)
        setTimeout(() => {
          navigate('/athlete-home', { replace: true });
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting crew:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete crew';
      
      // If crew is already deleted/archived, treat it as success
      if (err.response?.status === 400 && errorMessage.includes('already')) {
        console.log('✅ Crew already deleted, clearing localStorage and redirecting');
        
        // Show success message FIRST
        setDeleteSuccess(true);
        
        // Clear ALL crew-related localStorage data
        LocalStorageAPI.clearRunCrewData();
        
        // Also clear the full hydration model's crew data
        const fullModel = LocalStorageAPI.getFullHydrationModel();
        if (fullModel?.athlete) {
          const cleanedAthlete = { ...fullModel.athlete };
          delete cleanedAthlete.runCrewMemberships;
          delete cleanedAthlete.runCrewManagers;
          delete cleanedAthlete.adminRunCrews;
          delete cleanedAthlete.MyCrew;
          delete cleanedAthlete.MyCrewManagerId;
          delete cleanedAthlete.runCrews;
          
          LocalStorageAPI.setFullHydrationModel({
            ...fullModel,
            athlete: cleanedAthlete
          });
        }
        
        setTimeout(() => {
          navigate('/athlete-home', { replace: true });
        }, 3000);
        return;
      }
      
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  // Show delete success message
  if (deleteSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crew Deleted Successfully</h2>
            <p className="text-gray-600 mb-6">Your RunCrew has been permanently deleted.</p>
            <p className="text-sm text-gray-500">Redirecting to home...</p>
          </div>
        </div>
      </div>
    );
  }

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
  
  // Get members who are NOT already admins (for Add Manager modal)
  const availableMembers = members.filter(membership => {
    const isAlreadyAdmin = admins.some(admin => admin.athleteId === membership.athleteId);
    return !isAlreadyAdmin;
  });

  const handleAddManager = async () => {
    if (!selectedMemberId || !crew) {
      setError('Please select a member');
      return;
    }

    try {
      setIsAddingManager(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to add managers');
        setIsAddingManager(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await api.post(`${API_BASE}/runcrew/${crew.id}/managers`, {
        athleteId: selectedMemberId,
        role: selectedRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh crew data
        const hydrateResponse = await api.post(`${API_BASE}/runcrew/hydrate`, {
          runCrewId: crew.id,
          athleteId: LocalStorageAPI.getAthleteId()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (hydrateResponse.data.success) {
          setCrew(hydrateResponse.data.runCrew);
          LocalStorageAPI.setRunCrewData(hydrateResponse.data.runCrew);
        }

        // Close modal and reset
        setShowAddManagerModal(false);
        setSelectedMemberId('');
        setSelectedRole('manager');
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to add manager');
      }
    } catch (err) {
      console.error('Error adding manager:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add manager');
    } finally {
      setIsAddingManager(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Run Crew Settings</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/athlete-home')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-300"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/crew/crewadmin')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-300"
              >
                Back to Admin
              </button>
            </div>
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
                Are you sure you want to delete <strong>{crewData.name}</strong>? This action cannot be undone and will remove all crew data, members, runs, and history.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCrew}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
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
                        value={crewName}
                        onChange={(e) => setCrewName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Enter crew name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={crewDescription}
                        onChange={(e) => setCrewDescription(e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Enter crew description (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={crewLogo}
                          onChange={(e) => setCrewLogo(e.target.value)}
                          className="flex-1 p-3 border border-gray-300 rounded-lg"
                          placeholder="https://example.com/logo.png"
                        />
                        {crewLogo && (
                          <img src={crewLogo} alt="Logo preview" className="w-12 h-12 rounded object-cover border border-gray-300" onError={(e) => e.target.style.display = 'none'} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter a URL to an image for your crew logo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon (Emoji)</label>
                      <input
                        type="text"
                        value={crewIcon}
                        onChange={(e) => setCrewIcon(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="🏃 or 🏔️"
                        maxLength={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter an emoji as an alternative to logo (1-2 characters)</p>
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
                        <button className="px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50" disabled>
                          User Set
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Join code is set by the user when creating the crew</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invite URL (System Generated)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={crewData.joinCode ? `${window.location.origin}/join/${crewData.joinCode}` : ''}
                          readOnly
                          className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={() => {
                            const url = crewData.joinCode ? `${window.location.origin}/join/${crewData.joinCode}` : '';
                            if (url) {
                              navigator.clipboard.writeText(url);
                              // Could add toast here
                            }
                          }}
                          className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 flex items-center gap-2"
                        >
                          <Link className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Share this URL to invite members. System-generated from join code.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveCrewInfo}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
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

      {/* Add Manager Modal */}
      {showAddManagerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Manager</h3>
            <p className="text-gray-600 mb-6">
              Select a member to grant manager or admin permissions.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a member...</option>
                  {availableMembers.map((membership) => (
                    <option key={membership.id} value={membership.athleteId}>
                      {membership.athlete?.firstName} {membership.athlete?.lastName} 
                      {membership.athlete?.email ? ` (${membership.athlete.email})` : ''}
                    </option>
                  ))}
                </select>
                {availableMembers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    All members are already admins.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedRole === 'admin' 
                    ? 'Admins have full control over the crew'
                    : 'Managers can help manage runs and announcements'}
                </p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddManagerModal(false);
                  setSelectedMemberId('');
                  setSelectedRole('manager');
                  setError(null);
                }}
                disabled={isAddingManager}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManager}
                disabled={isAddingManager || !selectedMemberId}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {isAddingManager ? 'Adding...' : 'Add Manager'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal - Placeholder */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Transfer Ownership</h3>
            <p className="text-gray-600 mb-6">
              Transfer ownership functionality coming soon.
            </p>
            <button
              onClick={() => setShowTransferModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

