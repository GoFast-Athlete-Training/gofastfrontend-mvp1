import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateCrew() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name || !inviteCode) return alert("All fields required.");
    setLoading(true);
    try {
      // Placeholder API; backend will be implemented later
      const res = await fetch("/api/crew/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, inviteCode })
      });
      await res.json();
      navigate("/runcrew-home");
    } catch (err) {
      console.error("Error creating crew", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <p className="text-gray-700 mb-6">
          Thanks for starting up a crew. Think of this as your Life360 circle.
          Create a name, a unique join code, and start running together.
        </p>

        <input
          className="w-full p-3 border rounded-lg mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Crew Name"
        />

        <input
          className="w-full p-3 border rounded-lg mb-4"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Crew Join Code"
        />

        <button
          className="w-full bg-black text-white py-3 rounded-lg font-bold"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Let's Go"}
        </button>
      </div>
    </div>
  );
}


