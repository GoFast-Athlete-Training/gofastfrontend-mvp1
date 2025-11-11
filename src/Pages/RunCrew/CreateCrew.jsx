import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { Users, Image, X } from 'lucide-react';

// Common running emojis for quick selection
const RUNNING_EMOJIS = [
  '🏃', '🏃‍♀️', '🏃‍♂️', '🏔️', '⛰️', '🌄', '🌅', '🌆',
  '🔥', '⚡', '💪', '🏆', '🎯', '🚀', '⭐', '🌟',
  '🌲', '🌳', '🌿', '🌊', '☀️', '🌙', '⭐', '💫',
  '👟', '🎽', '🏅', '🥇', '🥈', '🥉', '🎖️', '🏵️'
];

export default function CreateCrew() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const logoFileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    setError(null);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setLogoFile(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('profilePic', file); // Backend expects 'profilePic' field name

      const response = await fetch('https://gofastbackendv2-fall2025.onrender.com/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        // Full URL for the logo
        const fullUrl = `https://gofastbackendv2-fall2025.onrender.com${data.url}`;
        setLogo(fullUrl);
        // Clear icon if logo is set
        setIcon("");
      } else {
        throw new Error(data.error || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload logo. Please try again.');
      setLogoPreview(null);
      setLogoFile(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogo("");
    setLogoFile(null);
    setLogoPreview(null);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    setIcon(emoji);
    setShowEmojiPicker(false);
    // Clear logo if icon is selected
    if (logo) {
      handleRemoveLogo();
    }
  };

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
          logo: logo || null,
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
              Logo or Icon <span className="text-gray-400 text-xs">(Optional - Choose One)</span>
            </label>
            
            {/* Logo Upload Section */}
            <div className="mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-20 h-20 bg-gray-50 border-2 border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={uploadingLogo || loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : logo ? (
                    <>
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={uploadingLogo || loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploadingLogo || loading || !!icon}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-sky-500 transition text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo || loading || !!icon}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload a logo image (JPG, PNG - max 5MB)</p>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Icon/Emoji Section */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-20 h-20 bg-gray-50 border-2 border-gray-300 rounded-lg flex items-center justify-center text-4xl">
                  {icon || '🏃'}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      if (logo) handleRemoveLogo();
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-sky-500 transition text-sm font-medium text-gray-700 disabled:opacity-50"
                  >
                    {showEmojiPicker ? 'Hide Emoji Picker' : 'Choose Emoji'}
                  </button>
                </div>
              </div>
              
              {showEmojiPicker && (
                <div className="mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Select an emoji:</p>
                  <div className="grid grid-cols-8 gap-2">
                    {RUNNING_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-10 h-10 text-2xl hover:bg-white hover:scale-110 rounded transition cursor-pointer flex items-center justify-center"
                        disabled={loading}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Or type your own emoji below:</p>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => {
                      setIcon(e.target.value);
                      setError(null);
                      if (logo) handleRemoveLogo();
                    }}
                    className="w-full mt-2 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-2xl text-center"
                    placeholder="🏃"
                    maxLength={2}
                    disabled={loading}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Choose an emoji icon for your crew</p>
            </div>
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


