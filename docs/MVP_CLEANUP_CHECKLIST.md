# MVP Cleanup Checklist

**Quick reference for removing hardcoded test data and preparing for MVP**

---

## 🔴 Critical: Hardcoded Test Data to Remove

### 1. Create Run Form Prefill
**File**: `src/Pages/RunCrew/RunCrewCentralAdmin.jsx`  
**Lines**: 14-30

**Current** (REMOVE):
```javascript
return {
  title: 'Saturday Sunrise Run',  // ❌ REMOVE
  date: formattedDate,  // ✅ KEEP (date calculation)
  time: '6:30 AM',  // ❌ REMOVE
  meetUpPoint: 'Central Park – Bethesda Terrace',  // ❌ REMOVE
  meetUpAddress: 'Central Park, New York, NY',  // ❌ REMOVE
  totalMiles: '5.0',  // ❌ REMOVE
  pace: '8:00-8:30',  // ❌ REMOVE
  description: 'Early morning run to start the weekend right. All paces welcome!',  // ❌ REMOVE
  stravaMapUrl: ''  // ✅ KEEP (empty is fine)
};
```

**Should Be**:
```javascript
return {
  title: '',  // ✅ Empty
  date: formattedDate,  // ✅ Keep date calculation
  time: '',  // ✅ Empty
  meetUpPoint: '',  // ✅ Empty
  meetUpAddress: '',  // ✅ Empty
  totalMiles: '',  // ✅ Empty
  pace: '',  // ✅ Empty
  description: '',  // ✅ Empty
  stravaMapUrl: ''  // ✅ Empty
};
```

---

### 2. Profile Creation Prefill
**File**: `src/Pages/Athlete/AthleteCreateProfile.jsx`  
**Lines**: 10-24

**Current** (REMOVE):
```javascript
const [formData, setFormData] = useState({
  firstName: 'Adam',  // ❌ REMOVE
  lastName: 'Cole',  // ❌ REMOVE
  phoneNumber: '',  // ✅ KEEP (empty)
  birthday: '1990-01-15',  // ❌ REMOVE
  gender: 'male',  // ❌ REMOVE
  city: 'Arlington',  // ❌ REMOVE
  state: 'VA',  // ❌ REMOVE
  primarySport: 'running',  // ❌ REMOVE
  gofastHandle: 'adamgofast',  // ❌ REMOVE
  bio: 'Passionate runner. Building communities.',  // ❌ REMOVE
  instagram: '',  // ✅ KEEP (empty)
  profilePhoto: null,  // ✅ KEEP
  profilePhotoPreview: null  // ✅ KEEP
});
```

**Should Be**:
```javascript
const [formData, setFormData] = useState({
  firstName: '',  // ✅ Empty
  lastName: '',  // ✅ Empty
  phoneNumber: '',  // ✅ Empty
  birthday: '',  // ✅ Empty
  gender: '',  // ✅ Empty
  city: '',  // ✅ Empty
  state: '',  // ✅ Empty
  primarySport: '',  // ✅ Empty
  gofastHandle: '',  // ✅ Empty
  bio: '',  // ✅ Empty
  instagram: '',  // ✅ Empty
  profilePhoto: null,  // ✅ Keep
  profilePhotoPreview: null  // ✅ Keep
});
```

**Note**: Keep the `useEffect` that loads Firebase photo (lines 27-38) - that's fine!

---

### 3. Edit Profile Placeholders
**File**: `src/Pages/Athlete/EditProfile.jsx`  
**Lines**: 374-388

**Current** (CHECK):
```javascript
placeholder="Charlotte"  // ⚠️ Just a placeholder, but remove for MVP
placeholder="NC"  // ⚠️ Just a placeholder, but remove for MVP
```

**Should Be**:
```javascript
placeholder="City"  // ✅ Generic placeholder
placeholder="State"  // ✅ Generic placeholder
```

---

### 4. Events Prefill Function
**File**: `src/Pages/Settings/EventManagement.jsx`  
**Lines**: 52-79

**Action**: ❌ **DELETE ENTIRE FUNCTION** - Events are removed from MVP

```javascript
// DELETE THIS ENTIRE FUNCTION:
const prefillBoysOnRun5K = () => {
  // ... entire function
};
```

---

## 🟡 Events Removal

### Files to Remove/Disable

1. **Routes in `App.jsx`**:
   - Comment out `/settings/events` route
   - Comment out `/volunteer-management` routes

2. **Navigation Links**:
   - `src/Pages/Athlete/AthleteHome.jsx` - Remove Events section from sidebar
   - `src/Pages/Settings/Settings.jsx` - Remove Events link

3. **Files to Keep (Don't Delete)**:
   - Keep `EventManagement.jsx` (may use post-MVP)
   - Keep `VolunteerManagement.jsx` (may use post-MVP)
   - Just don't expose in UI

---

## ✅ Already Fixed

- ✅ RunCrew hydration chaos (leaderboard metric switching)
- ✅ RunCrew or bust redirect (AthleteHome)
- ✅ Create Run date validation (time format conversion)
- ✅ RSVP API exists and works

---

## 🧪 Testing After Cleanup

### Test Create Run Form
1. Open RunCrew Admin
2. Click "Create Run"
3. Verify all fields are empty
4. Fill in required fields manually
5. Submit and verify it works

### Test Profile Creation
1. Sign up as new user
2. Go to profile creation
3. Verify all fields are empty
4. Fill in profile manually
5. Submit and verify it works

### Test RunCrew Flow
1. Sign up → Should redirect to join/create crew
2. Join a crew → Should redirect to RunCrew Central
3. Create a run → Form should be empty
4. RSVP to run → Should work
5. Switch leaderboard metrics → No hydration chaos

---

## 📝 Quick Fix Commands

```bash
# 1. Remove Create Run prefill
# Edit: src/Pages/RunCrew/RunCrewCentralAdmin.jsx lines 14-30

# 2. Remove Profile prefill
# Edit: src/Pages/Athlete/AthleteCreateProfile.jsx lines 10-24

# 3. Update Edit Profile placeholders
# Edit: src/Pages/Athlete/EditProfile.jsx lines 374-388

# 4. Remove Events navigation
# Edit: src/Pages/Athlete/AthleteHome.jsx (remove Events section)
# Edit: src/Pages/Settings/Settings.jsx (remove Events link)
# Edit: src/App.jsx (comment out Events routes)
```

---

**Status**: Ready for cleanup  
**Priority**: High (blocks MVP)  
**Estimated Time**: 30 minutes

