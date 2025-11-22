# GoFast MVP - "Go To MVP" Plan

**Last Updated**: January 2025  
**Goal**: Ship a runcrew-first MVP that's ready for mobile app conversion (Next.js → React Native/Expo)

---

## 🎯 MVP Philosophy: RunCrew First

**Core Principle**: The app is **RunCrew or bust**. If you don't have a crew, you're redirected to join/create one. No home page without a crew.

**User Journey**:
1. Sign up → Create/Join RunCrew (required)
2. Connect Garmin (optional but encouraged)
3. Track activities → See on leaderboard
4. Join runs → RSVP to crew runs
5. Chat with crew → Messages and announcements

---

## ✅ Current State Review

### What's Working
- ✅ **RunCrew hydration** - Fixed hydration chaos on leaderboard metric switching
- ✅ **RunCrew or bust redirect** - AthleteHome now redirects to join/create if no crew
- ✅ **Create Run date validation** - Fixed invalid date error (time format conversion)
- ✅ **RSVP API exists** - `POST /api/runcrew/runs/:runId/rsvp` ready to use
- ✅ **Onboarding flows** - Multiple join paths (direct invite, authenticated join, etc.)

### What Needs Cleanup

#### 1. Hardcoded Prefill Data (Remove for MVP)

**Location**: `src/Pages/RunCrew/RunCrewCentralAdmin.jsx`
```javascript
// Lines 14-30: Remove hardcoded prefill
const getInitialRunForm = () => {
  // REMOVE: 'Saturday Sunrise Run', 'Central Park', etc.
  // KEEP: Only date calculation (tomorrow)
  return {
    title: '',  // Empty
    date: formattedDate,  // Keep date calculation
    time: '',  // Empty
    meetUpPoint: '',  // Empty
    // ... all empty
  };
};
```

**Location**: `src/Pages/Settings/EventManagement.jsx`
```javascript
// Lines 52-79: Remove prefillBoysOnRun5K function
// REMOVE entire function - events are being removed for MVP
```

#### 2. Profile Pages Review

**Files to Check**:
- `src/Pages/Athlete/AthleteCreateProfile.jsx` - Check for hardcoded test data
- `src/Pages/Athlete/EditProfile.jsx` - Check for hardcoded test data
- `src/Pages/Athlete/AthleteProfile.jsx` - Display only, should be clean

**Action**: Search for any hardcoded values like "Adam Cole", "Charlotte", "NC", etc. and remove.

#### 3. Events Removal

**Files to Remove/Disable**:
- `src/Pages/Settings/EventManagement.jsx` - Remove from MVP
- `src/Pages/Athlete/VolunteerManagement.jsx` - Remove from MVP
- `src/Pages/Settings/VacantVolunteer.jsx` - Remove from MVP
- Routes in `App.jsx`:
  - `/settings/events`
  - `/volunteer-management`
  - `/volunteer-management/vacant`

**Action**: 
- Comment out routes in `App.jsx`
- Remove navigation links to events from Settings page
- Keep backend API (don't break it, just don't expose in UI)

---

## 📋 MVP Checklist

### Phase 1: Cleanup & Hardcoded Data Removal
- [ ] Remove hardcoded prefill from `RunCrewCentralAdmin.jsx` (Create Run form)
- [ ] Remove `prefillBoysOnRun5K` from `EventManagement.jsx`
- [ ] Review and remove any hardcoded test data from profile pages
- [ ] Remove Events navigation and routes from MVP
- [ ] Update Settings page to remove Events link
- [ ] Test Create Run form with empty fields

### Phase 2: RunCrew-First Flow Verification
- [ ] Verify AthleteHome redirects to join/create if no crew
- [ ] Test onboarding flow: Sign up → Join/Create Crew → Home
- [ ] Test direct invite link flow: `/join/:code` → Sign up → Auto-join
- [ ] Test authenticated join flow: Home → Join Crew → Enter code
- [ ] Verify hydration works reliably on RunCrewCentral load
- [ ] Test leaderboard metric switching (no hydration chaos)

### Phase 3: Core Features Verification
- [ ] **Garmin Connection** - Optional but working
- [ ] **Activity Tracking** - Activities sync and display
- [ ] **Leaderboard** - Shows miles/runs/calories correctly
- [ ] **Create Run** - Form works with empty fields, date validation works
- [ ] **RSVP to Runs** - Members can RSVP "going/not-going"
- [ ] **Crew Chat** - Messages work
- [ ] **Announcements** - Admin can post, members see them

