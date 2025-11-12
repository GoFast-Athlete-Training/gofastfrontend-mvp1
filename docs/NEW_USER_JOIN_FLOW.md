# New User Join Flow (Direct Invite Link)

**Status**: ✅ Implemented  
**Entry Point**: `/join/:code` or `/join?code=XXX`  
**User State**: **Not authenticated, no athlete account**  
**Goal**: Get new user signed up, profile created, and joined to crew seamlessly

---

## Flow Overview

```
1. User clicks invite link → JoinCodeWelcome (/join/:code)
2. Auto-lookup crew → Show preview
3. User clicks "Join This Crew" → Store join intent in localStorage
4. Show "soft join" success → Redirect to signup
5. User signs in with Google → JoinCrewAthSignup
6. Upsert athlete → Check profile completeness
7a. If profile incomplete → JoinCrewAthProfile → Complete profile → Join crew
7b. If profile complete → Join crew immediately
8. Redirect to crew (admin or member view)
```

---

## Step-by-Step Flow

### Step 1: JoinCodeWelcome (`/join/:code`)

**Component**: `JoinCodeWelcome.jsx`  
**Route**: `/join/:code` or `/join?code=XXX`

**What Happens**:
1. Extracts `joinCode` from URL (`:code` param or `?code=` query)
2. Auto-calls `POST /api/runcrew/lookup` with join code
3. Shows crew preview (name, description, member count, admin info)
4. User clicks "Join This Crew" button

**Critical Actions**:
```javascript
// Store join intent in localStorage (persists across redirects)
localStorage.setItem('pendingJoinCode', joinCode.trim().toUpperCase());
localStorage.setItem('pendingJoinCrewId', crewPreview.id);
localStorage.setItem('pendingJoinCrewName', crewPreview.name);

// Show "soft join" success screen
setSoftJoinComplete(true);

// Redirect to signup after 2 seconds
setTimeout(() => {
  navigate('/joincrew-ath-signup', { replace: true });
}, 2000);
```

**localStorage Keys Set**:
- `pendingJoinCode` - The join code (normalized uppercase)
- `pendingJoinCrewId` - The crew ID
- `pendingJoinCrewName` - The crew name (for display)

**Error Handling**:
- Invalid join code → Shows error message
- Network error → Shows error, allows retry

---

### Step 2: JoinCrewAthSignup (`/joincrew-ath-signup`)

**Component**: `JoinCrewAthSignup.jsx`  
**Route**: `/joincrew-ath-signup`

**What Happens**:
1. Reads `pendingJoinCode` from localStorage
2. If missing → Shows error, redirects back to `/join`
3. User clicks "Sign in with Google"
4. Firebase Google OAuth sign-in
5. Gets Firebase token
6. Calls `POST /api/athlete/create` (upserts athlete with Firebase data)
7. Checks if athlete has `gofastHandle` (profile complete?)

**Critical Actions**:
```javascript
// Read join intent
const pendingJoinCode = localStorage.getItem('pendingJoinCode');
if (!pendingJoinCode) {
  setError('No join code found. Please start from the invite link.');
  return;
}

// Sign in with Google
const result = await signInWithGoogle();
const firebaseToken = await auth.currentUser?.getIdToken();

// Store Firebase auth data
localStorage.setItem("firebaseToken", firebaseToken);
localStorage.setItem("firebaseId", result.uid);
localStorage.setItem("email", result.email);

// Upsert athlete (creates if new, updates if exists)
const athleteResponse = await api.post('/athlete/create', {});
const athleteId = athleteResponse.data.athleteId;
localStorage.setItem("athleteId", athleteId);

// Check profile completeness
const athleteData = athleteResponse.data.data;
if (!athleteData?.gofastHandle) {
  // Profile incomplete → Go to profile creation
  navigate('/joincrew-ath-profile', { replace: true });
  return;
}

// Profile complete → Join crew immediately
const joinResponse = await api.post('/runcrew/join', {
  joinCode: pendingJoinCode
});

// Store crew data and redirect
LocalStorageAPI.setRunCrewData({ ...runCrew, isAdmin });
LocalStorageAPI.setRunCrewId(runCrew.id);
localStorage.removeItem('pendingJoinCode'); // Clear join intent
navigate('/runcrew/central' or '/crew/crewadmin');
```

**localStorage Keys Read**:
- `pendingJoinCode` - Required (validates it exists)

**localStorage Keys Set**:
- `firebaseToken` - Firebase auth token
- `firebaseId` - Firebase user ID
- `email` - User email
- `athleteId` - Athlete ID from backend

