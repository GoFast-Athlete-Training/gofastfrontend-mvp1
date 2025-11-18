import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import useHydratedAthlete from '../../hooks/useHydratedAthlete';
import { LocalStorageAPI } from '../../config/LocalStorageConfig';
import GooglePlacesAutocomplete from '../../Components/RunCrew/GooglePlacesAutocomplete';
import StravaRoutePreview from '../../Components/RunCrew/StravaRoutePreview';
import RunCrewInvitePanel from '../../Components/RunCrew/RunCrewInvitePanel';
import { Settings } from 'lucide-react';

// Prefill run form for testing
const getInitialRunForm = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return {
    title: 'Saturday Sunrise Run',
    date: formattedDate,
    time: '6:30 AM',
    meetUpPoint: 'Central Park – Bethesda Terrace',
    meetUpAddress: 'Central Park, New York, NY',
    totalMiles: '5.0',
    pace: '8:00-8:30',
    description: 'Early morning run to start the weekend right. All paces welcome!',
    stravaMapUrl: ''
  };
};

const initialRunForm = getInitialRunForm();

const paceOptions = [
  '6:00-6:30',
  '6:30-7:00',
  '7:00-7:30',
  '7:30-8:00',
  '8:00-8:30',
  '8:30-9:00',
  '9:00-9:30',
  '9:30-10:00',
  '10:00-10:30',
  '10:30-11:00',
  '11:00+'
];

const timeOptions = [
  '5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM'
];

const metricFormatters = {
  miles: (entry) => `${(entry.totalMiles ?? 0).toFixed(1)} mi`,
  runs: (entry) => `${entry.totalRuns ?? 0} runs`,
  calories: (entry) => `${Math.round(entry.totalCalories ?? 0)} cal`
};

