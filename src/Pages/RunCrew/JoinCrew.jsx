import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

export default function JoinCrew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [previewCrew, setPreviewCrew] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Check for join code in URL params (future: direct link join)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase().trim());
    }
  }, [searchParams]);

  // Validate join code format (client-side check)
  const validateJoinCode = (code) => {
    const normalized = code.toUpperCase().trim();
    if (!normalized || normalized.length < 3) {
      return { valid: false, message: 'Join code must be at least 3 characters' };
    }
    if (normalized.length > 20) {
      return { valid: false, message: 'Join code must be 20 characters or less' };
    }
    // Allow alphanumeric and some special chars
    if (!/^[A-Z0-9-_]+$/.test(normalized)) {
      return { valid: false, message: 'Join code can only contain letters, numbers, hyphens, and underscores' };
    }
    return { valid: true, normalized };
  };

  // Preview crew by join code (hydrate before joining)
  const previewCrewByCode = async (code) => {
    const validation = validateJoinCode(code);
    if (!validation.valid) {
      setError(validation.message);
      setPreviewCrew(null);
      setShowPreview(false);
      return;
    }

    try {
      setIsValidating(true);
      setError(null);

      const res = await fetch(`${API_BASE}/runcrew/preview/${validation.normalized}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'RunCrew not found');
      }

      const data = await res.json();
      if (data.success && data.runCrew) {
        setPreviewCrew(data.runCrew);
        setShowPreview(true);
      } else {
        throw new Error('Invalid join code');
      }
    } catch (err) {
      console.error('Error previewing crew:', err);
      setError(err.message || 'RunCrew not found. Please check the code and try again.');
      setPreviewCrew(null);
      setShowPreview(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoin = async () => {
    // Clear previous errors
    setError(null);

    // Client-side validation
    const validation = validateJoinCode(joinCode);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Get athleteId from localStorage (hydrated on signin/signup/welcome)
    const athleteId = localStorage.getItem('athleteId');
    if (!athleteId) {
      setError('Please sign in again');
      navigate('/athlete-home');
      return;
    }

    setLoading(true);
    try {
      // Get Firebase token for auth
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in again');
        navigate('/athlete-home');
        return;
      }
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE}/runcrew/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          joinCode: validation.normalized,
          athleteId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to join crew');
      }

      if (data.success) {
        // Save RunCrew to localStorage
        if (data.runCrew) {
          const myCrews = JSON.parse(localStorage.getItem('myCrews') || '[]');
          const updatedCrews = [...myCrews, data.runCrew];
          localStorage.setItem('myCrews', JSON.stringify(updatedCrews));
        }

        // Navigate to RunCrew Central
        const isAdmin = data.runCrew?.runcrewAdminId === athleteId;
        if (isAdmin) {
          navigate(`/runcrew/admin/${data.runCrew.id}`);
        } else {
          navigate(`/runcrew/${data.runCrew.id}`);
        }
      } else {
        throw new Error(data.message || 'Failed to join crew');
      }
    } catch (err) {
      console.error('Error joining crew:', err);
      setError(err.message || 'Failed to join crew. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;
    setJoinCode(value);
    setError(null); // Clear error when user types
    setPreviewCrew(null); // Clear preview when code changes
    setShowPreview(false);
  };

  const handlePreview = () => {
    if (joinCode.trim()) {
      previewCrewByCode(joinCode);
    }
  };

  const handleConfirmJoin = () => {
    // User confirmed - proceed with join
    handleJoin();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/runcrew/join')} className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="GoFast" className="w-6 h-6 rounded-full" />
              <span className="font-bold text-gray-900">GoFast</span>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Your Invite Code</h2>
          <p className="text-gray-600">Get the code from your RunCrew admin</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={handleCodeChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && joinCode.trim() && !showPreview) {
                  handlePreview();
                }
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g. FAST123"
              disabled={loading || isValidating}
              maxLength={20}
            />
            {isValidating && (
              <p className="text-sm text-gray-500 mt-2">Checking code...</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Enter the join code provided by your RunCrew admin
            </p>
          </div>

          {/* Preview Crew Card */}
          {showPreview && previewCrew && (
            <div className="bg-white border-2 border-orange-200 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Preview RunCrew</h3>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewCrew(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{previewCrew.name}</h4>
                  {previewCrew.description && (
                    <p className="text-gray-600 mt-1">{previewCrew.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{previewCrew.memberCount} members</span>
                  </div>
                  {previewCrew.admin && (
                    <div className="flex items-center space-x-2">
                      <span>Admin: {previewCrew.admin.firstName} {previewCrew.admin.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!showPreview ? (
            <button
              onClick={handlePreview}
              disabled={loading || !joinCode.trim() || isValidating}
              className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? 'Checking...' : 'Preview Crew'}
            </button>
          ) : (
            <button
              onClick={handleConfirmJoin}
              disabled={loading || isValidating}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Joining...' : 'Yes, Join This Crew'}
            </button>
          )}

          <button
            onClick={() => navigate('/runcrew/join')}
            className="w-full text-gray-600 py-2 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}


