import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

export default function CreateCrew() {
  // Pre-fill with default values for quick testing
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    // DEMO MODE: Skip validation if fields are pre-filled
    if (!name?.trim() || !inviteCode?.trim()) {
      return alert("All fields required.");
    }
    
    // DEMO MODE: For demo purposes, skip API call and just navigate
    const isDemo = localStorage.getItem('demoMode') === 'true' || !localStorage.getItem('athleteId');
    if (isDemo) {
      console.log('🎭 DEMO MODE: Skipping API call, navigating to success page');
      // Store demo crew data for success page
      localStorage.setItem('currentCrew', JSON.stringify({
        name: name,
        joinCode: inviteCode,
        crewCode: inviteCode
      }));
      navigate("/run-crew-success");
      return;
    }
    
    // Get athleteId from localStorage (hydrated on AthleteHome)
    const athleteId = localStorage.getItem('athleteId');
    if (!athleteId) {
      alert('Please sign in again');
      navigate('/athlete-home');
      return;
    }
    
    setLoading(true);
    try {
      // Get Firebase token for auth
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in again');
        navigate('/athlete-home');
        return;
      }
      const token = await user.getIdToken();
      
      const res = await fetch("https://gofastbackendv2-fall2025.onrender.com/api/runcrew/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          joinCode: inviteCode,
          athleteId 
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        console.log('✅ RunCrew created:', data.runCrew);
        // Store crew data for success page
        localStorage.setItem('currentCrew', JSON.stringify({
          id: data.runCrew.id,
          name: data.runCrew.name,
          joinCode: data.runCrew.joinCode,
          description: data.runCrew.description
        }));
        // Navigate to success page first, then user can go to central
        navigate("/run-crew-success");
      } else {
        alert(data.message || data.error || "Failed to create crew");
      }
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


