import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function RunCrewRunDetail() {
  const navigate = useNavigate();
  const { runId } = useParams();
  const [rsvpStatus, setRsvpStatus] = useState('going'); // 'going', 'maybe', 'not-going'

  // Mock run data
  const run = {
    id: runId || '1',
    title: 'Saturday Morning Group Run',
    date: 'Tomorrow',
    time: '6:00 AM',
    location: 'Trailhead Park',
    address: '123 Trailhead Road, San Francisco, CA',
    distance: '5-8 miles',
    pace: '8:00-9:00 min/mile',
    description: 'Starting at the main trailhead. We\'ll do an out-and-back along the coastal trail. Bring water and good vibes! Optional coffee after. ☕',
    organizer: 'Emma Rodriguez',
    organizerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    createdAt: '2 days ago',
    attendees: {
      going: [
        { id: 1, name: 'Emma Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
        { id: 2, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
        { id: 3, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
        { id: 4, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
        { id: 5, name: 'Maria Garcia', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' }
      ],
      maybe: [
        { id: 6, name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face' }
      ],
      notGoing: []
    }
  };

  const handleRSVP = (status) => {
    setRsvpStatus(status);
    // In real app, this would call API to update RSVP
    console.log('RSVP updated:', status);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/runcrew-central')} className="text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src="/logo.jpg" alt="GoFast" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-bold text-gray-900">Run Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Run Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{run.title}</h1>
          <div className="flex items-center space-x-3 text-sm text-gray-500 mb-4">
            <span>Created by {run.organizer}</span>
            <span>·</span>
            <span>{run.createdAt}</span>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{run.date}</p>
                <p className="text-sm text-gray-600">{run.time}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold text-gray-900">{run.location}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-semibold text-gray-900">{run.distance}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Pace</p>
                <p className="font-semibold text-gray-900">{run.pace}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">About This Run</h3>
            <p className="text-gray-700">{run.description}</p>
          </div>

          {/* RSVP Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">RSVP</h3>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => handleRSVP('going')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  rsvpStatus === 'going'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ Going
              </button>
              <button
                onClick={() => handleRSVP('maybe')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  rsvpStatus === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🤔 Maybe
              </button>
              <button
                onClick={() => handleRSVP('not-going')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  rsvpStatus === 'not-going'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❌ Can't Make It
              </button>
            </div>

            {/* Attendees */}
            <div className="space-y-4">
              {/* Going */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>✅</span>
                    <span>Going ({run.attendees.going.length})</span>
                  </h4>
                </div>
                <div className="flex -space-x-2 mb-2">
                  {run.attendees.going.map((attendee) => (
                    <img
                      key={attendee.id}
                      src={attendee.avatar}
                      alt={attendee.name}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      title={attendee.name}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  {run.attendees.going.map(a => a.name).join(', ')}
                </div>
              </div>

              {/* Maybe */}
              {run.attendees.maybe.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>🤔</span>
                      <span>Maybe ({run.attendees.maybe.length})</span>
                    </h4>
                  </div>
                  <div className="flex -space-x-2 mb-2">
                    {run.attendees.maybe.map((attendee) => (
                      <img
                        key={attendee.id}
                        src={attendee.avatar}
                        alt={attendee.name}
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        title={attendee.name}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {run.attendees.maybe.map(a => a.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
          <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
            <p className="text-gray-500">Map View</p>
          </div>
          <p className="text-sm text-gray-600">{run.address}</p>
        </div>

        {/* Related Chat */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Chat About This Run</h3>
            <button className="text-sm text-orange-600 hover:text-orange-700">
              View All Messages
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
              <img
                src={run.attendees.going[0].avatar}
                alt={run.attendees.going[0].name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{run.attendees.going[0].name}</p>
                <p className="text-sm text-gray-700">Can't wait for this one! See you all there 🏃‍♀️</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-20"></div>
    </div>
  );
}

