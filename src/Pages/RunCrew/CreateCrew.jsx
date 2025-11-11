import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { Users } from 'lucide-react';

export default function CreateCrew() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    setError(null);
    
    // Validation
    if (!name?.trim()) {
      setError("Crew name is required");
      return;
    }
    
    if (!inviteCode?.trim()) {
      setError("Join code is required");
      return;
    }
    
    // Validate join code format
    const normalizedCode = inviteCode.toUpperCase().trim();
    if (normalizedCode.length < 3) {
      setError("Join code must be at least 3 characters");
      return;
    }
    if (normalizedCode.length > 20) {
      setError("Join code must be 20 characters or less");
      return;
    }
    if (!/^[A-Z0-9-_]+$/.test(normalizedCode)) {
      setError("Join code can only contain letters, numbers, hyphens, and underscores");
      return;
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
          name: name.trim(), 
          joinCode: normalizedCode,
          description: description.trim() || null,
          icon: icon.trim() || null,
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
        setError(data.message || data.error || "Failed to create crew");
      }
    } catch (err) {
      console.error("Error creating crew", err);
      setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your RunCrew</h1>
          <p className="text-gray-600 mb-3">
            This is your crew — your friends, your accountability partners, your running family.
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-left">
            <p className="text-sm text-sky-800 font-medium mb-1">💡 Make it fun and memorable!</p>
            <p className="text-xs text-sky-700">
              Choose a name and icon that your crew will remember. This is how you'll recognize each other and build your running community.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Crew Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              placeholder="e.g. Morning Warriors, Trail Runners, Weekend Warriors"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Pick something your crew will remember and get excited about</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Icon (Emoji) <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gray-50 border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl">
                {icon || '🏃'}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => {
                  setIcon(e.target.value);
                  setError(null);
                }}
                className="flex-1 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-2xl"
                placeholder="🏃 or 🏔️"
                maxLength={2}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Add an emoji that represents your crew (1-2 characters)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              rows={3}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
              placeholder="What makes your crew special? What are your goals? (optional)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Help your crew understand what you're all about</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Join Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              placeholder="FAST123"
              maxLength={20}
              disabled={loading}
            />
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">🔑 What is a Join Code?</p>
              <p className="text-xs text-blue-800">
                This is how your friends will join your crew. Share this code with them, and they can enter it to join. 
                Make it something easy to remember — like your crew name initials or a fun word!
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              3-20 characters, letters and numbers only (no spaces)
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !inviteCode.trim()}
            className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold py-4 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Crew...
              </span>
            ) : (
              "Create RunCrew"
            )}
          </button>

          <button
            onClick={() => navigate('/athlete-home')}
            className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
            disabled={loading}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}