**localStorage Keys Cleared** (if profile complete):
- `pendingJoinCode`
- `pendingJoinCrewId`
- `pendingJoinCrewName`

**Error Handling**:
- No `pendingJoinCode` → Error message, can't proceed
- Google sign-in fails → Error message, retry
- Athlete creation fails → Error message, retry
- Join fails → Error message, retry

---

### Step 3a: JoinCrewAthProfile (`/joincrew-ath-profile`) - If Profile Incomplete

**Component**: `JoinCrewAthProfile.jsx`  
**Route**: `/joincrew-ath-profile`

**What Happens**:
1. Reads `pendingJoinCode` and `pendingJoinCrewName` from localStorage
2. User fills out profile form (firstName, lastName, gofastHandle, birthday, gender, city, state, primarySport, etc.)
3. User submits form
4. Calls `POST /api/athlete/create` (ensure athlete exists)
5. Calls `PUT /api/athlete/:id/profile` (update profile)
6. Checks for `pendingJoinCode` in localStorage
7. If exists → Calls `POST /api/runcrew/join` → Stores crew data → Redirects to crew
8. If not → Redirects to `/athlete-home`

**Critical Actions**:
```javascript
// Verify user is authenticated
const firebaseUser = auth.currentUser;
if (!firebaseUser) {
  navigate('/joincrew-ath-signup');
  return;
}

// Ensure athlete exists
const res = await api.post('/athlete/create');
const athleteId = res.data.athleteId || res.data.data?.id;

// Update profile
await api.put(`/athlete/${athleteId}/profile`, {
  firstName, lastName, gofastHandle, birthday, gender,
  city, state, primarySport, bio, instagram, photoURL
});

// Store athlete data
LocalStorageAPI.setAthleteId(athleteId);
LocalStorageAPI.setAthleteProfile(profileData.athlete);

// Check for pending join code
const pendingJoinCode = localStorage.getItem('pendingJoinCode');
if (pendingJoinCode) {
  // Complete join
  const joinResponse = await api.post('/runcrew/join', {
    joinCode: pendingJoinCode
  });
  
  // Store crew data
  LocalStorageAPI.setRunCrewData({ ...runCrew, isAdmin });
  LocalStorageAPI.setRunCrewId(runCrew.id);
  
  // Clear join intent
  localStorage.removeItem('pendingJoinCode');
  localStorage.removeItem('pendingJoinCrewId');
  localStorage.removeItem('pendingJoinCrewName');
  
  // Redirect to crew
  navigate('/runcrew/central' or '/crew/crewadmin');
}
```

**localStorage Keys Read**:
- `pendingJoinCode` - Required (to complete join)
- `pendingJoinCrewName` - Optional (for display)

**localStorage Keys Set**:
- `athleteId` - Athlete ID
- `athleteProfile` - Full athlete profile object

**localStorage Keys Cleared** (after successful join):
- `pendingJoinCode`
- `pendingJoinCrewId`
- `pendingJoinCrewName`

**Error Handling**:
- Not authenticated → Redirects to signup
- Profile update fails → Shows error, allows retry
- Handle taken → Shows specific error message
- Join fails → Logs error, continues to athlete home

---

## Data Flow

### localStorage State Machine

**State 1: Join Intent Stored** (after JoinCodeWelcome)
```
pendingJoinCode: "FAST123"
pendingJoinCrewId: "crew_cuid"
pendingJoinCrewName: "Morning Warriors"
```

**State 2: After Signup** (after JoinCrewAthSignup)
```
firebaseToken: "eyJ..."
firebaseId: "firebase_uid"
email: "user@example.com"
athleteId: "athlete_cuid"
pendingJoinCode: "FAST123" (still present if profile incomplete)
pendingJoinCrewId: "crew_cuid" (still present)
pendingJoinCrewName: "Morning Warriors" (still present)
```

**State 3: After Profile Creation** (after JoinCrewAthProfile)
```
firebaseToken: "eyJ..."
firebaseId: "firebase_uid"
email: "user@example.com"
athleteId: "athlete_cuid"
athleteProfile: {...}
runCrewId: "crew_cuid"
runCrewData: {...}
pendingJoinCode: (cleared)
pendingJoinCrewId: (cleared)
pendingJoinCrewName: (cleared)
```

---

## Backend API Calls

### 1. Lookup Crew (Public)
**Route**: `POST /api/runcrew/lookup`  
**Auth**: None required  
**Body**: `{ joinCode: "FAST123" }`  
**Response**: `{ success: true, id, name, description, memberCount, admin: {...} }`

### 2. Upsert Athlete
**Route**: `POST /api/athlete/create`  
**Auth**: Firebase token required  
**Body**: `{}` (Firebase data extracted from token)  
**Response**: `{ success: true, athleteId, data: { id, email, gofastHandle, ... } }`