### Phase 4: Run Signup API (Quick Add)
- [ ] Verify RSVP API endpoint: `POST /api/runcrew/runs/:runId/rsvp`
- [ ] Test RSVP flow in RunCrewCentral (already implemented)
- [ ] Verify RSVP displays correctly in RunCrewCentralAdmin
- [ ] Test RSVP status changes (going → not-going)

**Status**: ✅ RSVP API already exists and is working! Just verify it's being used correctly.

### Phase 5: Mobile App Preparation
- [ ] Document Next.js migration requirements (see below)
- [ ] List all routes that need conversion
- [ ] Document state management (localStorage patterns)
- [ ] Document API patterns (axios interceptors, auth)

---

## 🚀 Next.js Migration Plan (For Mobile Apps)

### Why Next.js?
- **React Native/Expo**: Can share components between web and mobile
- **Server-Side Rendering**: Better SEO and initial load
- **API Routes**: Can consolidate backend calls
- **Static Generation**: Better performance for public pages

### Migration Requirements

#### 1. Route Conversion

**Current**: React Router (`react-router-dom`)
```javascript
// App.jsx
<Route path="/athlete-home" element={<AthleteHome />} />
<Route path="/runcrew/central" element={<RunCrewCentral />} />
```

**Next.js**: File-based routing
```
app/
  athlete-home/
    page.tsx          // AthleteHome component
  runcrew/
    central/
      page.tsx        // RunCrewCentral component
    join-or-start/
      page.tsx        // JoinOrStartCrew component
```

**Routes to Convert** (Priority Order):
1. **Core RunCrew Routes** (MVP Priority)
   - `/runcrew/central` → `app/runcrew/central/page.tsx`
   - `/runcrew/join-or-start` → `app/runcrew/join-or-start/page.tsx`
   - `/runcrew/join` → `app/runcrew/join/page.tsx`
   - `/crew/crewadmin` → `app/crew/crewadmin/page.tsx`

2. **Auth Routes**
   - `/athlete-welcome` → `app/athlete-welcome/page.tsx`
   - `/athletesignin` → `app/athletesignin/page.tsx`
   - `/athletesignup` → `app/athletesignup/page.tsx`

3. **Profile Routes**
   - `/athlete-home` → `app/athlete-home/page.tsx`
   - `/athlete-profile` → `app/athlete-profile/page.tsx`
   - `/athlete-create-profile` → `app/athlete-create-profile/page.tsx`

4. **Activity Routes**
   - `/my-activities` → `app/my-activities/page.tsx`
   - `/activity/[id]` → `app/activity/[id]/page.tsx`

5. **Settings Routes**
   - `/settings` → `app/settings/page.tsx`
   - `/garmin/callback` → `app/garmin/callback/page.tsx`

#### 2. State Management

**Current**: localStorage + React state
```javascript
// LocalStorageAPI pattern
LocalStorageAPI.setAthleteProfile(athlete);
const athlete = LocalStorageAPI.getAthleteProfile();
```

**Next.js Options**:
- **Keep localStorage** - Works in Next.js (client-side only)
- **Add Zustand/Redux** - For shared state across pages
- **Server Components** - For initial data loading (SSR)

**Recommendation**: Keep localStorage pattern, add Zustand for shared state:
```typescript
// stores/athleteStore.ts
import create from 'zustand';
import { LocalStorageAPI } from '@/lib/LocalStorageConfig';

interface AthleteStore {
  athlete: Athlete | null;
  loadAthlete: () => void;
}

export const useAthleteStore = create<AthleteStore>((set) => ({
  athlete: LocalStorageAPI.getAthleteProfile(),
  loadAthlete: () => set({ athlete: LocalStorageAPI.getAthleteProfile() }),
}));
```

#### 3. API Patterns

