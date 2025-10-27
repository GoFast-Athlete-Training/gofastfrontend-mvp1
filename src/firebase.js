import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

/**
 * Firebase Configuration - USER AUTH ONLY
 * This is ONLY for user login/signup/session management
 */

const firebaseConfig = {
  apiKey: "AIzaSyCjpoH763y2GH4VDc181IUBaZHqE_ryZ1c",
  authDomain: "gofast-a5f94.firebaseapp.com",
  projectId: "gofast-a5f94",
  storageBucket: "gofast-a5f94.firebasestorage.app",
  messagingSenderId: "500941094498",
  appId: "1:500941094498:web:4008d94b89a9e3a4889b3b",
  measurementId: "G-CQ0GJCJLXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Set persistence to keep user logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

// Google Provider for USER LOGIN
const googleProvider = new GoogleAuthProvider();

// Configure Google provider to avoid common issues
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selection
});

// Add scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Sign in with Google - USER LOGIN ONLY
 * Use this for signup/signin pages
 */
export async function signInWithGoogle() {
  try {
    console.log("🔐 Firebase: Signing in user with Google...");
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log("✅ Firebase: User signed in");
    console.log("📧 Email:", user.email);
    console.log("🆔 UID:", user.uid);
    
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error("❌ Firebase: Sign-in error:", error);
    throw error;
  }
}

/**
 * Sign out user
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log("✅ Firebase: User signed out");
  } catch (error) {
    console.error("❌ Firebase: Sign out error:", error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

export default app;