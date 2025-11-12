import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import api from '../../api/axiosConfig';

/**
 * RunCrewCentral - Member View
 * Clean 2-column layout: Feed + Sidebar
 * No admin tools, just view & engage
 */
export default function RunCrewCentral() {
  const navigate = useNavigate();
  const { athlete, athleteId, runCrewId } = useHydratedAthlete();
  const [crew, setCrew] = useState(() => LocalStorageAPI.getRunCrewData());
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copyState, setCopyState] = useState('idle');
  const [isRsvpUpdating, setIsRsvpUpdating] = useState(false);

  const runs = useMemo(() => (Array.isArray(crew?.runs) ? crew.runs : []), [crew]);
  const announcements = useMemo(() => (Array.isArray(crew?.announcements) ? crew.announcements : []), [crew]);
  const messages = useMemo(() => (Array.isArray(crew?.messages) ? crew.messages : []), [crew]);
  const memberships = useMemo(
    () => (Array.isArray(crew?.memberships) ? crew.memberships : Array.isArray(crew?.members) ? crew.members : []),
    [crew]
  );
  const leaderboard = useMemo(() => crew?.leaderboardDynamic || [], [crew]);
  const joinCode = crew?.joinCode || crew?.inviteCode || null;

  const [activeMetric, setActiveMetric] = useState('miles');

  const currentDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), []);

  const nextRun = useMemo(() => {
    if (runs.length === 0) return null;
    return [...runs]
      .filter((run) => run.date || run.scheduledAt)
      .sort((a, b) => new Date(a.date || a.scheduledAt) - new Date(b.date || b.scheduledAt))[0];
  }, [runs]);

  const leaderboardEntries = useMemo(() => {
    if (!Array.isArray(leaderboard)) return [];
    const formatter = activeMetric === 'runs'
      ? (entry) => `${entry.activityCount ?? 0} runs`
      : activeMetric === 'calories'
      ? (entry) => `${Math.round(entry.totalCalories ?? 0)} cal`
      : (entry) => `${(entry.totalDistanceMiles ?? 0).toFixed(1)} mi`;

    return leaderboard
      .map((entry) => ({
        ...entry,
        display: formatter(entry)
      }))
      .slice(0, 5);
  }, [leaderboard, activeMetric]);

  const persistCrew = useCallback((updater) => {
    setCrew((prevCrew) => {
      const nextCrew = typeof updater === 'function' ? updater(prevCrew) : updater;
      if (nextCrew) {
        LocalStorageAPI.setRunCrewData(nextCrew);
      }
      return nextCrew ?? prevCrew;
    });
  }, []);

  const refreshCrew = useCallback(async () => {
    if (!runCrewId || !athleteId) return;
    try {
      const { data } = await api.post('/runcrew/hydrate', { runCrewId, athleteId });
      if (data?.success && data.runCrew) {
        LocalStorageAPI.setRunCrewData(data.runCrew);
        setCrew(data.runCrew);
      }
    } catch (error) {
      console.error('Failed to refresh crew', error);
    }
  }, [runCrewId, athleteId]);

  // Auto-hydrate crew if not in localStorage
  useEffect(() => {
    if (!crew && runCrewId && athleteId) {
      console.log('⚠️ RUNCREW CENTRAL: No crew data, hydrating...');
      refreshCrew();
    }
  }, [crew, runCrewId, athleteId, refreshCrew]);

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    if (!crew || !runCrewId || !athleteId) return;
    const trimmed = messageContent.trim();
    if (!trimmed) return;

    const optimisticMessage = {
      id: `local-msg-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      athlete: athlete
        ? {
            id: athleteId,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            photoURL: athlete.photoURL
          }
        : null
    };

    persistCrew((prevCrew) => {
      if (!prevCrew) return prevCrew;
      const existingMessages = Array.isArray(prevCrew.messages) ? prevCrew.messages : [];
      return {
        ...prevCrew,
        messages: [...existingMessages, optimisticMessage]
      };
    });

    setMessageContent('');
    setIsSendingMessage(true);

    try {
      await api.post('/runcrew/messages', {
        runCrewId,
        message: trimmed
      });
      await refreshCrew();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!joinCode) return;
    const inviteText = `Join ${crew?.name || 'our crew'} on GoFast:\nhttps://athlete.gofastcrushgoals.com/runcrew/join\nCode: ${joinCode}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteText);
      } else {
        const temp = document.createElement('textarea');
        temp.value = inviteText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopyState('copied');
    } catch (error) {
      console.error('Clipboard copy failed', error);
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const nextRunId = nextRun?.id;
  const isGoing = useMemo(() => {
    if (!nextRun || !athleteId) return false;
    return (nextRun.rsvps || []).some((rsvp) => rsvp.athleteId === athleteId && rsvp.status === 'going');
  }, [nextRun, athleteId]);

  const handleRsvpToggle = async () => {
    if (!nextRun || !nextRunId || !runCrewId || !athleteId) return;

    const status = isGoing ? 'not-going' : 'going';
    const optimisticRsvps = () => {
      const existing = Array.isArray(nextRun.rsvps) ? nextRun.rsvps : [];
      if (isGoing) {
        return existing.filter((rsvp) => rsvp.athleteId !== athleteId);
      }
      const newEntry = {
        id: `local-rsvp-${Date.now()}`,
        athleteId,
        status: 'going',
        athlete: athlete
          ? {
              id: athleteId,
              firstName: athlete.firstName,
              lastName: athlete.lastName,
              photoURL: athlete.photoURL
            }
          : null
      };
      return [...existing.filter((rsvp) => rsvp.athleteId !== athleteId), newEntry];
    };

    persistCrew((prevCrew) => {
      if (!prevCrew) return prevCrew;
      const updatedRuns = (Array.isArray(prevCrew.runs) ? prevCrew.runs : []).map((run) =>
        run.id === nextRunId
          ? {
              ...run,
              rsvps: optimisticRsvps()
            }
          : run
      );
      return {
        ...prevCrew,
        runs: updatedRuns
      };
    });

    setIsRsvpUpdating(true);
    try {
      await api.post(`/runcrew/runs/${nextRunId}/rsvp`, { status });
      await refreshCrew();
    } catch (error) {
      console.error('Failed to update RSVP', error);
      await refreshCrew();
    } finally {
      setIsRsvpUpdating(false);
    }
  };

  // Loading state - show while hydrating
  if (!crew && runCrewId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your crew...</p>
        </div>
      </div>
    );
  }

  // No crew and no crewId - redirect to join/create
  if (!crew && !runCrewId) {
    navigate('/runcrew/join-or-start', { replace: true });
    return null;
  }

  // Fallback guard (should not reach here if above checks work)
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
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <button
                onClick={() => navigate('/athlete-home')}
                className="text-gray-600 hover:text-gray-900 mt-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Crew Icon/Logo */}
                  {crew.icon ? (
                    <span className="text-4xl">{crew.icon}</span>
                  ) : crew.logo ? (
                    <img 
                      src={crew.logo} 
                      alt={crew.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : null}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{crew.name || 'RunCrew'}</h1>
                    <p className="text-sm text-gray-500">{currentDate}</p>
                  </div>
                </div>
                {/* Crew Description */}
                {crew.description && (
                  <p className="text-base text-gray-700 mt-2 max-w-2xl">{crew.description}</p>
                )}
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => navigate('/athlete-home')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/runcrew-settings')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
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
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 text-xl">📢</span>
                  <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
                </div>
                {announcements.length > 3 && (
                  <button className="text-xs text-orange-600 font-semibold hover:underline">View all</button>
                )}
              </div>

              <div className="space-y-3">
                {announcements.length === 0 && (
                  <p className="text-sm text-gray-600">No announcements yet. Ask your captain to post the next meetup.</p>
                )}
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id || announcement.createdAt} className="border border-orange-200 rounded-lg px-4 py-3 bg-orange-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {announcement.title || 'Crew Update'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {announcement.createdAt
                          ? new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'just now'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{announcement.content || announcement.text}</p>
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
                  <div key={message.id || message.createdAt} className="flex gap-3">
                    {message.athlete?.photoURL || message.author?.photoURL ? (
                      <img
                        src={message.athlete?.photoURL || message.author?.photoURL}
                        alt={message.athlete?.firstName || message.author?.name || 'Crew member'}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {message.athlete?.firstName?.[0] || message.author?.name?.[0] || 'A'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {message.athlete?.firstName || message.author?.name || 'Crew Member'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{message.content || message.text}</p>
                      {message.reactions && (
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-400">Reactions coming soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleMessageSubmit} className="border-t border-gray-200 px-6 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(event) => setMessageContent(event.target.value)}
                    placeholder="Drop a note for the crew…"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageContent.trim() || isSendingMessage}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {isSendingMessage ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Next Run Card */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Next Run</h2>
              {nextRun ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">{nextRun.date ? new Date(nextRun.date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Scheduled'}</span>
                  </div>
                  <p className="text-sm text-gray-600">{nextRun.time || nextRun.startTime || 'Time TBD'}</p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{nextRun.meetUpPoint || 'Meetup TBD'}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">{(nextRun.rsvps?.filter(r => r.status === 'going').length || 0)} Going</p>
                    <div className="flex -space-x-2">
                      {nextRun.rsvps?.slice(0, 5).map((rsvp, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                          {rsvp.athlete?.firstName?.[0] || 'A'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleRsvpToggle}
                    disabled={isRsvpUpdating}
                    className={`w-full py-3 rounded-lg font-semibold mt-4 transition ${
                      isGoing
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRsvpUpdating ? 'Updating…' : isGoing ? "I'm Going" : 'Count Me In'}
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 text-center">
                  No upcoming runs — ping your captain to schedule the next meetup.
                </div>
              )}
            </section>

            {/* Who's Here */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Who's Here</h2>
              <div className="space-y-3">
                {memberships.slice(0, 6).map((membership) => {
                  const memberAthlete = membership.athlete || membership;
                  return (
                    <div key={membership.id || memberAthlete.id} className="flex items-center gap-3">
                      {memberAthlete.photoURL ? (
                        <img
                          src={memberAthlete.photoURL}
                          alt={memberAthlete.firstName || 'Crew member'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm relative">
                          {memberAthlete.firstName?.[0] || 'A'}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{memberAthlete.firstName || 'Athlete'} {memberAthlete.lastName || ''}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {memberships.length === 0 && (
                <p className="text-sm text-gray-500">No members yet — share your join code to build the crew.</p>
              )}
              {memberships.length > 6 && (
                <button className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                  View all {memberships.length} members
                </button>
              )}
              {memberships.length <= 1 && joinCode && (
                <div className="mt-4 border border-dashed border-orange-300 rounded-xl px-4 py-3 bg-orange-50/60 text-sm text-gray-700">
                  <p className="font-semibold text-orange-600 mb-1">Invite teammates:</p>
                  <code className="text-xs text-gray-600">
                    Join link: athlete.gofastcrushgoals.com/runcrew/join<br />
                    Code: {joinCode}
                  </code>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleCopyInvite}
                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Copy Invite
                    </button>
                    <span className="text-xs text-gray-500">
                      {copyState === 'copied' && 'Copied!'}
                      {copyState === 'error' && 'Copy failed'}
                      {copyState === 'idle' && 'Share with your crew'}
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Leaderboard */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex gap-2 mb-4">
                {['miles','runs','calories'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${activeMetric === metric ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {metric === 'miles' ? 'Miles' : metric === 'runs' ? 'Runs' : 'Cals'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {leaderboardEntries.length === 0 && (
                  <p className="text-sm text-gray-500">Leaderboard data syncs once your crew records activities.</p>
                )}
                {leaderboardEntries.map((entry, index) => (
                  <div key={entry.athleteId || index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm font-semibold text-gray-900">{entry.firstName || 'Athlete'}</p>
                    <p className="text-sm font-bold text-orange-600">{entry.display}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

