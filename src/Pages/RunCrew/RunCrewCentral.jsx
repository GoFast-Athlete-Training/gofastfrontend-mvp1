import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

/**
 * RunCrewCentral - Member View
 * Per RunCrewArchitecture.md: Member view for RunCrew
 * Local-first hydration from LocalStorageAPI
 */
export default function RunCrewCentral() {
  const navigate = useNavigate();
  const { athleteId, runCrewId } = useHydratedAthlete();
  const [crew, setCrew] = useState(() => LocalStorageAPI.getRunCrewData());
  const [selectedRun, setSelectedRun] = useState(null);

  const runs = crew?.runs || [];
  const announcements = crew?.announcements || [];
  const messages = crew?.messages || [];
  const memberships = crew?.memberships || crew?.members || [];

  const currentDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), []);

  const formatRunDate = (run) => {
    const candidate = run.date || run.scheduledAt || null;
    if (!candidate) return 'Date TBD';
    try {
      return new Date(candidate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return candidate;
    }
  };

  const toggleRunDetails = (runId) => {
    setSelectedRun(selectedRun === runId ? null : runId);
  };

  if (!crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No crew data found</p>
          <button
            onClick={() => navigate('/athlete-home')}
            className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
          >
            Back to Home
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{crew.name || 'RunCrew'}</h1>
                <p className="text-xs text-gray-500">{currentDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Announcements */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📢 Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold">
                      {announcement.author?.firstName
                        ? `${announcement.author.firstName}${announcement.author.lastName ? ` ${announcement.author.lastName}` : ''}`
                        : 'Admin'}
                    </span>
                    <span>
                      {announcement.createdAt
                        ? new Date(announcement.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{announcement.content || announcement.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Runs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏃 Upcoming Runs</h2>
          {runs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No runs scheduled yet</p>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const rsvpCount = run.rsvps?.length || run._count?.rsvps || 0;
                const goingCount = run.rsvps?.filter(r => r.status === 'going').length || rsvpCount;
                const isExpanded = selectedRun === run.id;
                
                return (
                  <div key={run.id} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{run.title || 'Untitled Run'}</p>
                          <p className="text-xs text-gray-500">{formatRunDate(run)}</p>
                          {run.meetUpPoint && (
                            <p className="text-xs text-gray-500 mt-1">📍 {run.meetUpPoint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{goingCount} going</span>
                          <button
                            onClick={() => toggleRunDetails(run.id)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-semibold border border-orange-300 rounded px-3 py-1 hover:bg-orange-50 transition"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {run.totalMiles && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                              <p className="font-semibold text-gray-900">{run.totalMiles} miles</p>
                            </div>
                          )}
                          {run.pace && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Pace</p>
                              <p className="font-semibold text-gray-900">{run.pace}</p>
                            </div>
                          )}
                        </div>
                        {run.description && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{run.description}</p>
                          </div>
                        )}
                        {run.stravaMapUrl && (
                          <a
                            href={run.stravaMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                          >
                            View Route on Strava
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Members ({memberships.length})</h2>
          {memberships.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No members yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {memberships.map((membership) => {
                const athlete = membership.athlete || membership;
                const managerRecord = Array.isArray(crew.managers)
                  ? crew.managers.find((manager) => manager.athleteId === athlete?.id && manager.role === 'admin')
                  : null;

                return (
                  <div key={athlete?.id || membership.id} className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">
                      {athlete?.firstName || 'Athlete'} {athlete?.lastName || ''}
                      {managerRecord && <span className="text-orange-600 text-xs font-bold ml-1">(Admin)</span>}
                    </p>
                    {athlete?.email && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{athlete.email}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Messages</h2>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No messages yet</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id || message.createdAt} className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold">
                      {message.athlete?.firstName
                        ? `${message.athlete.firstName}${message.athlete.lastName ? ` ${message.athlete.lastName}` : ''}`
                        : 'Member'}
                    </span>
                    <span>
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{message.content || message.body || message.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