export default function RunCrewCentralAdmin() {
  const navigate = useNavigate();
  const {
    athlete: hydratedAthlete,
    athleteId,
    runCrewId,
    runCrewManagerId
  } = useHydratedAthlete();

  const [crew, setCrew] = useState(null);
  const [loadingCrew, setLoadingCrew] = useState(true);
  const [crewError, setCrewError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [runForm, setRunForm] = useState(initialRunForm);
  const [editingRunId, setEditingRunId] = useState(null);
  const [expandedRunId, setExpandedRunId] = useState(null);
  const [placeData, setPlaceData] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState('miles');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [membersError, setMembersError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const isAdmin = useMemo(() => {
    if (!crew || !athleteId) {
      return false;
    }
    if (runCrewManagerId) {
      return true;
    }
    if (Array.isArray(crew.managers)) {
      return crew.managers.some(
        (manager) => manager.athleteId === athleteId && manager.role === 'admin'
      );
    }
    return false;
  }, [crew, athleteId, runCrewManagerId]);
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), []);

  const runs = crew?.runs || [];
  const memberships = crew?.memberships || [];
  // Extract invite code from crew data (no hardcoded values)
  const inviteCode = crew?.joinCode || null;

  const showToast = (message) => {
    setToast(message);
    if (message) {
      setTimeout(() => {
        setToast(null);
      }, 2400);
    }
  };

  const persistCrew = (updatedCrew) => {
    if (!updatedCrew) return;

    const enrichedCrew = {
      ...updatedCrew,
      isAdmin: isAdmin || updatedCrew.isAdmin
    };

    const idToPersist = enrichedCrew.id || runCrewId || null;
    const managerRecord = Array.isArray(enrichedCrew.managers)
      ? enrichedCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
      : null;
    const managerIdToPersist = managerRecord?.id || enrichedCrew.currentManagerId || runCrewManagerId || null;

    if (idToPersist) {
      LocalStorageAPI.setRunCrewId(idToPersist);
    }

    LocalStorageAPI.setRunCrewManagerId(managerIdToPersist);
    LocalStorageAPI.setRunCrewData(enrichedCrew);
    setCrew(enrichedCrew);
  };

  // Wait for Firebase auth to initialize
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthInitialized(true);
      
      if (!user) {
        console.log('⚠️ RunCrewAdmin: No authenticated user - may need to sign in');
      } else {
        console.log('✅ RunCrewAdmin: Firebase auth initialized, user:', user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get auth token (waits for auth to be ready)
  // Uses auth.currentUser as fallback since firebaseUser state might lag
  const getAuthToken = useCallback(async () => {
    // Wait for auth to initialize if not ready yet
    if (!authInitialized) {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          if (user) {
            user.getIdToken().then(resolve).catch(() => resolve(null));
          } else {
            resolve(null);
          }
        });
      });
    }

    // Try firebaseUser state first, then fallback to auth.currentUser
    const user = firebaseUser || auth.currentUser;
    
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    }

    return null;
  }, [authInitialized, firebaseUser]);

  // Load RunCrew independently from /api/runcrew/:id
  const loadRunCrew = useCallback(async () => {
    if (!runCrewId) {
      setCrewError('Missing crew ID');
      setLoadingCrew(false);
      return;
    }
    
    try {
      setLoadingCrew(true);
      setCrewError(null);
      
      // Use api instance which has automatic token injection via interceptor
      // The interceptor will handle token retrieval and injection
      // We just need to wait for auth to initialize
      if (!authInitialized) {
        setCrewError('Loading authentication...');
        setLoadingCrew(false);
        return;
      }

      if (!firebaseUser && !auth.currentUser) {
        throw new Error('Please sign in to view crew');
      }

      const { data } = await api.get(`/runcrew/${runCrewId}`);

      if (data?.success && data.runCrew) {
        const managerRecord = Array.isArray(data.runCrew?.managers)
          ? data.runCrew.managers.find((manager) => manager.athleteId === athleteId && manager.role === 'admin')
          : null;

        const updatedCrew = {
          ...data.runCrew,
          isAdmin: managerRecord ? true : data.runCrew.isAdmin
        };

        LocalStorageAPI.setRunCrewData(updatedCrew);
        LocalStorageAPI.setRunCrewId(data.runCrew.id);
        LocalStorageAPI.setRunCrewManagerId(managerRecord?.id || data.runCrew.currentManagerId || null);

        setCrew(updatedCrew);
        setMembersError(null); // Clear members error if successful
      } else {
        throw new Error(data?.error || 'Failed to load crew');
      }
    } catch (error) {
      console.error('Failed to load RunCrew:', error);
      setCrewError(error.response?.data?.error || error.message || 'Failed to load crew data');
      
      // If crew fails to load, we can't verify members either
      if (error.response?.status === 404 || error.response?.status === 403) {
        setMembersError('Unable to load members. Crew not found or access denied.');
      }
    } finally {
      setLoadingCrew(false);
    }
  }, [runCrewId, athleteId, authInitialized, firebaseUser]);

  // Load announcements independently
  const loadAnnouncements = useCallback(async () => {
    if (!runCrewId) return;
    
    try {
      setLoadingAnnouncements(true);
      setAnnouncementsError(null);
      
      // Use api instance which has automatic token injection via interceptor
      if (!authInitialized) {
        setLoadingAnnouncements(false);
        return; // Wait for auth to initialize
      }

      if (!firebaseUser && !auth.currentUser) {
        throw new Error('Please sign in to view announcements');
      }

      const { data } = await api.get(`/runcrew/${runCrewId}/announcements`);

      if (data?.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        throw new Error(data?.error || 'Failed to load announcements');
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncementsError(error.response?.data?.error || error.message || 'Failed to load announcements');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [runCrewId, authInitialized, firebaseUser]);

  // Load leaderboard independently
  const loadLeaderboard = useCallback(async () => {
    if (!runCrewId) return;
    
    try {
      setLoadingLeaderboard(true);
      setLeaderboardError(null);
      
      // Use api instance which has automatic token injection via interceptor
      if (!authInitialized) {
        setLoadingLeaderboard(false);
        return; // Wait for auth to initialize
      }

      if (!firebaseUser && !auth.currentUser) {
        throw new Error('Please sign in to view leaderboard');
      }

      const { data } = await api.get(`/runcrew/${runCrewId}/leaderboard`, {
        params: { metric: activeMetric, week: 'current' }
      });

      if (data?.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      } else {
        throw new Error(data?.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboardError(error.response?.data?.error || error.message || 'Failed to load leaderboard');
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [runCrewId, activeMetric, authInitialized, firebaseUser]);

  const handleResync = useCallback(async () => {
    if (!runCrewId) {
      showToast('Missing crew context. Please return to Athlete Home.');
      return;
    }

    try {
      setSyncing(true);
      
      // Reload all data independently
      await Promise.all([
        loadRunCrew(),
        loadAnnouncements(),
        loadLeaderboard()
      ]);
      
      showToast('Crew data refreshed');
    } catch (error) {
      console.error('Failed to sync crew:', error);
      showToast('Failed to refresh crew data');
    } finally {
      setSyncing(false);
    }
  }, [runCrewId, loadRunCrew, loadAnnouncements, loadLeaderboard]);

  // Fetch fresh runCrew data on mount (independent of Welcome hydration)
  // Wait for auth to initialize before loading data
  useEffect(() => {
    if (!authInitialized) {
      return; // Wait for Firebase auth to initialize
    }

    if (runCrewId && athleteId) {
      // Load RunCrew first, then other data
      loadRunCrew().then(() => {
        // Once crew is loaded, load announcements and leaderboard
        if (runCrewId && firebaseUser) {
          loadAnnouncements();
          loadLeaderboard();
        }
      });
    } else if (!runCrewId) {
      setCrewError('No crew ID found. Please join or create a crew first.');
      setLoadingCrew(false);
    } else if (!firebaseUser) {
      setCrewError('Please sign in to view crew');
      setLoadingCrew(false);
    }
  }, [authInitialized, runCrewId, athleteId, firebaseUser, loadRunCrew, loadAnnouncements, loadLeaderboard]);

  // Reload leaderboard when metric changes (only after crew is loaded)
  useEffect(() => {
    if (runCrewId && crew && !loadingCrew) {
      loadLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMetric]); // Only reload when metric changes

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault();
    if (!runCrewId) {
      showToast('Sync your crew before posting');
      return;
    }

    const trimmedTitle = announcementTitle.trim();
    const trimmedContent = announcementContent.trim();
    
    if (!trimmedTitle || !trimmedContent) {
      showToast('Please provide both title and content');
      return;
    }

    try {
      // Use api instance which has automatic token injection via interceptor
      if (!authInitialized) {
        showToast('Loading authentication...');
        return;
      }

      if (!firebaseUser && !auth.currentUser) {
        showToast('Please sign in to post announcements');
        return;
      }

      setAnnouncementsError(null);

      const { data } = await api.post(`/runcrew/${runCrewId}/announcements`, {
        title: trimmedTitle,
        content: trimmedContent
      });

      if (data?.success) {
        // Clear form immediately for better UX
        setAnnouncementTitle('');
        setAnnouncementContent('');
        
        // Reload announcements to get the latest from server
        // loadAnnouncements will handle its own loading state
        await loadAnnouncements();
        
        showToast('Announcement posted successfully');
      } else {
        throw new Error(data?.error || 'Failed to post announcement');
      }
    } catch (error) {
      console.error('Failed to post announcement:', error);
      const errorMessage = error.response?.data?.error || 'Failed to post announcement';
      setAnnouncementsError(errorMessage);
      showToast(errorMessage);
    }
  };


  const handleRunSubmit = async (event) => {
    event.preventDefault();
    if (!crew) {
      showToast('Sync your crew before creating runs');
      return;
    }

    const title = runForm.title.trim();
    const date = runForm.date;
    const time = runForm.time;
    const meetUpPoint = runForm.meetUpPoint.trim();
    const meetUpAddress = runForm.meetUpAddress.trim();
    const totalMiles = runForm.totalMiles;
    const pace = runForm.pace.trim();
    const stravaMapUrl = runForm.stravaMapUrl.trim();
    const description = runForm.description.trim();

    if (!title || !date || !time || !meetUpPoint) {
      showToast('Please fill in all required fields (Title, Date, Time, Meet-Up Point)');
      return;
    }

    const isoDate = date ? `${date}T${time || '00:00'}` : null;

    // EDIT MODE: Update existing run via backend
    if (editingRunId) {
      try {
        // Use api instance which has automatic token injection via interceptor
        if (!authInitialized) {
          showToast('Loading authentication...');
          return;
        }

        if (!firebaseUser && !auth.currentUser) {
          showToast('Please sign in to edit runs');
          return;
        }

        const { data } = await api.patch(`/runcrew/runs/${editingRunId}`, {
        title,
        date: isoDate,
        startTime: time,
        meetUpPoint,
        meetUpAddress: meetUpAddress || null,
        totalMiles: totalMiles ? parseFloat(totalMiles) : null,
        pace: pace || null,
        stravaMapUrl: stravaMapUrl || null,
        description: description || null
      });

        if (data?.success && data.data) {
          // Update the run in the local crew object
          const updatedRuns = runs.map((r) =>
            r.id === editingRunId ? data.data : r
          );
          const updatedCrew = { ...crew, runs: updatedRuns };
          persistCrew(updatedCrew);
          showToast('Run updated successfully');
          setEditingRunId(null);
          setRunForm(initialRunForm);
          setPlaceData(null);
          setShowRunModal(false);
        } else {
          throw new Error(data?.error || 'Failed to update run');
        }
      } catch (error) {
        console.error('Error updating run:', error);
        showToast(error.message || 'Failed to update run');
      }
      return;
    }

    // CREATE MODE: Create run via API
    try {
      // Use api instance which has automatic token injection via interceptor
      if (!authInitialized) {
        showToast('Loading authentication...');
        return;
      }

      if (!firebaseUser && !auth.currentUser) {
        showToast('Please sign in to create runs');
        return;
      }

      const { data } = await api.post(`/runcrew/${runCrewId}/runs`, {
        title,
        date: isoDate,
        startTime: time,
        meetUpPoint,
        meetUpAddress: meetUpAddress || null,
        meetUpLat: placeData?.lat || null,
        meetUpLng: placeData?.lng || null,
        meetUpPlaceId: placeData?.placeId || null,
        totalMiles: totalMiles ? parseFloat(totalMiles) : null,
        pace: pace || null,
        stravaMapUrl: stravaMapUrl || null,
        description: description || null
      });

      if (data?.success && data.data) {
        // Update crew with new run
        const updatedRuns = [data.data, ...runs];
        const updatedCrew = { ...crew, runs: updatedRuns };
        persistCrew(updatedCrew);
        setRunForm(initialRunForm);
        setPlaceData(null);
        setShowRunModal(false);
        showToast('Run created successfully');
      } else {
        throw new Error(data?.error || 'Failed to create run');
      }
    } catch (error) {
      console.error('Error creating run:', error);
      
      // If auth error, the axios interceptor should handle token refresh
      showToast(error.response?.data?.error || error.message || 'Failed to create run');
    }
  };

  const openCreateRun = () => {
    setEditingRunId(null);
    setRunForm(getInitialRunForm()); // Use function to get fresh prefilled data
    setPlaceData(null);
    setShowRunModal(true);
  };

  const formatRunDate = (run) => {
    const candidate = run.date || run.scheduledAt || null;
    if (!candidate) return 'Date TBD';
    try {
      return new Date(candidate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return candidate;
    }
  };

  const handleRunFormChange = (field) => (event) => {
    const value = event.target.value;
    setRunForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlaceSelected = (place) => {
    setPlaceData({
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng
    });
    setRunForm((prev) => ({
      ...prev,
      meetUpAddress: place.address
    }));
  };

  const handleAnnouncementChange = (event) => {
    setAnnouncementContent(event.target.value);
  };

  const handleEditRun = (run) => {
    // Parse the date from the run object
    let dateValue = '';
    
    if (run.date) {
      try {
        const runDate = new Date(run.date);
        // Format date as YYYY-MM-DD for input[type="date"]
        dateValue = runDate.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error parsing run date:', error);
      }
    }

    setEditingRunId(run.id);
    setRunForm({
      title: run.title || '',
      date: dateValue,
      time: run.time || run.startTime || '', // Use existing time format (e.g., "6:30 AM")
      meetUpPoint: run.meetUpPoint || '',
      meetUpAddress: run.meetUpAddress || '',
      totalMiles: run.totalMiles || '',
      pace: run.pace || '',
      description: run.description || '',
      stravaMapUrl: run.stravaMapUrl || ''
    });
    
    // Open modal instead of scrolling
    setShowRunModal(true);
  };

  const handleCancelEdit = () => {
    setEditingRunId(null);
    setRunForm(initialRunForm);
    setPlaceData(null);
    setShowRunModal(false);
  };

  const getLeaderboardDisplay = () => {
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) return [];
    return leaderboard
      .map((entry) => ({
        ...entry,
        display: metricFormatters[activeMetric](entry)
      }))
      .slice(0, 5);
  };

  const toggleRunDetails = (runId) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const goToMemberView = () => {
    // Local-first: No params needed, member view reads from LocalStorageAPI
    navigate('/runcrew/central');
  };

  const goToSettings = () => {
    navigate('/runcrew-settings');
  };

  // Render loading state (wait for auth initialization)
  if (!authInitialized || loadingCrew) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 text-sm">
            {!authInitialized ? 'Initializing authentication...' : 'Loading crew data...'}
          </p>
        </div>
      </main>
    );
  }

  // Render error state for RunCrew hydration failure
  if (crewError || !crew) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Failed to Load Crew</h3>
            <p className="text-red-700 text-sm mb-4">
              {crewError || 'Unable to load crew data. Please check your connection and try again.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={loadRunCrew}
                disabled={loadingCrew}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
              >
                {loadingCrew ? 'Retrying...' : 'Retry'}
              </button>
              <button
                onClick={() => navigate('/athlete-home')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg z-30">
          {toast}
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/athlete-home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{crew.name || 'RunCrew Admin'}</h1>
              <p className="text-sm text-gray-500">{currentDate}</p>
              <p className="mt-2 text-base text-gray-700">
                Welcome back{hydratedAthlete?.firstName ? `, ${hydratedAthlete.firstName}` : ''}! You’re managing everything for this crew.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-sky-900">
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">athleteId: {athleteId || '—'}</span>
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">runCrewId: {runCrewId || crew.id || '—'}</span>
                <span className="bg-sky-100 border border-sky-200 rounded px-3 py-1">managerId: {runCrewManagerId || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/athlete-home')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-300"
            >
              Home
            </button>
            <button
              onClick={goToMemberView}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 transition"
            >
              View Member Experience
            </button>
            <button
              onClick={goToSettings}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 border border-orange-600 rounded-lg px-4 py-2 transition shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={handleResync}
              disabled={syncing}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : 'Re-sync Crew Data'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-10">

        {/* 3-Column Layout: Members (Left) | Main Content (Center) | Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: Members (Prominent) */}
          <aside className="lg:col-span-3 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Members</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{memberships.length}</span>
              </div>
              
              {membersError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm mb-2">Failed to load members</p>
                  <button 
                    onClick={loadRunCrew}
                    className="text-red-600 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              ) : memberships.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                  <p className="mb-2">No members yet.</p>
                  <p>Share your invite code to build the crew.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {memberships.map((membership) => {
                    const athlete = membership.athlete || membership;
                    const managerRecord = Array.isArray(crew.managers)
                      ? crew.managers.find((manager) => manager.athleteId === athlete?.id && manager.role === 'admin')
                      : null;

                    return (
                      <div key={athlete?.id || membership.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        {athlete?.photoURL ? (
                          <img
                            src={athlete.photoURL}
                            alt={`${athlete.firstName} ${athlete.lastName}`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                            {(athlete?.firstName?.[0] || 'A').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {athlete?.firstName || 'Athlete'} {athlete?.lastName || ''}
                            {managerRecord && <span className="text-orange-600 text-xs font-bold ml-1">Admin</span>}
                          </p>
                          {athlete?.email && (
                            <p className="text-xs text-gray-500 truncate">{athlete.email}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Invite Section */}
              <RunCrewInvitePanel inviteCode={inviteCode} />
            </section>
          </aside>

          {/* MAIN CONTENT: Announcements, Runs, Messages */}
          <div className="lg:col-span-6 space-y-6">
            {/* Announcements */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
                  <p className="text-sm text-gray-500">Share updates with your crew</p>
                </div>
              </div>

              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 mb-3"
                  />
                  <textarea
                    value={announcementContent}
                    onChange={handleAnnouncementChange}
                    placeholder="What's happening next?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingAnnouncements || !announcementTitle.trim() || !announcementContent.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {loadingAnnouncements ? 'Posting...' : 'Post Announcement'}
                  </button>
                </div>
              </form>

              {loadingAnnouncements && (
                <div className="text-center py-4 text-sm text-gray-500">Loading announcements...</div>
              )}

              {announcementsError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm mb-2">{announcementsError}</p>
                  <button 
                    onClick={loadAnnouncements}
                    className="text-yellow-600 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {!loadingAnnouncements && !announcementsError && announcements.length === 0 && (
                  <p className="text-sm text-gray-500">No announcements yet. Be the first to post one.</p>
                )}
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>
                        {announcement.author?.firstName
                          ? `${announcement.author.firstName}${announcement.author.lastName ? ` ${announcement.author.lastName}` : ''}`
                          : 'Admin'}
                      </span>
                      <span>
                        {announcement.createdAt
                          ? new Date(announcement.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })
                          : 'Just now'}
                      </span>
                    </div>
                    {announcement.title && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{announcement.title}</h4>
                    )}
                    <p className="text-sm text-gray-800 whitespace-pre-line">{announcement.content || announcement.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Runs Module */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Runs</h3>
              <button
                onClick={openCreateRun}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Run
              </button>
            </div>
            {runs.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                <p className="mb-2">No runs yet.</p>
                <p>Click "Create Run" above to schedule the first run.</p>
              </div>
            )}
            <div className="space-y-3">
              {runs.map((run) => {
                // Fix RSVP count: check both run.rsvps array and run._count.rsvps
                const rsvpCount = run.rsvps?.length || run._count?.rsvps || 0;
                const goingCount = run.rsvps?.filter(r => r.status === 'going').length || rsvpCount;
                const isExpanded = expandedRunId === run.id;
                
                return (
                  <div key={run.id} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                    {/* Run Card Header */}
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{run.title || 'Untitled Run'}</p>
                          <p className="text-xs text-gray-500">{formatRunDate(run)}</p>
                          {run.meetUpPoint && (
                            <p className="text-xs text-gray-500 mt-1">📍 {run.meetUpPoint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {goingCount} going
                          </span>
                          <button
                            onClick={() => toggleRunDetails(run.id)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-semibold border border-orange-300 rounded px-3 py-1 hover:bg-orange-50 transition"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => handleEditRun(run)}
                            className="text-xs text-sky-600 hover:text-sky-800 font-semibold border border-sky-300 rounded px-3 py-1 hover:bg-sky-50 transition"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                        {/* Run Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {run.totalMiles && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                              <p className="font-semibold text-gray-900">{run.totalMiles} miles</p>
                            </div>
                          )}
                          {run.pace && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Pace</p>
                              <p className="font-semibold text-gray-900">{run.pace}</p>
                            </div>
                          )}
                          {run.meetUpAddress && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                              <p className="text-sm text-gray-900">{run.meetUpAddress}</p>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {run.description && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{run.description}</p>
                          </div>
                        )}

                        {/* Strava Map */}
                        {run.stravaMapUrl && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Route Map</p>
                            <a
                              href={run.stravaMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                            >
                              View on Strava
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}

                        {/* Map Placeholder (if coordinates exist) */}
                        {(run.meetUpLat && run.meetUpLng) && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Location</p>
                            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-200">
                              <div className="text-center text-gray-500">
                                <p className="text-sm font-medium">Map View</p>
                                <p className="text-xs mt-1">Lat: {run.meetUpLat}, Lng: {run.meetUpLng}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* RSVPs */}
                        {run.rsvps && run.rsvps.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Who's Going</p>
                            <div className="flex flex-wrap gap-2">
                              {run.rsvps.filter(r => r.status === 'going').map((rsvp) => (
                                <div key={rsvp.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                                  {rsvp.athlete?.photoURL && (
                                    <img
                                      src={rsvp.athlete.photoURL}
                                      alt={rsvp.athlete.firstName}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                  )}
                                  <span className="text-xs font-medium text-green-900">
                                    {rsvp.athlete?.firstName} {rsvp.athlete?.lastName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

          </div>

          {/* RIGHT SIDEBAR: Actions & Stats */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Crew Stats */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Crew Stats</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Upcoming Runs</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{runs.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Keep the calendar full</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Announcements</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{announcements.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Crew updates</p>
                </div>
              </div>
            </section>

            {/* Leaderboard */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
                <div className="flex gap-1">
                  {['miles','runs','calories'].map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setActiveMetric(metric)}
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${activeMetric === metric ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {metric === 'miles' ? 'Miles' : metric === 'runs' ? 'Runs' : 'Cals'}
                    </button>
                  ))}
                </div>
              </div>
              {loadingLeaderboard && (
                <div className="text-center py-4 text-sm text-gray-500">Loading leaderboard...</div>
              )}

              {leaderboardError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm mb-2">{leaderboardError}</p>
                  <button 
                    onClick={loadLeaderboard}
                    className="text-yellow-600 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loadingLeaderboard && !leaderboardError && (
                <div className="space-y-2">
                  {getLeaderboardDisplay().length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 mb-2">No leaderboard data yet.</p>
                      <p className="text-xs text-gray-400">Stats will appear once your crew syncs activities from Garmin.</p>
                    </div>
                  )}
                  {getLeaderboardDisplay().map((entry, index) => (
                    <div key={entry.athlete?.id || index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      {entry.athlete?.photoURL ? (
                        <img
                          src={entry.athlete.photoURL}
                          alt={`${entry.athlete.firstName} ${entry.athlete.lastName}`}
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-xs">
                          {(entry.athlete?.firstName?.[0] || 'A').toUpperCase()}
                        </div>
                      )}
                      <p className="flex-1 text-sm font-semibold text-gray-900">
                        {entry.athlete?.firstName || 'Athlete'} {entry.athlete?.lastName || ''}
                      </p>
                      <p className="text-sm font-bold text-orange-600">{entry.display}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {/* Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingRunId ? 'Edit Run' : 'Create Run'}</h2>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRunSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</label>
                  <input
                    type="text"
                    value={runForm.title}
                    onChange={handleRunFormChange('title')}
                    placeholder="Saturday Sunrise Run"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date *</label>
                  <input
                    type="date"
                    value={runForm.date}
                    onChange={handleRunFormChange('date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Time *</label>
                  <select
                    value={runForm.time}
                    onChange={handleRunFormChange('time')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  >
                    <option value="">Select time...</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meet-Up Point *</label>
                  <input
                    type="text"
                    value={runForm.meetUpPoint}
                    onChange={handleRunFormChange('meetUpPoint')}
                    placeholder="Central Park – Bethesda Terrace"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meetup Address</label>
                <GooglePlacesAutocomplete
                  value={runForm.meetUpAddress}
                  onChange={handleRunFormChange('meetUpAddress')}
                  onPlaceSelected={handlePlaceSelected}
                  placeholder="Start typing address..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Miles</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runForm.totalMiles}
                    onChange={handleRunFormChange('totalMiles')}
                    placeholder="5.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pace (min/mile)</label>
                  <select
                    value={runForm.pace}
                    onChange={handleRunFormChange('pace')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="">Select pace...</option>
                    {paceOptions.map((pace) => (
                      <option key={pace} value={pace}>{pace}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Strava Route URL (Optional)</label>
                <input
                  type="url"
                  value={runForm.stravaMapUrl}
                  onChange={handleRunFormChange('stravaMapUrl')}
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                {runForm.stravaMapUrl && runForm.stravaMapUrl.includes('strava.com') && (
                  <div className="mt-3">
                    <StravaRoutePreview
                      polylineString="ypweFnzbjVhAWnAc@bAa@dAe@fAi@hAm@jAq@lAs@nAw@pAy@rA{@tA}@vA_AvAaAxAcAzAeA|AgA~AiA`BiAaBkAdBmAfBoBhBoBlBqBnBsBpBuBrBwBtByB"
                      stravaUrl={runForm.stravaMapUrl}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                <textarea
                  value={runForm.description}
                  onChange={handleRunFormChange('description')}
                  placeholder="Tell your crew what to expect..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                >
                  {editingRunId ? 'Save Changes' : 'Create Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

