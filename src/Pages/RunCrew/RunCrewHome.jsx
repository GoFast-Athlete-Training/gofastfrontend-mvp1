import React from 'react';

export default function RunCrewHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome to your crew</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">Chat Area (TBD)</div>
          <div className="bg-white rounded-xl shadow p-6">Leaderboard (TBD)</div>
          <div className="bg-white rounded-xl shadow p-6">Performance (TBD)</div>
        </div>
      </div>
    </div>
  );
}


