import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function RunCrewCentral() {
  const navigate = useNavigate();
  const { id: crewIdFromUrl } = useParams();
  const [leaderboardType, setLeaderboardType] = useState('miles');
  const [messageInput, setMessageInput] = useState('');
  const [activeTopic, setActiveTopic] = useState('general');
  
  // State for crew data
  const [crew, setCrew] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for auto-scroll and input handling
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch crew data
  useEffect(() => {
    fetchCrewData();
  }, [crewIdFromUrl]);

  const fetchCrewData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get Firebase token
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to view your crew');
        navigate('/athlete-home');
        return;
      }
      const token = await user.getIdToken();
      
      let crewId = crewIdFromUrl;
      
      // If no ID in URL, try localStorage
      if (!crewId) {
        const currentCrew = JSON.parse(localStorage.getItem('currentCrew') || '{}');
        if (currentCrew.id) {
          crewId = currentCrew.id;
        }
      }
      
      // If still no ID, fetch user's first crew
      if (!crewId) {
        const mineRes = await fetch(`${API_BASE}/runcrew/mine`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!mineRes.ok) {
          throw new Error('Failed to fetch crews');
        }
        
        const mineData = await mineRes.json();
        if (mineData.success && mineData.runCrews && mineData.runCrews.length > 0) {
          crewId = mineData.runCrews[0].id;
        } else {
          // No crews found - redirect to create/join
          setError('No crews found. Create or join a crew to get started!');
          setLoading(false);
          return;
        }
      }
      
      // Fetch crew details
      const res = await fetch(`${API_BASE}/runcrew/${crewId}`, {
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
        // Store current crew for future reference
        localStorage.setItem('currentCrew', JSON.stringify({
          id: data.runCrew.id,
          name: data.runCrew.name,
          joinCode: data.runCrew.joinCode
        }));
      } else {
        throw new Error('Crew not found');
      }
    } catch (err) {
      console.error('Error fetching crew:', err);
      setError(err.message || 'Failed to load crew data');
    } finally {
      setLoading(false);
    }
  };

  // Get crew members from API data
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

  // Get leaderboard entries from API data
  const getLeaderboardData = (type) => {
    if (!crew?.leaderboardEntries) return [];
    
    // Filter by period (weekly, monthly, all-time)
    // For now, use all entries
    const entries = crew.leaderboardEntries.filter(entry => {
      // You can filter by period here if needed
      return true;
    });
    
    if (type === 'miles') {
      return entries
        .map(entry => ({
          rank: 0, // Will be set below
          athleteId: entry.athleteId,
          name: `${entry.athlete?.firstName || ''} ${entry.athlete?.lastName || ''}`.trim() || entry.athlete?.email || 'Unknown',
          value: entry.totalMiles || 0,
          runs: entry.totalRuns || 0,
          lastRun: entry.lastRunDate ? new Date(entry.lastRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
        }))
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }
    
    // Add other leaderboard types as needed
    return [];
  };

  const leaderboards = {
    miles: getLeaderboardData('miles'),
    bestSplit: [], // TODO: Calculate from activities
    calories: [] // TODO: Calculate from activities
  };

  // Get posts from API data and format them
  const formatPost = (post) => {
    const athlete = post.athlete;
    const firstName = athlete?.firstName || '';
    const lastName = athlete?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || athlete?.email || 'Unknown';
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
    
    // Format time ago
    const timeAgo = post.createdAt 
      ? formatTimeAgo(new Date(post.createdAt))
      : 'Recently';
    
    return {
      id: post.id,
      author: name,
      initials,
      avatar: athlete?.photoURL || null,
      message: post.content || '',
      time: timeAgo,
      reactions: [] // TODO: Add reactions from API
    };
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Topic-specific messages - use actual posts from API
  // For now, all posts go to general (topic filtering can be added later)
  const topicMessages = {
    general: posts.map(formatPost),
    tips: [], // TODO: Filter posts by topic
    social: [], // TODO: Filter posts by topic
    training: [], // TODO: Filter posts by topic
    goals: [], // TODO: Filter posts by topic
    food: [], // TODO: Filter posts by topic
    recovery: [] // TODO: Filter posts by topic
  };

  // Get messages for active topic
  const chatMessages = topicMessages[activeTopic] || topicMessages.general;

  // Auto-scroll to bottom when messages change or topic changes
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages.length, activeTopic]);

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // TODO: Send via Socket.io or API
    console.log('Sending message:', messageInput);
    
    // Clear input and focus
    setMessageInput('');
    inputRef.current?.focus();
    
    // Auto-scroll after sending
    setTimeout(() => {
      chatMessagesRef.current?.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Auto-focus input when keyboard opens (mobile)
  const handleInputFocus = () => {
    setTimeout(() => {
      chatMessagesRef.current?.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 300); // Wait for keyboard animation
  };

  // Check if current user is admin
  const isAdmin = crew?.isAdmin || false;
  const memberCount = crew?.memberCount || crewMembers.length;
  
  // Handle invite people - copy join code
  const handleInvitePeople = () => {
    const joinCode = crew?.joinCode || '';
    const inviteMessage = `Hi! I created a run crew on GoFast. Go to runcrewjoin.gofastcrushgoals.com, click "Join a Crew", and use this code: ${joinCode}`;
    navigator.clipboard.writeText(inviteMessage);
    alert('Invite message copied to clipboard!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your crew...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/runcrew/join')}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600"
            >
              Create or Join a Crew
            </button>
            <button
              onClick={() => navigate('/athlete-home')}
              className="w-full bg-white border-2 border-gray-300 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              Go to Athlete Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No crew data
  if (!crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Crew Found</h1>
          <p className="text-gray-600 mb-6">Create or join a crew to get started!</p>
          <button
            onClick={() => navigate('/runcrew/join')}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600"
          >
            Create or Join a Crew
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/athlete-home')} className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">GoFast</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/athlete-home')}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Athlete Home
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Athlete Settings
              </button>
              {isAdmin && (
                <button 
                  onClick={() => navigate('/runcrew-settings')}
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  RunCrew Settings
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crew Header - iMessage style */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3 mb-3">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {crewMembers.length > 0 ? (
                crewMembers.slice(0, 6).map((member) => (
                  <div key={member.id} className="relative">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {member.initials}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No members yet</div>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{crew.name || 'Unnamed Crew'}</h1>
          <p className="text-sm text-gray-500">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
        </div>
      </div>

      {/* Main Content - Chat Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Chat Feed (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-280px)] flex flex-col">
              {/* Announcements/Pinned (Admin Only) */}
              {isAdmin && (
                <div className="border-b border-orange-100 bg-orange-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-bold text-gray-900">Announcements</h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">Admin</span>
                    </div>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      + New Announcement
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm mb-1">📢 Group Run Tomorrow!</p>
                          <p className="text-sm text-gray-700">Meeting at 6am sharp at the trailhead. Bring water and good vibes! 🏃‍♀️💪</p>
                          <p className="text-xs text-gray-500 mt-1">Posted 2 hours ago</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 ml-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Topics Section - Slack-style channels */}
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Topics</h3>
                    <p className="text-xs text-gray-500">Organize conversations by topic</p>
                  </div>
                  <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                    + New Topic
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button className="px-3 py-2 bg-white border-2 border-orange-500 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>💬</span>
                      <span>General</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Hoot & holler</p>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>💡</span>
                      <span>Tips</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Training advice</p>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🎉</span>
                      <span>Social</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Hangouts & events</p>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🏃‍♀️</span>
                      <span>Training</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Runs & workouts</p>
                  </button>
                </div>
                {/* Additional topics row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🎯</span>
                      <span>Goals</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">PRs & milestones</p>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🍕</span>
                      <span>Food & Fuel</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Nutrition chat</p>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🏥</span>
                      <span>Injury & Recovery</span>
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Health support</p>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ 
                  WebkitOverflowScrolling: 'touch', // Smooth iOS scrolling
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Date separator */}
                <div className="text-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Today</span>
                </div>

                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden">
                        {msg.avatar ? (
                          <img src={msg.avatar} alt={msg.author} className="w-full h-full object-cover" />
                        ) : (
                          msg.initials
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{msg.author}</span>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <div className="relative inline-block">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-md">
                          <p className="text-gray-900 text-sm">{msg.message}</p>
                        </div>
                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1 ml-2">
                            {msg.reactions.map((reaction, idx) => (
                              <span key={idx} className="text-xs bg-white rounded-full px-2 py-0.5 border border-gray-200 flex items-center space-x-1">
                                <span>{reaction.emoji}</span>
                                <span className="text-gray-600">{reaction.count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input - iMessage style (Mobile Native UX) */}
              <div className="border-t border-gray-200 p-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
                <div className="flex items-end space-x-2">
                  <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      // Auto-resize (up to 4 lines)
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`; // max ~4 lines
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    placeholder="Text Message"
                    rows={1}
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-orange-500"
                    style={{
                      minHeight: '40px',
                      maxHeight: '96px',
                      lineHeight: '1.5',
                    }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Press Enter to send • Shift+Enter for new line</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Next Run */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-3">Next Run</h3>
              {/* TODO: Add events/RSVP functionality */}
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No upcoming runs scheduled</p>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/runcrew-central-admin')}
                    className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Create Event
                  </button>
                )}
              </div>
            </div>

            {/* Who's Here */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">Who's Here</h3>
              {crewMembers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-sm text-gray-600 mb-4">No members yet. Invite people to join your crew!</p>
                  <button
                    onClick={handleInvitePeople}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                  >
                    Invite People
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {crewMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="relative">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                              {member.initials}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {memberCount > crewMembers.length && (
                    <button className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium">
                      View all {memberCount} members
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">Leaderboard</h3>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setLeaderboardType('miles')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    leaderboardType === 'miles' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Miles
                </button>
                <button
                  onClick={() => setLeaderboardType('bestSplit')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    leaderboardType === 'bestSplit' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pace
                </button>
                <button
                  onClick={() => setLeaderboardType('calories')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    leaderboardType === 'calories' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cals
                </button>
              </div>
              {leaderboards[leaderboardType].length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No leaderboard data yet. Start running to see stats!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboards[leaderboardType].slice(0, 5).map((member, index) => (
                    <div 
                      key={member.athleteId || index} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' : 
                          index === 2 ? 'bg-orange-600 text-white' : 
                          'bg-gray-300 text-gray-700'
                        }`}>
                          {member.rank}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{member.name.split(' ')[0]}</p>
                      </div>
                      <p className="text-xs font-bold text-orange-600">
                        {leaderboardType === 'miles' && `${member.value.toFixed(1)}mi`}
                        {leaderboardType === 'bestSplit' && member.value}
                        {leaderboardType === 'calories' && `${member.value}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom App Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center space-y-1 text-orange-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.5L2 7v9c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-4.5z" />
              </svg>
              <span className="text-xs font-medium">Feed</span>
            </button>
            <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium">Members</span>
            </button>
            <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-xs font-medium">Leaderboard</span>
            </button>
            <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Events</span>
            </button>
            {isAdmin && (
              <button className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium">Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
}
