import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { Users } from 'lucide-react';

export default function CreateCrew() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [description, setDescription] = useState("");
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
          <p className="text-gray-600">
            Start a running community. Invite friends, schedule runs, and stay accountable together.
          </p>
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
              placeholder="e.g. Morning Warriors, Trail Runners, etc."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Choose a name that represents your crew</p>
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
            <p className="text-xs text-gray-500 mt-1">
              Create a unique code (3-20 characters, letters/numbers only). Members will use this to join.
            </p>
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
              placeholder="Tell people what your crew is about... (optional)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Add a brief description to help people understand your crew</p>
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


