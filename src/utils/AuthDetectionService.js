/**
 * AuthDetectionService
 * 
 * Detects if user is authenticated and routes to appropriate join flow
 * Organizers can share ONE link, and users get routed automatically:
 * - Authenticated users → Athlete-First flow (direct join)
 * - Unauthenticated users → Join Code-First flow (signup then join)
 */

import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LocalStorageAPI } from '../config/LocalStorageConfig';

/**
 * Check if user is currently authenticated
 * Uses onAuthStateChanged to wait for Firebase initialization
 * @returns {Promise<boolean>} True if user is authenticated
 */
export const isAuthenticated = async () => {
  return new Promise((resolve) => {
    // Use onAuthStateChanged to wait for Firebase to initialize
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Clean up listener
      
      if (user) {
        console.log('✅ AuthDetection: User authenticated:', user.email);
        resolve(true);
        return;
      }
      
      // Also check localStorage for athleteId (fallback check)
      const athleteId = LocalStorageAPI.getAthleteId();
      const firebaseToken = localStorage.getItem('firebaseToken');
      
      if (athleteId && firebaseToken) {
        console.log('✅ AuthDetection: Found athleteId and token in localStorage');
        resolve(true);
        return;
      }
      
      console.log('❌ AuthDetection: User not authenticated');
      resolve(false);
    });
  });
};

/**
 * Get current Firebase user
 * @returns {Promise<object|null>} Firebase user object or null
 */
export const getCurrentUser = async () => {
  try {
    return auth.currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Smart route based on authentication state
 * If authenticated → use Athlete-First flow
 * If not authenticated → use Join Code-First flow
 * 
 * @param {string} joinCode - The join code
 * @param {Function} navigate - React Router navigate function
 */
export const smartRouteToJoin = async (joinCode, navigate) => {
  if (!joinCode) {
    console.error('Join code is required');
    return;
  }

  const normalizedCode = joinCode.toUpperCase().trim();
  const authenticated = await isAuthenticated();

  if (authenticated) {
    // User is authenticated → Athlete-First flow
    console.log('✅ User authenticated → Routing to Athlete-First flow');
    navigate(`/runcrew/join?code=${encodeURIComponent(normalizedCode)}`);
  } else {
    // User is not authenticated → Join Code-First flow
    console.log('❌ User not authenticated → Routing to Join Code-First flow');
    navigate(`/joinruncrewwelcome?code=${encodeURIComponent(normalizedCode)}`);
  }
};

/**
 * Generate universal invite link (works for both authenticated and unauthenticated users)
 * The link will auto-detect auth state and route accordingly
 * 
 * @param {string} joinCode - The join code
 * @returns {string} Universal invite link
 */
export const generateUniversalInviteLink = (joinCode) => {
  if (!joinCode) {
    throw new Error('Join code is required');
  }
  
  const normalizedCode = joinCode.toUpperCase().trim();
  const baseUrl = window.location.origin || 'https://athlete.gofastcrushgoals.com';
  
  // Use the universal route that auto-detects auth state
  return `${baseUrl}/joinruncrewwelcome?code=${encodeURIComponent(normalizedCode)}`;
};

/**
 * Check authentication and get user info
 * @returns {Promise<object>} User info object
 */
export const getUserAuthInfo = async () => {
  try {
    const user = auth.currentUser;
    const athleteId = LocalStorageAPI.getAthleteId();
    const firebaseToken = localStorage.getItem('firebaseToken');
    
    return {
      isAuthenticated: !!user,
      hasAthleteId: !!athleteId,
      hasToken: !!firebaseToken,
      firebaseId: user?.uid || null,
      email: user?.email || null,
      athleteId: athleteId || null
    };
  } catch (error) {
    console.error('Error getting user auth info:', error);
    return {
      isAuthenticated: false,
      hasAthleteId: false,
      hasToken: false,
      firebaseId: null,
      email: null,
      athleteId: null
    };
  }
};

export default {
  isAuthenticated,
  getCurrentUser,
  smartRouteToJoin,
  generateUniversalInviteLink,
  getUserAuthInfo
};

