import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * RunCrewCentralAdmin - Admin View
 * Simplified version - no hydration for now
 * Per RunCrewArchitecture.md: Admin view for RunCrew management
 */
export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showEventForm, setShowEventForm] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState('miles');
  const [messageInput, setMessageInput] = useState('');
  const [activeTopic, setActiveTopic] = useState('general');

  // Event creation form state
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    address: '',
    distance: '',
    pace: '',
    description: '',
    stravaRouteId: null // Optional: link to Strava route
  });

  // Mock crew data for now (no API calls)
  const crew = { name: 'RunCrew', memberCount: 0 };
  const crewMembers = [];

  // Upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: '1',
      title: 'Saturday Morning Group Run',
      date: '2024-12-21',
      time: '6:00 AM',
      location: 'Trailhead Park',
      distance: '5-8 miles',
      attendees: 5
    }
  ]);

  // Topic-specific messages (same as RunCrewCentral)
  const topicMessages = {
    general: [
      { 
        id: 1, 
        author: 'Emma Rodriguez', 
        initials: 'ER',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 
        message: 'Just crushed a 5.2 mile run! Who else is feeling the Friday energy? 💪', 
        time: '2 hours ago',
        reactions: [{ emoji: '❤️', count: 5 }, { emoji: '🔥', count: 3 }]
      }
    ]
  };

  const chatMessages = topicMessages[activeTopic] || topicMessages.general;

  const leaderboards = {
    miles: [
      { rank: 1, name: 'Emma Rodriguez', value: 52.1, runs: 9, lastRun: 'Dec 15' },
      { rank: 2, name: 'Sarah Johnson', value: 45.2, runs: 8, lastRun: 'Dec 14' }
    ],
    bestSplit: [
      { rank: 1, name: 'Sarah Johnson', value: '6:25', runs: 8, lastRun: 'Dec 14' },
      { rank: 2, name: 'Mike Chen', value: '6:42', runs: 7, lastRun: 'Dec 13' }
    ],
    calories: [
      { rank: 1, name: 'Emma Rodriguez', value: 3120, runs: 9, lastRun: 'Dec 15' },
      { rank: 2, name: 'Sarah Johnson', value: 2780, runs: 8, lastRun: 'Dec 14' }
    ]
  };

  const handleCreateEvent = async () => {
    // TODO: Call API to create event
    // POST /api/runcrew/:crewId/events
    const newEvent = {
      id: Date.now().toString(),
      ...eventForm,
      attendees: 0
    };
    setUpcomingEvents([...upcomingEvents, newEvent]);
    setShowEventForm(false);
    setEventForm({
      title: '',
      date: '',
      time: '',
      location: '',
      address: '',
      distance: '',
      pace: '',
      description: '',
      stravaRouteId: null
    });
  };

  const handleLinkStravaRoute = () => {
    // TODO: Open Strava route selector modal
    // Show user's past activities with routes
    // Allow selection of a route to link
    alert('Strava route linking - coming soon!');
  };


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
                onClick={() => navigate(`/runcrew/${id}`)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                See as Member
              </button>
              <button 
                onClick={() => navigate(`/runcrew-settings/${id}`)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-orange-800">Admin Mode - You can create events and manage the crew</span>
          </div>
        </div>
      </div>

      {/* Crew Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
            {crewMembers.length > 0 && (
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex -space-x-2">
                  {crewMembers.slice(0, 6).map((member) => (
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
                  ))}
                </div>
              </div>
            )}
          <h1 className="text-2xl font-bold text-gray-900">{crew?.name || 'RunCrew'}</h1>
          <p className="text-sm text-gray-500">{crewMembers.length} members</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Chat Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-350px)] flex flex-col">
              {/* Admin Quick Actions */}
              <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Admin Actions</h3>
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{showEventForm ? 'Cancel' : 'Create Event'}</span>
                  </button>
                </div>

                {/* Inline Event Creation Form */}
                {showEventForm && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
                    <h4 className="font-semibold text-gray-900">New Run Event</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Event Title"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Location (e.g., Trailhead Park)"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Distance (e.g., 5-8 miles)"
                        value={eventForm.distance}
                        onChange={(e) => setEventForm({...eventForm, distance: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Pace (e.g., 8:00-9:00 min/mile)"
                        value={eventForm.pace}
                        onChange={(e) => setEventForm({...eventForm, pace: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <textarea
                      placeholder="Description (optional)"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    {/* Strava Route Link */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Link Strava Route</p>
                        <p className="text-xs text-gray-500">Use a route from a past activity</p>
                      </div>
                      <button
                        onClick={handleLinkStravaRoute}
                        className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Select Route
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateEvent}
                        disabled={!eventForm.title || !eventForm.date || !eventForm.time}
                        className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Create Event
                      </button>
                      <button
                        onClick={() => setShowEventForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Upcoming Events List */}
                {!showEventForm && upcomingEvents.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-gray-600 font-medium">Upcoming Events:</p>
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date} at {event.time} · {event.attendees} going</p>
                        </div>
                        <button
                          onClick={() => navigate(`/runcrew-run-detail/${event.id}`)}
                          className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Topics Section */}
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
                  <button className="px-3 py-2 bg-white border-2 border-orange-500 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50">
                    💬 General
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    💡 Tips
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    🎉 Social
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    🏃‍♀️ Training
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-md">
                        <p className="text-gray-900 text-sm">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Text Message"
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Same as RunCrewCentral */}
          <div className="space-y-6">
            {/* Next Run */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-3">Next Run</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">{upcomingEvents[0].date}</p>
                      <p className="text-sm text-gray-600">{upcomingEvents[0].time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-600">{upcomingEvents[0].location}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming runs</p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">Leaderboard</h3>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setLeaderboardType('miles')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${leaderboardType === 'miles' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Miles
                </button>
                <button
                  onClick={() => setLeaderboardType('bestSplit')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${leaderboardType === 'bestSplit' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Pace
                </button>
                <button
                  onClick={() => setLeaderboardType('calories')}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${leaderboardType === 'calories' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Cals
                </button>
              </div>
              <div className="space-y-2">
                {leaderboards[leaderboardType].slice(0, 5).map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{member.name.split(' ')[0]}</p>
                    </div>
                    <p className="text-xs font-bold text-orange-600">
                      {leaderboardType === 'miles' && `${member.value}mi`}
                      {leaderboardType === 'bestSplit' && member.value}
                      {leaderboardType === 'calories' && `${member.value}`}
                    </p>
                  </div>
                ))}
              </div>
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
            <button className="flex flex-col items-center space-y-1 text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="h-20"></div>
    </div>
  );
}

