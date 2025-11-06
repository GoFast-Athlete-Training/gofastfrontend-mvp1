import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import api from '../../api/axiosConfig';

const AthleteCreateProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthday: '',
    gender: '',
    city: '',
    state: '',
    primarySport: '',
    gofastHandle: '',
    bio: '',
    instagram: '',
    profilePhoto: null,
    profilePhotoPreview: null
  });

  // Load existing profile data and Firebase photo when editing
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        // Check if we're editing an existing profile
        const storedProfile = localStorage.getItem('athleteProfile');
        const firebaseUser = auth.currentUser;
        
        let existingData = {};
        
        // Load from stored profile if editing
        if (storedProfile) {
          const athlete = JSON.parse(storedProfile);
          existingData = {
            firstName: athlete.firstName || '',
            lastName: athlete.lastName || '',
            phoneNumber: athlete.phoneNumber || '',
            birthday: athlete.birthday || '',
            gender: athlete.gender || '',
            city: athlete.city || '',
            state: athlete.state || '',
            primarySport: athlete.primarySport || '',
            gofastHandle: athlete.gofastHandle || '',
            bio: athlete.bio || '',
            instagram: athlete.instagram || ''
          };
          
          // Load photo from Firebase or stored profile
          if (athlete.photoURL) {
            existingData.profilePhotoPreview = athlete.photoURL;
          } else if (firebaseUser?.photoURL) {
            existingData.profilePhotoPreview = firebaseUser.photoURL;
          }
        } else if (firebaseUser?.photoURL) {
          // New profile but has Firebase photo
          existingData.profilePhotoPreview = firebaseUser.photoURL;
        }
        
        // Pre-fill with existing data or test data
        const defaultData = storedProfile ? existingData : {
          firstName: 'Adam',
          lastName: 'Cole',
          phoneNumber: '',
          gofastHandle: 'adamgofast',
          birthday: '1990-01-15',
          gender: 'male',
          city: 'Arlington',
          state: 'VA',
          primarySport: 'running',
          bio: 'Passionate runner. Building communities.',
          instagram: ''
        };
        
        setFormData(prev => ({
          ...prev,
          ...defaultData
        }));
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadExistingProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        profilePhoto: file,
        profilePhotoPreview: previewUrl
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 SUBMIT: Starting profile creation...');
    console.log('📝 Form data:', formData);
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.gofastHandle || !formData.birthday || !formData.gender || !formData.city || !formData.state || !formData.primarySport) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Verify user is logged in (axios will auto-add token)
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        alert('No user logged in. Please sign in first.');
        navigate('/athletesignin');
        return;
      }
      
      // Step 1: Find or create athlete - axios automatically sends Firebase token
      console.log('🌐 Step 1: Finding/creating athlete via /api/athlete/create');
      console.log('🔐 Axios automatically adds Firebase token (no body needed)');
      
      const res = await api.post('/athlete/create');
      const athleteData = res.data;
      console.log('✅ Step 1 - Athlete created/found:', athleteData);
      
      // Get athlete ID from response (could be athleteId or data.id)
      const athleteId = athleteData.athleteId || athleteData.data?.id;
      if (!athleteId) {
        throw new Error('No athlete ID returned from server');
      }
      
      // Step 2: Update athlete with full profile - axios automatically sends Firebase token
      console.log('🌐 Step 2: Updating profile via /api/athlete/:id/profile');
      
      const photoURL = firebaseUser.photoURL || formData.profilePhotoPreview;
      
      const profileRes = await api.put(`/athlete/${athleteId}/profile`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        gofastHandle: formData.gofastHandle,
        birthday: formData.birthday,
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        primarySport: formData.primarySport,
        bio: formData.bio,
        instagram: formData.instagram,
        photoURL: photoURL
      });
      
      const profileData = profileRes.data;
      console.log('✅ Step 2 - Profile updated:', profileData);
      
      // Store athlete data
      localStorage.setItem('athleteId', athleteId);
      localStorage.setItem('athleteProfile', JSON.stringify(profileData.athlete));

      // Navigate to athlete home after profile setup
      console.log('🏠 Navigating to athlete home...');
      navigate('/athlete-home');
      
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        if (errorData.field === 'gofastHandle') {
          alert(`❌ Handle taken!\n\n"@${formData.gofastHandle}" is already taken. Please choose a different handle.`);
        } else {
          alert(`❌ Profile update failed:\n\n${errorData.message || errorData.error}`);
        }
      } else if (error.response?.status === 403) {
        alert('❌ Forbidden!\n\nYou can only update your own profile. Please sign in with the correct account.');
      } else if (error.response?.status === 404) {
        alert('❌ Profile not found!\n\nYour athlete record was not found. Please try signing in again.');
      } else {
        alert(`❌ Profile creation failed:\n\n${error.message || 'Unknown error occurred'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="GoFast" className="w-16 h-16 rounded-full mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to GoFast!</h1>
          <p className="text-gray-600 mb-4">At GoFast, we believe in community. The more info you provide here, the more it fosters connections with other athletes looking to GoFast and PR.</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm font-medium">💡 <strong>Community Tip:</strong> Complete profiles get 3x more crew invites and running partner matches!</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="text-center">
            <div 
              className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={handleImageClick}
            >
              {formData.profilePhotoPreview ? (
                <img 
                  src={formData.profilePhotoPreview} 
                  alt="Profile preview" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl">📷</span>
              )}
            </div>
            <div className="flex items-center justify-center text-orange-500 text-sm cursor-pointer hover:text-orange-600" onClick={handleImageClick}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              {formData.profilePhoto ? 'Change Photo' : 'Add Photo'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your running goals, favorite routes, or what motivates you..."
              maxLength="250"
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/250 characters</p>
          </div>

          {/* GoFast Handle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GoFast Handle <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">This is for quick lookup and tagging others. We recommend using your first name but you can make it however you like.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">@</span>
              </div>
              <input
                type="text"
                value={formData.gofastHandle}
                onChange={(e) => handleInputChange('gofastHandle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_handle"
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birthday <span className="text-red-500">*</span>
            </label>
            <input 
              type="date" 
              value={formData.birthday} 
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="gender" 
                  value="male" 
                  checked={formData.gender === 'male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2"
                  required
                />
                Male
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="gender" 
                  value="female" 
                  checked={formData.gender === 'female'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2"
                  required
                />
                Female
              </label>
            </div>
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.city} 
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Charlotte"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.state} 
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="NC"
                maxLength="2"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Primary Sport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Sport <span className="text-red-500">*</span>
            </label>
            <select 
              value={formData.primarySport} 
              onChange={(e) => handleInputChange('primarySport', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Select your primary sport</option>
              <option value="running">🏃‍♂️ Running</option>
              <option value="cycling">🚴‍♂️ Cycling</option>
              <option value="swimming">🏊‍♂️ Swimming</option>
              <option value="triathlon">🏊‍♂️🚴‍♂️🏃‍♂️ Triathlon</option>
              <option value="ultra-racing">🏃‍♂️ Ultra Racing</option>
              <option value="hiking">🥾 Hiking</option>
              <option value="trail-running">🏔️ Trail Running</option>
              <option value="track-field">🏃‍♂️ Track & Field</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">🎯 This helps us match you with the right community!</p>
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <p className="text-xs text-gray-400 mb-2">In case people want to discover the real you outside of your primary sport.</p>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              placeholder="@your_handle"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Join the GoFast Community
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              You can always update your profile later in settings
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AthleteCreateProfile;
