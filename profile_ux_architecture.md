# Profile UX Architecture

## Premise

Athletes set up profiles that allow them to be **discovered at later stages** of the platform. This profile serves as the foundation for:
- Social features (discovery, following, connections)
- RunCrew matching and recommendations
- Coach-athlete connections
- Performance tracking and analytics
- Community engagement

## Core Philosophy

**Profile setup is optional but highly encouraged.** Athletes can:
- ✅ Skip the profile setup initially
- ✅ Return to complete it later
- ✅ Close the app mid-setup without losing progress
- ✅ Be reminded to complete their profile

## Profile Fields

### Required Fields (for discovery)
- **First Name** - Required for display
- **Email** - Already from Firebase auth
- **GoFast Handle** - Unique identifier for discovery (e.g., `@runnerjoe`)

### Optional Fields (enhance discovery)
- **Last Name** - Full name display
- **Profile Picture** - Visual identity
- **Bio/About** - Personal description
- **Location** (City, State) - Geographic discovery
- **Primary Sport** - Activity type filtering
- **Phone Number** - Contact (optional)
- **Social Links** - Instagram, Strava, etc. (future)

### Metadata (auto-populated)
- **Account Created** - Timestamp
- **Profile Completion %** - Calculated
- **Last Updated** - Timestamp

## Profile Page as Hub

### Profile Page Purpose

The **Profile page** serves as a **navigation hub** (not a data-heavy page) with:
- **Profile display** - Shows basic profile info (same fields as profile setup)
- **Hub icons** - Quick navigation to other preferences/settings (future UX)
- **Lightweight** - No heavy data hydration, just profile info + navigation icons

### Hub Design Pattern

```
Profile Page (Hub)
├── Profile Info (read-only, same as profile setup fields)
├── Edit Profile Button → Navigate to profile setup
└── Hub Icons (future preferences)
    ├── 🏃 Running Preferences (future)
    ├── 📱 Connected Devices → Settings page
    ├── 🎯 Goals & Targets (future)
    └── ⚙️ Advanced Settings (future)
```

**Key Principle**: Profile page is a **lightweight hub** - it shows profile info and provides navigation icons to deeper preference pages. It does NOT hydrate everything inline.

### Profile Setup Flow

### Initial Setup State
```
User signs up → Firebase Auth → Backend creates athlete record → Profile setup prompt
```

### Setup Modes

#### 1. **Onboarding Flow** (First-time users)
- Triggered after account creation
- Full-screen modal or dedicated page
- Progress indicator (e.g., "Step 1 of 5")
- **Save on blur** - Auto-save as user types
- **Draft state** - Store incomplete profile in localStorage + backend

#### 2. **Profile Picture Access** (Recovery mechanism)
- **Profile picture click** → Opens profile setup if incomplete
- If no picture exists → Shows avatar with "Complete Profile" badge
- Clicking avatar/name → Navigate to profile setup

#### 3. **Reminder System**
- **In-app reminders** - Orange banner on home page (see AthleteHome.jsx)
- **Profile completion badge** - Visual indicator on profile picture
- **Periodic prompts** - After X days of incomplete profile
- **Context-aware** - Remind when user tries to use discovery features

## State Management

### Profile Completion States

```javascript
const profileStates = {
  NOT_STARTED: 'not_started',      // 0% complete
  IN_PROGRESS: 'in_progress',       // 1-99% complete
  COMPLETE: 'complete',             // 100% complete (all discovery fields)
  OPTIMIZED: 'optimized'            // Complete + optional fields
};
```

### Completion Calculation

```javascript
const completionPercentage = {
  required: {
    firstName: 20,
    gofastHandle: 20,
    email: 10  // Already from auth
  },
  optional: {
    lastName: 10,
    profilePicture: 15,
    bio: 10,
    location: 5,
    primarySport: 5,
    phoneNumber: 5
  }
};

// Total: 100% (50% required + 50% optional)
```

### Backend Storage

