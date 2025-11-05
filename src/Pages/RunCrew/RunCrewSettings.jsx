// RunCrewSettings.jsx
// Admin-only settings page for RunCrew management
// Features: Delegate admins, broadcast messages, crew configuration

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RunCrewSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general'); // general, admins, members

  // Mock crew data
  const crew = {
    name: 'Morning Warriors',
    joinCode: 'FAST123',
    description: 'Early morning runners who love coffee and crushing goals together.',
    members: 8
  };

  const mockAdmins = [
    { id: '1', name: 'You', email: 'admin@example.com', isCreator: true }
  ];

  const mockMembers = [
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', joinedAt: '2024-01-15' },
    { id: '3', name: 'Mike Chen', email: 'mike@example.com', joinedAt: '2024-01-20' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Run Crew Settings</h1>
            <button
              onClick={() => navigate('/runcrew-central')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Central
            </button>
          </div>
          <p className="text-gray-600">Manage your crew configuration and permissions</p>
        </div>

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
                Admins ({mockAdmins.length})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-3 font-medium ${
                  activeTab === 'members'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members ({mockMembers.length})
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
                        defaultValue={crew.name}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        defaultValue={crew.description}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Join Code</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={crew.joinCode}
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
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                    Add Admin
                  </button>
                </div>
                {mockAdmins.map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      {admin.isCreator && (
                        <span className="text-xs text-orange-600 font-medium">Creator</span>
                      )}
                    </div>
                    {!admin.isCreator && (
                      <button className="text-red-600 hover:text-red-800">Remove</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Crew Members</h3>
                {mockMembers.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-600">Joined {member.joinedAt}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm">
                        Make Admin
                      </button>
                      <button className="text-red-600 hover:text-red-800">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