**Current**: Axios with interceptors
```javascript
// api/axiosConfig.js
api.interceptors.request.use(async (config) => {
  const token = await user.getIdToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Next.js Options**:
- **Keep axios** - Works fine in Next.js
- **Use fetch** - Native Next.js pattern
- **API Routes** - Create `/api/*` routes in Next.js for proxy

**Recommendation**: Keep axios pattern, add Next.js API routes for proxy:
```typescript
// app/api/runcrew/hydrate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Proxy to backend, add auth token
  const response = await fetch('https://backend.../api/runcrew/hydrate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: await request.text(),
  });
  return NextResponse.json(await response.json());
}
```

#### 4. Authentication

**Current**: Firebase Auth (client-side)
```javascript
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
```

**Next.js Options**:
- **Keep Firebase Auth** - Works in Next.js (client components)
- **Add Middleware** - Protect routes server-side
- **Session Management** - Use NextAuth.js or custom sessions

**Recommendation**: Keep Firebase Auth, add middleware for route protection:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseToken');
  
  // Protect authenticated routes
  if (request.nextUrl.pathname.startsWith('/athlete-home') && !token) {
    return NextResponse.redirect(new URL('/athletesignin', request.url));
  }
  
  return NextResponse.next();
}
```

#### 5. Mobile App Conversion (Post-Next.js)

**React Native/Expo Setup**:
```bash
# Create Expo app
npx create-expo-app gofast-mobile --template

# Install shared dependencies
npm install axios firebase react-native-async-storage
```

**Shared Code Strategy**:
- **Components**: Share React components (with React Native compatibility)
- **API Layer**: Share axios config and API calls
- **State Management**: Share Zustand stores
- **Utils**: Share utility functions

**Platform-Specific**:
- **Navigation**: React Navigation (mobile) vs Next.js Router (web)
- **Storage**: AsyncStorage (mobile) vs localStorage (web)
- **UI Components**: React Native components (mobile) vs HTML (web)

---

## 📱 Mobile App Considerations

### App Store Requirements

**Google Play Store**:
- App bundle (AAB) format
- Privacy policy URL
- App icon (512x512)
- Screenshots (phone, tablet)
- Feature graphic (1024x500)

**Apple App Store**:
- App Store Connect setup
- Privacy policy URL
- App icon (1024x1024)
- Screenshots (multiple device sizes)
- App preview video (optional)

### Technical Requirements

**React Native/Expo**:
- ✅ Can use Firebase Auth
- ✅ Can use axios for API calls
- ✅ Can use AsyncStorage (localStorage equivalent)
- ✅ Can share components with Next.js web app

**Platform-Specific**:
- **Push Notifications**: Firebase Cloud Messaging (FCM) for Android, APNs for iOS
- **Deep Linking**: Handle invite links (`gofast://join/FAST123`)
- **Biometric Auth**: Face ID / Touch ID for mobile
- **Background Sync**: Sync activities in background

---

## 🎯 Final MVP Checklist

### Must Have (Ship Blockers)
- [ ] Remove all hardcoded prefill data
- [ ] Remove Events from MVP
- [ ] Verify RunCrew-first flow works end-to-end
- [ ] Test onboarding: Sign up → Join Crew → Home
- [ ] Test Create Run with empty form
- [ ] Test RSVP to runs (verify API works)
- [ ] Test leaderboard (no hydration chaos)
- [ ] Test crew chat and announcements

### Nice to Have (Post-MVP)
- [ ] Next.js migration (for mobile app prep)
- [ ] React Native/Expo setup
- [ ] Push notifications
- [ ] Deep linking for invite codes
- [ ] Background activity sync

### Documentation
- [ ] Update README with MVP scope
- [ ] Document removed features (Events)
- [ ] Document Next.js migration plan
- [ ] Document mobile app conversion strategy

---

## 🚦 Current Status

**✅ Completed**:
- RunCrew hydration chaos fixed
- RunCrew or bust redirect implemented
- Create Run date validation fixed
- RSVP API exists and works

**🔄 In Progress**:
- Hardcoded data cleanup
- Events removal
- Onboarding flow verification

**📋 Next Steps**:
1. Remove hardcoded prefill data
2. Remove Events from MVP
3. Test complete user journey
4. Document Next.js migration requirements

---

## 📝 Notes

### Run Signup API Status
✅ **Already Implemented**: `POST /api/runcrew/runs/:runId/rsvp`
- Status: `"going" | "maybe" | "not-going"`
- Upsert pattern (creates or updates)
- Returns RSVP with athlete details
- Used in `RunCrewCentral.jsx` for member RSVP
- Used in `RunCrewCentralAdmin.jsx` for admin view

**Action**: Just verify it's working correctly, no new API needed!

### Events Removal Rationale
- Events are complex (volunteers, rosters, etc.)
- Not core to RunCrew MVP
- Can be added back post-MVP
- Keeps MVP focused on core RunCrew experience

### Next.js Migration Priority
1. **High**: Core RunCrew routes (central, join, admin)
2. **Medium**: Auth routes (signin, signup, welcome)
3. **Low**: Settings, Activity pages (can migrate later)

---

**Last Updated**: January 2025  
**Next Review**: After Phase 1 cleanup complete

