import React, { useState } from 'react';

export default function JoinCrew() {
  const [inviteCode, setInviteCode] = useState("");

  const handleJoin = async () => {
    // Placeholder API call; backend endpoints to be implemented later
    try {
      const res = await fetch("/api/crew/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });
      const data = await res.json();
      console.log(data);
      alert("Request sent! This will be wired to the backend soon.");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter your invite code</h2>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="e.g. FAST123"
        />
        <button onClick={handleJoin} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold">
          Join Crew
        </button>
      </div>
    </div>
  );
}


