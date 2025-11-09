import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

/**
 * RunCrewCentral - Member View
 * Clean 2-column layout: Feed + Sidebar
 * No admin tools, just view & engage
 */
export default function RunCrewCentral() {
  const navigate = useNavigate();
  const { athleteId, runCrewId } = useHydratedAthlete();
  const [crew, setCrew] = useState(() => LocalStorageAPI.getRunCrewData());

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{crew.name || 'RunCrew'}</h1>
              <p className="text-sm text-gray-500">{currentDate}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <section className="bg-orange-50 rounded-2xl border border-orange-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 text-xl">📢</span>
                <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
              </div>

              <div className="space-y-3">
                {announcements.length === 0 && (
                  <p className="text-sm text-gray-600">No announcements yet.</p>
                )}
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="bg-white border border-orange-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        📣 {announcement.title || 'Group Run Tomorrow!'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{announcement.content || announcement.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Posted {announcement.createdAt
                        ? new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'just now'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Crew Feed/Chat */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Crew Feed</h2>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full"># General</button>
                  <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"># Runs & Training</button>
                  <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"># Motivation</button>
                  <button className="px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-full">+ New Topic</button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="px-6 py-4 space-y-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                )}
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {message.athlete?.firstName?.[0] || 'A'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {message.athlete?.firstName || 'Athlete'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{message.content || message.text}</p>
                      {message.reactions && (
                        <div className="flex gap-2 mt-2">
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
                            👍 {message.reactions.thumbsUp || 0}
                          </button>
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
                            🔥 {message.reactions.fire || 0}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Text Message"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    Send
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Next Run Card */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Next Run</h2>
              {runs.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">{runs[0].date ? new Date(runs[0].date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Tomorrow'}</span>
                  </div>
                  <p className="text-sm text-gray-600">{runs[0].time || '6:00 AM'}</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{runs[0].meetUpPoint || 'Trailhead Park'}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">{(runs[0].rsvps?.filter(r => r.status === 'going').length || 0)} Going</p>
                    <div className="flex -space-x-2">
                      {runs[0].rsvps?.slice(0, 5).map((rsvp, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                          {rsvp.athlete?.firstName?.[0] || 'A'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold mt-4 transition">
                    I'm Going
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming runs</p>
              )}
            </section>

            {/* Who's Here */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Who's Here</h2>
              <div className="space-y-3">
                {memberships.slice(0, 6).map((membership) => {
                  const athlete = membership.athlete || membership;
                  return (
                    <div key={membership.id || athlete.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm relative">
                        {athlete.firstName?.[0] || 'A'}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{athlete.firstName || 'Athlete'} {athlete.lastName || ''}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {memberships.length > 6 && (
                <button className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                  View all {memberships.length} members
                </button>
              )}
            </section>

            {/* Leaderboard */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex gap-2 mb-4">
                <button className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">Miles</button>
                <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full">Pace</button>
                <button className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full">Cals</button>
              </div>
              <div className="space-y-3">
                {memberships.slice(0, 3).map((membership, index) => {
                  const athlete = membership.athlete || membership;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-sm font-semibold text-gray-900">{athlete.firstName || 'Athlete'}</p>
                      <p className="text-sm font-bold text-orange-600">52.1mi</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