```javascript
// Athlete model fields
{
  profileCompletion: {
    percentage: 45,
    requiredFields: ['firstName', 'gofastHandle'],
    optionalFields: ['bio'],
    missingFields: ['lastName', 'profilePicture', 'location', 'primarySport'],
    lastUpdated: '2025-01-15T10:30:00Z'
  },
  profileSetupState: 'in_progress' // or 'complete'
}
```

## Profile Picture Upload Strategy

### Options Analysis

#### Option 1: Phone Camera/Gallery (Recommended)
**Pros:**
- ✅ Native mobile experience
- ✅ Direct access to device photos
- ✅ Best UX for mobile users
- ✅ Works with `react-native-image-picker` if mobile app

**Cons:**
- ❌ Requires mobile permissions
- ❌ Web implementation needs file input

**Implementation:**
```javascript
// Web: HTML5 file input
<input 
  type="file" 
  accept="image/*" 
  capture="user"  // Opens camera on mobile
  onChange={handleImageUpload}
/>

// Mobile (React Native): react-native-image-picker
import ImagePicker from 'react-native-image-picker';
```

#### Option 2: File Upload (Web-friendly)
**Pros:**
- ✅ Works on all platforms
- ✅ Simple implementation
- ✅ No special permissions needed

**Cons:**
- ❌ Less native feel on mobile
- ❌ Requires file system access

**Implementation:**
```javascript
// Standard file input
<input 
  type="file" 
  accept="image/png,image/jpeg,image/jpg"
  onChange={handleFileUpload}
/>
```

#### Option 3: Hybrid Approach (Recommended)
**Best of both worlds:**
- **Mobile**: Use camera/gallery picker
- **Web**: Use file upload with drag-and-drop
- **Fallback**: Standard file input

### Upload Flow

```
1. User clicks profile picture area
2. Platform detection (mobile vs web)
3. Show appropriate picker:
   - Mobile: Camera/Gallery options
   - Web: File upload + drag-drop zone
4. Image selection
5. Image preview + crop (optional)
6. Resize/compress (if needed)
7. Upload to backend/storage
8. Update profile picture URL
9. Save to database
```

### Image Storage

**Backend Storage Options:**
- **AWS S3** - Scalable, CDN-ready
- **Cloudinary** - Image optimization built-in
- **Firebase Storage** - If already using Firebase
- **Backend local** - Simple but not scalable

**Recommended:** Cloudinary or S3 with CDN

### Image Processing

```javascript
// Backend processing
const imageProcessing = {
  maxSize: '2MB',
  formats: ['jpg', 'png', 'webp'],
  dimensions: {
    thumbnail: '150x150',
    profile: '400x400',
    original: 'max 2000x2000'
  },
  compression: 'quality: 80%'
};
```

## Reminder System Architecture

### Reminder Triggers

1. **Home Page Banner** (Primary)
   - Location: Below welcome message
   - Trigger: `profileCompletion < 50%`
   - Design: Orange banner with "Complete Profile →" button
   - Dismissible: Yes (save to localStorage)

2. **Profile Picture Badge**
   - Location: Avatar/profile picture
   - Trigger: `profileCompletion < 100%`
   - Design: Orange dot/badge on corner
   - Action: Click to open profile setup

3. **Periodic Reminders**
   - Trigger: After 3 days, 7 days, 14 days of incomplete profile
   - Location: In-app notification or banner
   - Frequency: Once per reminder period

4. **Context-Aware Reminders**
   - Trigger: When user tries to use discovery features
   - Examples:
     - Searching for athletes
     - Joining a RunCrew
     - Following another athlete
   - Message: "Complete your profile to be discovered!"

### Reminder State Management

```javascript
const reminderState = {
  lastReminderShown: '2025-01-10T10:00:00Z',
  reminderCount: 2,
  dismissed: false,
  dismissedAt: null,
  nextReminderDate: '2025-01-17T10:00:00Z' // 7 days from last
};
```

## Profile Page UI Components

