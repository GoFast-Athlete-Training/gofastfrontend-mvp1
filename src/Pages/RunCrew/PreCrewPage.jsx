import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';

const API_BASE = 'https://gofastbackendv2-fall2025.onrender.com/api';

/**
 * PreCrewPage - Hydration checkpoint before navigating to RunCrew Central
 * Route: /precrewpage?crewId=xxx
 * 
 * This lightweight page:
 * 1. Hydrates athlete and crew data
 * 2. Saves to localStorage
 * 3. Redirects to RunCrew Central
 */
export default function PreCrewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hydrateAndRedirect = async () => {
      try {
        setLoading(true);
        
        // Get crewId from URL or localStorage
        const crewId = searchParams.get('crewId') || LocalStorageAPI.getRunCrewId();
        
        if (!crewId) {
          throw new Error('No crew ID found. Please join a crew first.');
        }

        // Hydrate athlete and crew in parallel
        const [athleteRes, crewRes] = await Promise.all([
          api.get('/athlete/create').catch(() => {
            // If /athlete/create fails, try to get from localStorage
            const athleteId = LocalStorageAPI.getAthleteId();
            if (athleteId) {
              return api.get(`/athlete/${athleteId}`);
            }
            throw new Error('Failed to fetch athlete data');
          }),
          fetch(`${API_BASE}/runcrew/${crewId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`
            }
          }).then(res => {
            if (!res.ok) throw new Error('Failed to fetch crew');
            return res.json();
          })
        ]);

        // Extract athlete data
        const athleteData = athleteRes.data?.data || athleteRes.data;
        const athleteId = athleteData?.id || athleteRes.data?.athleteId;
        
        if (!athleteId) {
          throw new Error('Failed to get athlete ID');
        }

        // Extract crew data
        const crewData = crewRes.data || crewRes;
        
        if (!crewData || !crewData.success) {
          throw new Error('Failed to fetch crew data');
        }

        const crew = crewData.data || crewData.runCrew || crewData;

        // Save to localStorage
        LocalStorageAPI.setAthleteId(athleteId);
        LocalStorageAPI.setRunCrewId(crew.id);
        LocalStorageAPI.setRunCrewData(crew);
        
        // Update athlete profile with crew info
        const existingProfile = LocalStorageAPI.getAthleteProfile() || {};
        const existingRunCrews = Array.isArray(existingProfile.runCrews) ? existingProfile.runCrews : [];
        
        const updatedRunCrews = [
          {
            ...crew,
            isAdmin: false // Will be updated if they're actually an admin
          },
          ...existingRunCrews.filter(c => c.id !== crew.id)
        ];

        LocalStorageAPI.setAthleteProfile({
          ...existingProfile,
          runCrews: updatedRunCrews
        });

        console.log('✅ PreCrewPage: Hydration complete, redirecting to RunCrew Central');

        // Redirect to RunCrew Central
        navigate(`/runcrew/${crew.id}`);
        
      } catch (err) {
        console.error('❌ PreCrewPage: Hydration error:', err);
        setError(err.message || 'Failed to load crew data. Please try again.');
        setLoading(false);
        
        // Fallback: redirect to athlete home after 3 seconds
        setTimeout(() => {
          navigate('/athlete-home');
        }, 3000);
      }
    };

    hydrateAndRedirect();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Crew</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Syncing Your Profile</h2>
        <p className="text-gray-600">Setting up your RunCrew experience...</p>
      </div>
    </div>
  );
}