### 3. Update Profile
**Route**: `PUT /api/athlete/:id/profile`  
**Auth**: Firebase token required  
**Body**: `{ firstName, lastName, gofastHandle, birthday, gender, city, state, primarySport, ... }`  
**Response**: `{ success: true, athlete: {...} }`

### 4. Join Crew
**Route**: `POST /api/runcrew/join`  
**Auth**: Firebase token required  
**Body**: `{ joinCode: "FAST123" }`  
**Response**: `{ success: true, runCrew: {...}, membership: {...} }`

---

## Fragility Points & Mitigations

### 1. localStorage Cleared Mid-Flow

**Problem**: User clears browser data between steps  
**Impact**: `pendingJoinCode` lost, can't complete join  
**Mitigation**: 
- Show error if `pendingJoinCode` missing in JoinCrewAthSignup
- Redirect back to `/join/:code` with error message
- Could store in sessionStorage as backup (but sessionStorage cleared on tab close)

### 2. Join Code Invalid/Expired

**Problem**: Join code becomes invalid between lookup and join  
**Impact**: Join fails at final step  
**Mitigation**:
- Backend validates join code on join (not just lookup)
- Shows clear error message
- Could re-validate before signup (extra API call)

### 3. User Already Has Account

**Problem**: User signs in but already has athlete account  
**Impact**: Should work fine (upsert handles it)  
**Mitigation**:
- `POST /api/athlete/create` upserts (finds existing or creates new)
- No special handling needed

### 4. Profile Already Complete

**Problem**: User signs in, athlete exists, profile already complete  
**Impact**: Should skip profile step  
**Mitigation**:
- JoinCrewAthSignup checks `gofastHandle` → if exists, joins immediately
- No profile step needed

### 5. Network Failures

**Problem**: API calls fail mid-flow  
**Impact**: User stuck, data inconsistent  
**Mitigation**:
- Error messages at each step
- Retry buttons
- Clear error states
- Don't clear localStorage until success confirmed

### 6. Multiple Tabs/Windows

**Problem**: User opens multiple tabs, localStorage shared  
**Impact**: Race conditions, duplicate joins  
**Mitigation**:
- Backend prevents duplicate memberships (unique constraint)
- Frontend could add debouncing (but backend handles it)

---

## Error Recovery

### If `pendingJoinCode` Missing

**In JoinCrewAthSignup**:
```javascript
if (!pendingJoinCode) {
  setError('No join code found. Please start from the invite link.');
  // Could redirect to /join with error message
  return;
}
```

**In JoinCrewAthProfile**:
```javascript
const pendingJoinCode = localStorage.getItem('pendingJoinCode');
if (!pendingJoinCode) {
  // No join intent - just complete profile, go to home
  navigate('/athlete-home');
  return;
}
```

### If Join Fails

**In JoinCrewAthSignup**:
```javascript
try {
  const joinResponse = await api.post('/runcrew/join', { joinCode });
  // Success handling...
} catch (error) {
  setError(error.response?.data?.message || 'Failed to join crew');
  // Don't clear pendingJoinCode - allow retry
}
```

**In JoinCrewAthProfile**:
```javascript
try {
  const joinResponse = await api.post('/runcrew/join', { joinCode });
  // Success handling...
} catch (joinError) {
  console.error('Failed to complete join:', joinError);
  // Continue to athlete home (profile created, join failed)
  navigate('/athlete-home');
}
```

---

## Testing Checklist

- [ ] New user clicks invite link → sees crew preview
- [ ] New user clicks "Join This Crew" → sees soft join success
- [ ] Redirects to signup → signs in with Google
- [ ] If profile incomplete → redirects to profile creation
- [ ] Completes profile → joins crew → redirects to crew
- [ ] If profile complete → joins immediately → redirects to crew
- [ ] If localStorage cleared → shows error, can recover
- [ ] If join code invalid → shows error, can retry
- [ ] If network fails → shows error, can retry
- [ ] If user already has account → upserts correctly
- [ ] If user already member → prevents duplicate join

---

## Future Improvements

1. **Session Storage Backup**: Store join intent in sessionStorage as backup
2. **Re-validation**: Re-validate join code before signup (extra safety)
3. **Progress Indicator**: Show step progress (1/3, 2/3, 3/3)
4. **Deep Linking**: Support `/join/:code/signup` and `/join/:code/profile` routes
5. **Join Code Expiration**: Backend tracks expiration, frontend shows warning
6. **Analytics**: Track drop-off points in flow

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ Implemented, Ready for Testing