### 1. Profile Page (Hub)
```
┌─────────────────────────────────────┐
│  Profile                             │
│                                      │
│         [Profile Photo]              │
│         Name                         │
│         @handle                      │
│         [Edit Profile]               │
│                                      │
│  Profile Info:                       │
│  - Bio                               │
│  - Phone                             │
│  - Location                          │
│  - Primary Sport                     │
│                                      │
│  Quick Links (Hub Icons):            │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ 📱  │ │ 🎯  │ │ ⚙️  │            │
│  │Devices│ │Goals │ │Settings│       │
│  └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────┘
```

**Design Notes**:
- **Lightweight hub** - Icons link to deeper pages, don't hydrate everything here
- **Future-proof** - Icons can be added for new preference types
- **Navigation pattern** - Click icon → Navigate to dedicated preference page

### 2. Profile Setup Modal/Page
```
┌─────────────────────────────────────┐
│  Complete Your Profile              │
│  [Progress: 45%]                    │
│                                      │
│  [Profile Picture Upload Zone]      │
│  [First Name] [Last Name]            │
│  [GoFast Handle]                     │
│  [Bio/About]                         │
│  [Location] [Primary Sport]          │
│                                      │
│  [Save & Continue] [Skip for Now]   │
└─────────────────────────────────────┘
```

### 2. Profile Picture Upload Component
```
┌─────────────────────────────────────┐
│         [Avatar Preview]            │
│      Click to upload photo          │
│                                      │
│  [📷 Take Photo] [🖼️ Choose from Gallery] │
│  [📁 Upload File]                   │
└─────────────────────────────────────┘
```

### 3. Profile Completion Indicator
```
┌─────────────────────────────────────┐
│  Profile: 45% Complete              │
│  ████████░░░░░░░░░░░░                │
│                                      │
│  Missing: Profile Picture, Location  │
│  [Complete Profile →]               │
└─────────────────────────────────────┘
```

## Recovery Mechanisms

### 1. Profile Picture Click
- **If incomplete**: Opens profile setup
- **If complete**: Opens profile view/edit
- **Visual indicator**: Badge on incomplete profiles

### 2. Settings Menu
- Always accessible via "Edit Profile" button
- Shows completion percentage
- Quick access to missing fields

### 3. Home Page Banner
- Persistent reminder for incomplete profiles
- Direct link to profile setup
- Dismissible but re-appears after period

### 4. Draft Recovery
- Auto-save incomplete profiles to backend
- Restore from draft on next login
- Show "Resume Setup" option

## Data Persistence

### Frontend Storage
```javascript
// localStorage
{
  profileDraft: {
    firstName: 'John',
    lastName: 'Doe',
    // ... partial data
  },
  lastSaved: '2025-01-15T10:30:00Z',
  reminderDismissed: false
}
```

### Backend Storage
```javascript
// Database (athlete table)
{
  profileDraft: {
    // Partial profile data
  },
  profileSetupState: 'in_progress',
  profileCompletion: 45,
  lastProfileUpdate: '2025-01-15T10:30:00Z'
}
```

## API Endpoints

### Profile Setup
```
POST   /api/athlete/profile/setup        # Start profile setup
PATCH  /api/athlete/profile/draft        # Save draft (partial)
PATCH  /api/athlete/profile/complete     # Complete profile
GET    /api/athlete/profile/completion   # Get completion status
```

### Profile Picture
```
POST   /api/athlete/profile/picture      # Upload profile picture
DELETE /api/athlete/profile/picture      # Remove profile picture
GET    /api/athlete/profile/picture      # Get profile picture URL
```

### Reminders
```
GET    /api/athlete/profile/reminder     # Check if reminder needed
POST   /api/athlete/profile/reminder/dismiss  # Dismiss reminder
```

## User Experience Flow

### Happy Path (Complete Setup)
```
1. Sign up → Firebase auth
2. Redirect to profile setup
3. Upload profile picture
4. Fill in required fields
5. Add optional fields
6. Save → 100% complete
7. Access to discovery features
```

### Skip Path (Partial Setup)
```
1. Sign up → Firebase auth
2. Redirect to profile setup
3. User clicks "Skip for Now"
4. Profile saved at 10% (just email)
5. Home page shows reminder banner
6. User can return via profile picture click
```

