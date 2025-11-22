import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copyState, setCopyState] = useState('idle');
  const [isRsvpUpdating, setIsRsvpUpdating] = useState(false);
  const messagesEndRef = useRef(null);
  const hydrationAttemptedRef = useRef(false);

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

  // Stable leaderboard calculation - prevent hydration chaos when switching metrics
  const leaderboardEntries = useMemo(() => {
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) return [];
    
    // Handle both data structures: API format (totalMiles, totalRuns) and hydration format (totalDistanceMiles, activityCount)
    const formatter = activeMetric === 'runs'
      ? (entry) => `${entry.totalRuns ?? entry.activityCount ?? 0} runs`
      : activeMetric === 'calories'
      ? (entry) => `${Math.round(entry.totalCalories ?? 0)} cal`
      : (entry) => `${(entry.totalMiles ?? entry.totalDistanceMiles ?? 0).toFixed(1)} mi`;

    // Sort by active metric (descending) - create stable sorted array
    const sorted = [...leaderboard].sort((a, b) => {
      if (activeMetric === 'runs') {
        const aRuns = a.totalRuns ?? a.activityCount ?? 0;
        const bRuns = b.totalRuns ?? b.activityCount ?? 0;
        return bRuns - aRuns;
      } else if (activeMetric === 'calories') {
        return (b.totalCalories ?? 0) - (a.totalCalories ?? 0);
      } else {
        const aMiles = a.totalMiles ?? a.totalDistanceMiles ?? 0;
        const bMiles = b.totalMiles ?? b.totalDistanceMiles ?? 0;
        return bMiles - aMiles;
      }
    });

    // Return stable array - only recalculate when leaderboard data or metric actually changes
    return sorted
      .map((entry) => ({
        ...entry,
        display: formatter(entry)
      }))
      .slice(0, 5);
  }, [leaderboard, activeMetric]);

  // Check if user is an admin or manager
  const isAdmin = useMemo(() => {
    if (!crew || !athleteId) return false;
    
    // Check if user is the crew admin
    if (crew.runcrewAdminId === athleteId) return true;
    
    // Check if user is a manager with admin role
    if (Array.isArray(crew.managers)) {
      return crew.managers.some(
        (manager) => manager.athleteId === athleteId && manager.role === 'admin'
      );
    }
    
    return false;
  }, [crew, athleteId]);

  const persistCrew = useCallback((updater) => {
    setCrew((prevCrew) => {
      const nextCrew = typeof updater === 'function' ? updater(prevCrew) : updater;
      if (nextCrew) {
        LocalStorageAPI.setRunCrewData(nextCrew);
      }
      return nextCrew ?? prevCrew;
    });
  }, []);

  // Track if hydration is in progress to prevent concurrent calls
  const hydrationInProgressRef = useRef(false);

  const refreshCrew = useCallback(async () => {
    if (!runCrewId || !athleteId) {
      console.warn('⚠️ RUNCREW CENTRAL: Missing runCrewId or athleteId for hydration');
      return null;
    }
    
    // Prevent concurrent hydration calls (FIX: Prevent hydrate chaos)
    if (hydrationInProgressRef.current) {
      console.log('⏸️ RUNCREW CENTRAL: Hydration already in progress, skipping...');
      return null;
    }
    
    hydrationInProgressRef.current = true;
    setIsHydrating(true);
    setHydrationError(null);
    
    try {
      console.log('🔄 RUNCREW CENTRAL: Hydrating crew...', { runCrewId, athleteId });
      const { data } = await api.post('/runcrew/hydrate', { runCrewId, athleteId });
      
      if (data?.success && data.runCrew) {
        console.log('✅ RUNCREW CENTRAL: Crew hydrated successfully');
        LocalStorageAPI.setRunCrewData(data.runCrew);
        setCrew(data.runCrew);
        setHydrationError(null);
        return data.runCrew;
      } else {
        throw new Error(data?.error || data?.message || 'Failed to hydrate crew');
      }
    } catch (error) {
      console.error('❌ RUNCREW CENTRAL: Failed to hydrate crew', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load crew data';
      setHydrationError(errorMessage);
      return null;
    } finally {
      setIsHydrating(false);
      hydrationInProgressRef.current = false;
    }
  }, [runCrewId, athleteId]);

  // Auto-hydrate crew on mount if not in localStorage (FINAL BOSS FIX)
  // Only run once on mount - don't re-run when crew or other state changes
  useEffect(() => {
    // Only hydrate if we have runCrewId and athleteId but no crew data, and haven't attempted yet
    if (runCrewId && athleteId && !crew && !isHydrating && !hydrationAttemptedRef.current) {
      console.log('🚀 RUNCREW CENTRAL: Auto-hydrating on mount...', { runCrewId, athleteId });
      hydrationAttemptedRef.current = true;
      refreshCrew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - prevent re-hydration when state changes
  
  // CRITICAL: Prevent any re-hydration when activeMetric changes
  // This ensures metric switching is purely UI-only, no backend calls
  useEffect(() => {
    // This effect does nothing - it's just here to ensure activeMetric changes
    // don't trigger any side effects. The empty dependency array on hydration
    // useEffect above should prevent it, but this is an extra guard.
    // DO NOT add any logic here that calls refreshCrew or any API!
  }, [activeMetric]); // Track metric changes but do nothing

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!runCrewId || !athleteId) return;

    const pollMessages = async () => {
      try {
        const { data } = await api.get(`/runcrew/${runCrewId}/messages`);
        if (data?.success && Array.isArray(data.data)) {
          const newMessages = data.data;
          // Get current messages from state to compare and update both state and localStorage
          persistCrew((prevCrew) => {
            if (!prevCrew) return prevCrew;
            const currentMessageIds = new Set((prevCrew.messages || []).map((m) => m.id));
            const hasNewMessages = newMessages.some((msg) => !currentMessageIds.has(msg.id));

            if (hasNewMessages) {
              return {
                ...prevCrew,
                messages: newMessages
              };
            }
            return prevCrew;
          });
        }
      } catch (error) {
        console.error('Failed to poll messages', error);
      }
    };

    // Poll immediately, then every 5 seconds
    pollMessages();
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [runCrewId, athleteId, persistCrew]);

  // Format timestamp helper
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return 'now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
      // Fixed: Use runCrewId in URL path and 'content' in body (not 'message')
      await api.post(`/runcrew/${runCrewId}/messages`, {
        content: trimmed
      });
      await refreshCrew();
    } catch (error) {
      console.error('Failed to send message', error);
      // Revert optimistic update on error
      persistCrew((prevCrew) => {
        if (!prevCrew) return prevCrew;
        const existingMessages = Array.isArray(prevCrew.messages) ? prevCrew.messages : [];
        return {
          ...prevCrew,
          messages: existingMessages.filter((msg) => msg.id !== optimisticMessage.id)
        };
      });
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

  // Loading state - show while hydrating (FINAL BOSS: Proper loading state)
  if ((!crew && runCrewId && athleteId) || isHydrating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your crew...</p>
          {isHydrating && (
            <p className="text-sm text-gray-500 mt-2">Hydrating crew data...</p>
          )}
        </div>
      </div>
    );
  }

  // Error state - show if hydration failed
  if (hydrationError && !crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Crew</h2>
          <p className="text-gray-600 mb-6">{hydrationError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setHydrationError(null);
                refreshCrew();
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/athlete-home')}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Athlete Dashboard
            </button>
          </div>
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
            className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Athlete Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Banner - Show if user is admin viewing member experience */}
      {isAdmin && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-sm text-orange-800 font-medium">
                You're viewing the member experience
              </p>
            </div>
            <button
              onClick={() => navigate('/crew/crewadmin')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Admin Dashboard
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <button
                onClick={() => navigate('/athlete-home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mt-1 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                title="Go to Athlete Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">Athlete Dashboard</span>
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Athlete Dashboard
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

            {/* Crew Feed/Chat - WhatsApp Style */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col" style={{ height: '700px' }}>
              <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Crew Chat</h2>
                  <span className="text-xs text-gray-500">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
                </div>
              </div>

              {/* Messages Feed - WhatsApp Style Bubbles */}
              <div className="flex-1 px-4 py-4 overflow-y-auto bg-gray-50" style={{ maxHeight: '600px' }}>
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOwnMessage = message.athlete?.id === athleteId || message.author?.id === athleteId;
                    const displayName = message.athlete?.firstName || message.author?.name || 'Crew Member';
                    const displayPhoto = message.athlete?.photoURL || message.author?.photoURL;
                    const initials = displayName?.[0] || 'A';

                    return (
                      <div
                        key={message.id || message.createdAt}
                        className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        {!isOwnMessage && (
                          <div className="flex-shrink-0">
                            {displayPhoto ? (
                              <img
                                src={displayPhoto}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                                {initials}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          {!isOwnMessage && (
                            <span className="text-xs font-semibold text-gray-700 mb-1 px-1">{displayName}</span>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-orange-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content || message.text}</p>
                          </div>
                          <span className="text-xs text-gray-400 mt-1 px-1">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Fixed at Bottom */}
              <form onSubmit={handleMessageSubmit} className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(event) => setMessageContent(event.target.value)}
                      placeholder="Type a message..."
                      className="w-full border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleMessageSubmit(e);
                        }
                      }}
                    />
                    {messageContent.trim() && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {messageContent.length}/2000
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!messageContent.trim() || isSendingMessage}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition min-w-[44px] flex items-center justify-center"
                    title="Send message"
                  >
                    {isSendingMessage ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Prevent hydration chaos - just update metric, no side effects
                      setActiveMetric(metric);
                    }}
                    disabled={isHydrating}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                      activeMetric === metric 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    } ${isHydrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {metric === 'miles' ? 'Miles' : metric === 'runs' ? 'Runs' : 'Cals'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {leaderboardEntries.length === 0 && (
                  <p className="text-sm text-gray-500">Leaderboard data syncs once your crew records activities.</p>
                )}
                {leaderboardEntries.map((entry, index) => {
                  const athlete = entry.athlete || {};
                  const firstName = athlete.firstName || entry.firstName || 'Athlete';
                  const lastName = athlete.lastName || entry.lastName || '';
                  const photoURL = athlete.photoURL || entry.photoURL;
                  
                  return (
                    <div key={entry.athlete?.id || entry.athleteId || index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      {photoURL ? (
                        <img
                          src={photoURL}
                          alt={`${firstName} ${lastName}`}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-xs">
                          {firstName[0]?.toUpperCase() || 'A'}
                        </div>
                      )}
                      <p className="flex-1 text-sm font-semibold text-gray-900">{firstName} {lastName}</p>
                      <p className="text-sm font-bold text-orange-600">{entry.display}</p>
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