### Recovery Path (Interrupted Setup)
```
1. User starts profile setup
2. Fills in some fields
3. Accidentally closes app
4. Draft saved to localStorage + backend
5. Next login: "Resume Setup" option
6. User completes profile
```

## Discovery Integration

### Profile Completeness for Discovery
- **Minimum for discovery**: 50% complete (required fields)
- **Full discovery**: 100% complete (all fields)
- **Search visibility**: Based on completion percentage

### Discovery Features Requiring Profile
- ✅ Search athletes by name/handle
- ✅ View athlete profiles
- ✅ Follow/connect with athletes
- ✅ Join RunCrews (recommendations)
- ✅ Coach-athlete matching

## Profile Hub Navigation Pattern

### Hub Icons (Future Preferences)

The profile page serves as a **navigation hub** with icon-based links to deeper preference pages:

**Current Hub Icons**:
- **📱 Connected Devices** → Navigate to Settings page (Garmin, Strava)
- **✏️ Edit Profile** → Navigate to Profile Setup page

**Future Hub Icons** (not implemented yet):
- **🏃 Running Preferences** → Dedicated running preferences page (pace, distance, goals)
- **🎯 Goals & Targets** → Training goals and race targets
- **⚙️ Advanced Settings** → Account settings, notifications, privacy
- **📊 Stats & Analytics** → Performance dashboard (separate from profile)
- **👥 Social Settings** → Discovery preferences, following settings

### Hub Design Principles

1. **Lightweight** - Profile page does NOT hydrate heavy data
2. **Icon-based** - Visual icons for quick navigation
3. **Future-proof** - Easy to add new preference icons
4. **Separation of concerns** - Each icon links to dedicated page
5. **No inline preferences** - Don't cram everything into one page

### Example Hub Implementation

```javascript
// Profile page hub icons
const hubIcons = [
  {
    icon: '📱',
    title: 'Connected Devices',
    description: 'Garmin, Strava',
    path: '/settings',
    color: 'blue'
  },
  {
    icon: '🏃',
    title: 'Running Preferences',
    description: 'Pace, distance, goals',
    path: '/preferences/running', // Future
    color: 'orange',
    comingSoon: true
  },
  {
    icon: '🎯',
    title: 'Goals & Targets',
    description: 'Training goals',
    path: '/preferences/goals', // Future
    color: 'green',
    comingSoon: true
  }
];
```

## Future Enhancements

### Phase 2
- [ ] Profile hub with icon navigation
- [ ] Running preferences page (separate from profile)
- [ ] Goals & targets page (separate from profile)
- [ ] Profile picture cropping/editing
- [ ] Social media link integration

### Phase 3
- [ ] Profile verification badges
- [ ] Custom profile themes
- [ ] Profile analytics (views, connections)
- [ ] Profile sharing
- [ ] Profile templates
- [ ] Multi-sport profiles

## Implementation Checklist

### Profile Setup
- [x] Profile setup page/modal
- [x] Profile completion calculation
- [x] Reminder banner on home page
- [x] Profile picture upload (basic)
- [ ] Profile picture upload (camera/gallery)
- [ ] Draft saving/restoration
- [ ] Profile picture click recovery
- [ ] Periodic reminder system
- [ ] Context-aware reminders
- [ ] Backend API endpoints
- [ ] Image storage integration
- [ ] Profile completion badges

### Profile Hub
- [x] Profile page (read-only, same fields as setup)
- [x] Edit Profile button → Navigate to setup
- [x] Settings link → Navigate to settings page
- [ ] Hub icons component (navigation icons)
- [ ] Running preferences page (future)
- [ ] Goals & targets page (future)
- [ ] Advanced settings page (future)

**Note**: Profile page is a **lightweight hub** - it shows profile info and provides navigation icons. It does NOT hydrate everything inline.

---

**Last Updated**: 2025-01-15
**Status**: Draft - Ready for Implementation
**Next Steps**: Implement profile picture upload with camera/gallery support

