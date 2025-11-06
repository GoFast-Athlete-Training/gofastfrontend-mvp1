# GoFast Profile Architecture

**Last Updated**: November 2025  
**Purpose**: Comprehensive backend and frontend architecture for GoFast athlete profile system

---

## Overview

The GoFast Profile system is built on an **athlete-first architecture** where the `Athlete` model is the central identity entity. Profile data is stored directly in the `Athlete` model, with optional feature-specific fields for Training, Matching, and future features.

**Core Principle**: All profile data flows through the `Athlete` model. There is no separate "Profile" model - profile fields are part of the `Athlete` schema.

---

## Database Schema

### Athlete Model (Profile Fields)

**Location**: `gofastbackendv2-fall2025/prisma/schema.prisma`  
**Database Table**: `athletes`

The `Athlete` model contains all profile fields organized into logical groups. All fields are stored in a single `athletes` table.

#### Universal Profile Fields (MVP1 - Core Identity)

**Required Fields** (NOT NULL):
- `id` - String (cuid) - Primary key
- `firebaseId` - String (unique) - Firebase authentication ID
- `email` - String (unique) - Email identifier
- `createdAt` - DateTime - Account creation timestamp
- `updatedAt` - DateTime - Last update timestamp
- `garmin_is_connected` - Boolean (default: false) - Garmin connection status

**Nullable Profile Fields** (YES - can be null):
- `firstName` - String - First name (required for display, nullable for draft profiles)
- `lastName` - String - Last name (required for full name display, nullable for draft profiles)
- `phoneNumber` - String - Optional phone number
- `gofastHandle` - String (unique) - Unique handle for discovery (e.g., `@runnerjoe`) - **Required for discovery**
- `birthday` - DateTime - Date of birth (for age calculation)
- `gender` - String - Gender identity (male, female, other)
- `city` - String - City location
- `state` - String - State/Province (2-letter code)
- `primarySport` - String - Primary sport (running, cycling, swimming, triathlon, etc.)
- `photoURL` - String - Profile picture URL (Firebase Storage or uploaded file)
- `bio` - String - Short bio/description (max 250 characters)
- `instagram` - String - Instagram handle (optional social link)
- `status` - String - Optional status field

**Field Definitions**:
- `firstName` - Required for display (nullable for draft profiles)
- `lastName` - Required for full name display (nullable for draft profiles)
- `email` - Unique identifier from Firebase auth (required, NOT NULL)
- `phoneNumber` - Optional contact information
- `gofastHandle` - Unique handle for discovery (e.g., `@runnerjoe`) - **Required for discovery** (nullable but should be set)
- `birthday` - Date of birth (for age calculation)
- `gender` - Gender identity (male, female, other)
- `city` - City location
- `state` - State/Province (2-letter code)
- `primarySport` - Primary sport (running, cycling, swimming, triathlon, etc.)
- `photoURL` - Profile picture URL (Firebase Storage or uploaded file)
- `bio` - Short bio/description (max 250 characters)
- `instagram` - Instagram handle (optional social link)

#### Training Profile Fields (Stored in Athlete Model)

**Training-Specific Fields** (all nullable):
- `currentPace` - String - Current 5K pace (e.g., "6:25/mi")
- `weeklyMileage` - Integer - Weekly mileage target
- `trainingGoal` - String - Training goal/event description
- `targetRace` - String - Target race name
- `trainingStartDate` - DateTime - Training plan start date

**Purpose**: Training-specific profile data for athletes using the Training module.

**Usage**: These fields are populated when an athlete starts a training plan or adds a race goal.

#### Match Profile Fields (Stored in Athlete Model)

**Matching-Specific Fields** (all nullable):
- `preferredDistance` - String - Preferred running distance (1-3mi, 3-5mi, 5-8mi, etc.)
- `timePreference` - String - Time preference (Morning/Afternoon/Evening)
- `paceRange` - String - Pace range for matching
- `runningGoals` - String - Running goals (Stay consistent, Find crew, PR, etc.)

**Purpose**: Matching-specific profile data for athletes using the Matching feature.

**Usage**: These fields are populated when an athlete uses the "Find Matches" feature.

#### Integration Fields (Garmin/Strava)

**Garmin OAuth 2.0 PKCE Integration Fields** (all nullable except `garmin_is_connected`):
- `garmin_user_id` - String (unique) - Garmin's unique user ID
- `garmin_access_token` - String - OAuth access token
- `garmin_refresh_token` - String - OAuth refresh token
- `garmin_expires_in` - Integer - Token expiration time in seconds
- `garmin_scope` - String - OAuth scope permissions
- `garmin_connected_at` - DateTime - When Garmin was connected
- `garmin_last_sync_at` - DateTime - Last data sync timestamp
- `garmin_permissions` - JSON - Garmin permission details
- `garmin_is_connected` - Boolean (default: false) - Simple connected status (NOT NULL)
- `garmin_disconnected_at` - DateTime - When user disconnected
- `garmin_user_profile` - JSON - Rich user profile data from Garmin API
- `garmin_user_sleep` - JSON - Sleep preferences
- `garmin_user_preferences` - JSON - User preferences and settings

**Strava Integration Fields** (all nullable):
- `strava_id` - Integer (unique) - Strava athlete ID
- `strava_access_token` - String - Strava OAuth access token
- `strava_refresh_token` - String - Strava OAuth refresh token
- `strava_expires_at` - Integer - Token expiration timestamp

**Purpose**: OAuth integration data for Garmin Connect and Strava.

**Note**: These fields are managed by the Garmin/Strava integration routes, not profile routes. They are included in the schema for completeness but are not part of the profile setup flow.

### Complete Field Reference (Database Schema)

**Table**: `athletes`  
**Total Fields**: 44

| # | Field Name | Type | Nullable | Default | Description |
|---|------------|------|----------|---------|-------------|
| 1 | `id` | text | NO | - | Primary key (cuid) |
| 2 | `firebaseId` | text | NO | - | Firebase authentication ID (unique) |
| 3 | `firstName` | text | YES | - | First name |
| 4 | `lastName` | text | YES | - | Last name |
| 5 | `email` | text | NO | - | Email identifier (unique) |
| 6 | `phoneNumber` | text | YES | - | Phone number |
| 7 | `gofastHandle` | text | YES | - | GoFast handle (unique) |
| 8 | `birthday` | timestamp(3) | YES | - | Date of birth |
| 9 | `gender` | text | YES | - | Gender identity |
| 10 | `city` | text | YES | - | City location |
| 11 | `state` | text | YES | - | State/Province |
| 12 | `primarySport` | text | YES | - | Primary sport |
| 13 | `photoURL` | text | YES | - | Profile picture URL |
| 14 | `bio` | text | YES | - | Bio/description |
| 15 | `instagram` | text | YES | - | Instagram handle |
| 16 | `currentPace` | text | YES | - | Current 5K pace (Training) |
| 17 | `weeklyMileage` | int4 | YES | - | Weekly mileage (Training) |
| 18 | `trainingGoal` | text | YES | - | Training goal (Training) |
| 19 | `targetRace` | text | YES | - | Target race (Training) |
| 20 | `trainingStartDate` | timestamp(3) | YES | - | Training start date (Training) |
| 21 | `preferredDistance` | text | YES | - | Preferred distance (Match) |
| 22 | `timePreference` | text | YES | - | Time preference (Match) |
| 23 | `paceRange` | text | YES | - | Pace range (Match) |
| 24 | `runningGoals` | text | YES | - | Running goals (Match) |
| 25 | `garmin_user_id` | text | YES | - | Garmin user ID (unique) |
| 26 | `garmin_access_token` | text | YES | - | Garmin access token |
| 27 | `garmin_refresh_token` | text | YES | - | Garmin refresh token |
| 28 | `garmin_expires_in` | int4 | YES | - | Token expiration (seconds) |
| 29 | `garmin_scope` | text | YES | - | OAuth scope |
| 30 | `garmin_connected_at` | timestamp(3) | YES | - | Connection timestamp |
| 31 | `garmin_last_sync_at` | timestamp(3) | YES | - | Last sync timestamp |
| 32 | `garmin_permissions` | jsonb | YES | - | Garmin permissions |
| 33 | `garmin_is_connected` | bool | NO | false | Connection status |
| 34 | `garmin_disconnected_at` | timestamp(3) | YES | - | Disconnection timestamp |
| 35 | `strava_id` | int4 | YES | - | Strava athlete ID (unique) |
| 36 | `strava_access_token` | text | YES | - | Strava access token |
| 37 | `strava_refresh_token` | text | YES | - | Strava refresh token |
| 38 | `strava_expires_at` | int4 | YES | - | Token expiration timestamp |
| 39 | `garmin_user_profile` | jsonb | YES | - | Garmin user profile data |
| 40 | `garmin_user_sleep` | jsonb | YES | - | Garmin sleep preferences |
| 41 | `garmin_user_preferences` | jsonb | YES | - | Garmin user preferences |
| 42 | `createdAt` | timestamp(3) | NO | CURRENT_TIMESTAMP | Account creation |
| 43 | `updatedAt` | timestamp(3) | NO | - | Last update timestamp |
| 44 | `status` | text | YES | - | Optional status field |

**Field Categories**:
- **Universal Profile** (Fields 1-15, 42-44): Core identity and profile fields
- **Training Profile** (Fields 16-20): Training-specific fields
- **Match Profile** (Fields 21-24): Matching-specific fields
- **Garmin Integration** (Fields 25-34, 39-41): Garmin OAuth and data
- **Strava Integration** (Fields 35-38): Strava OAuth and data

---

## API Routes

### Athlete Creation Route (Find or Create)

**Location**: `gofastbackendv2-fall2025/routes/Athlete/athleteCreateRoute.js`  
**Service**: `gofastbackendv2-fall2025/services/AthleteFindOrCreateService.js`

#### Find or Create Athlete

**Endpoint**: `POST /api/athlete/create`

**Authentication**: Required (Firebase token via `verifyFirebaseToken` middleware)

**Request**: No body required - all data comes from verified Firebase token

**Flow**:
1. Firebase token verified → `req.user` contains `firebaseId`, `email`, `name` (displayName), `picture`
2. Service checks if athlete exists by `firebaseId`
3. If exists → Updates Firebase data (email, firstName, lastName, photoURL) and returns existing athlete
4. If not exists → Creates new athlete with Firebase data and returns new athlete

**Response**:
```json
{
  "success": true,
  "message": "Athlete found or created",
  "athleteId": "athlete123",
  "data": {
    "id": "athlete123",
    "firebaseId": "firebase123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "gofastHandle": null,
    "photoURL": "https://...",
    // ... all athlete fields
  }
}
```

**Implementation Notes**:
- Uses `AthleteFindOrCreateService.findOrCreate()` - service layer handles business logic
- Uses Prisma `upsert` for atomic find-or-create operation
- Upserts all Firebase data: `email`, `firstName` (from displayName), `lastName` (from displayName), `photoURL`
- Route is thin - just HTTP handling, service does the work
- Always returns 200 - frontend routes based on data, not HTTP status
- Frontend routes based on `gofastHandle` (data-driven, no flags):
  - If `gofastHandle` exists → route to `/athlete-home` (profile complete)
  - If `gofastHandle` is null → route to `/athlete-create-profile` (needs profile setup)

**Service Pattern**:
```javascript
// Service handles business logic - returns athlete object
AthleteFindOrCreateService.findOrCreate({
  firebaseId,    // From req.user.uid
  email,         // From req.user.email
  displayName,   // From req.user.name (parsed into firstName/lastName)
  picture        // From req.user.picture
}) → athlete

// Route is thin - just HTTP handling
router.post('/create', verifyFirebaseToken, async (req, res) => {
  const athlete = await AthleteFindOrCreateService.findOrCreate(...);
  const response = AthleteFindOrCreateService.formatResponse(athlete);
  return res.status(200).json(response);
});
```

**Key Principle**: **Data-driven routing** - Use `gofastHandle` in the response to determine routing, not flags. `athleteId` is always returned (the mutation result).

### Profile Routes

**Location**: `gofastbackendv2-fall2025/routes/Athlete/athleteProfileRoute.js`

#### Update Profile

**Endpoint**: `PUT /api/athlete/:id/profile`

**Authentication**: Not currently required (should add Firebase token verification)

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "(555) 123-4567",
  "gofastHandle": "johndoe",
  "birthday": "1990-01-15",
  "gender": "male",
  "city": "Charlotte",
  "state": "NC",
  "primarySport": "running",
  "bio": "Passionate runner focused on marathon training.",
  "instagram": "@johndoe_runs",
  "photoURL": "https://..."
}
```

**Response**:
```json
{
  "success": true,
  "athlete": {
    "id": "athlete123",
    "firebaseId": "firebase123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "gofastHandle": "johndoe",
    "birthday": "1990-01-15T00:00:00.000Z",
    "gender": "male",
    "city": "Charlotte",
    "state": "NC",
    "primarySport": "running",
    "bio": "Passionate runner focused on marathon training.",
    "instagram": "@johndoe_runs",
    "photoURL": "https://..."
  }
}
```

**Implementation Notes**:
- Updates all profile fields in a single request
- Uses Prisma `update` to modify athlete record
- Returns updated athlete object
- **TODO**: Add Firebase token verification middleware
- **TODO**: Add validation for required fields
- **TODO**: Add profile completion calculation

### Hydration Routes

**Location**: `gofastbackendv2-fall2025/routes/Athlete/athletepersonhydrateRoute.js`

#### Universal Athlete Hydrate

**Endpoint**: `GET /api/athlete/hydrate`

**Authentication**: Required (Firebase token via `verifyFirebaseToken` middleware)

**Response**: Returns complete athlete profile with all relations:
```json
{
  "success": true,
  "message": "Athlete hydrated successfully",
  "athlete": {
    "athleteId": "athlete123",
    "firebaseId": "firebase123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "gofastHandle": "johndoe",
    "birthday": "1990-01-15T00:00:00.000Z",
    "gender": "male",
    "city": "Charlotte",
    "state": "NC",
    "primarySport": "running",
    "photoURL": "https://...",
    "bio": "Passionate runner focused on marathon training.",
    "instagram": "@johndoe_runs",
    "status": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z",
    "garmin": {
      "connected": true,
      "connectedAt": "2025-01-10T00:00:00.000Z",
      "lastSyncAt": "2025-01-15T10:00:00.000Z"
    },
    "runCrews": [...],
    "runCrewCount": 1,
    "adminRunCrews": [...],
    "adminRunCrewCount": 0,
    "weeklyActivities": [...],
    "weeklyActivityCount": 5,
    "weeklyTotals": {
      "totalDistanceMiles": "25.5",
      "totalDuration": 7200,
      "totalCalories": 2500,
      "activityCount": 5
    },
    "fullName": "John Doe",
    "profileComplete": true,
    "hasLocation": true,
    "hasSport": true,
    "hasBio": true
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Implementation Notes**:
- Finds athlete by `firebaseId` from verified Firebase token
- Includes RunCrew memberships, admin crews, weekly activities
- Syncs `photoURL` from Firebase if available
- Returns computed fields (`profileComplete`, `hasLocation`, etc.)
- **Local-First Architecture**: Frontend saves to localStorage, uses everywhere

#### Get Athlete by ID

**Endpoint**: `GET /api/athlete/by-id?athleteId=xxx`

**Authentication**: Not required (used for GarminConnectSuccess page)

**Response**: Returns athlete profile with Garmin integration data

### Profile Picture Upload

**Location**: `gofastbackendv2-fall2025/index.js`

**Endpoint**: `POST /api/upload`

**Authentication**: Not currently required (should add Firebase token verification)

**Request**: Multipart form data with `profilePic` file

**Response**:
```json
{
  "url": "/uploads/1234567890.jpg"
}
```

**Implementation Notes**:
- Uses Multer for file upload
- Stores files in `/data/uploads` directory (Render persistent disk)
- Returns relative URL for uploaded file
- **TODO**: Add Firebase token verification
- **TODO**: Add image validation (size, type)
- **TODO**: Add image processing (resize, compress)
- **TODO**: Integrate with Cloudinary or S3 for scalable storage

---

## Frontend Implementation

### Profile Setup Component

**Location**: `gofastfrontend-mvp1/src/Pages/Athlete/AthleteCreateProfile.jsx`

**Purpose**: Universal profile setup form for all athletes

**Fields**:
- First Name (required)
- Last Name (required)
- Phone Number (optional)
- GoFast Handle (required)
- Birthday (required)
- Gender (required)
- City (required)
- State (required)
- Primary Sport (required)
- Bio (optional, max 250 chars)
- Instagram Handle (optional)
- Profile Photo (optional)

**Flow**:
1. User fills out form
2. On submit:
   - Step 1: Update profile via `PUT /api/athlete/:id/profile` (with Firebase token)
   - Step 2: Store athlete data in localStorage
   - Step 3: Navigate to `/athlete-home`

**Note**: Athlete creation happens earlier in signup flow via `POST /api/athlete/create`

**Implementation Notes**:
- Loads existing profile data from localStorage if editing
- Pre-fills with Firebase photo if available
- Validates required fields before submission
- Uses Firebase token for authentication
- **TODO**: Add profile picture upload integration
- **TODO**: Add draft saving (auto-save on blur)
- **TODO**: Add profile completion calculation

### Profile Display Component

**Location**: `gofastfrontend-mvp1/src/Pages/Athlete/AthleteProfile.jsx`

**Purpose**: Read-only profile display (hub for navigation)

**Features**:
- Displays all profile fields (same as setup form)
- "Edit Profile" button → Navigates to `/athlete-create-profile`
- "Settings" button → Navigates to `/settings`
- "Back to Home" button → Navigates to `/athlete-home`

**Implementation Notes**:
- Reads profile data from localStorage (hydrated from `/api/athlete/hydrate`)
- Lightweight hub - no heavy data hydration
- **TODO**: Add hub icons for future preferences (Running Preferences, Goals, etc.)
- **TODO**: Add profile completion indicator
- **TODO**: Add profile picture click recovery (opens setup if incomplete)

### Settings Component

**Location**: `gofastfrontend-mvp1/src/Pages/Settings/Settings.jsx`

**Purpose**: Device connections (Garmin, Strava)

**Features**:
- Garmin Connect integration (connect/disconnect)
- Strava Connect integration (placeholder)
- Connection status display

**Implementation Notes**:
- Checks connection status on mount
- Handles Garmin OAuth flow (popup-based)
- **TODO**: Add Strava OAuth integration
- **TODO**: Add profile picture upload in Settings
- **TODO**: Add other settings (notifications, privacy, etc.)

---

## Profile Completion System

### Completion States

```javascript
const profileStates = {
  NOT_STARTED: 'not_started',      // 0% complete
  IN_PROGRESS: 'in_progress',       // 1-99% complete
  COMPLETE: 'complete',             // 100% complete (all discovery fields)
  OPTIMIZED: 'optimized'            // Complete + optional fields
};
```

### Completion Calculation

**Required Fields** (50% of completion):
- `firstName` - 20%
- `gofastHandle` - 20%
- `email` - 10% (already from Firebase auth)

**Optional Fields** (50% of completion):
- `lastName` - 10%
- `profilePicture` (photoURL) - 15%
- `bio` - 10%
- `location` (city + state) - 5%
- `primarySport` - 5%
- `phoneNumber` - 5%

**Total**: 100% (50% required + 50% optional)

### Backend Storage (Future)

```javascript
// Athlete model fields (to be added)
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

**Implementation Status**: 🚧 **TODO** - Not yet implemented in schema

---

## Profile Picture Upload Strategy

### Current Implementation

**Upload Endpoint**: `POST /api/upload`

**Storage**: Local filesystem (`/data/uploads` on Render persistent disk)

**Flow**:
1. User selects image file
2. Frontend sends multipart form data to `/api/upload`
3. Backend stores file in `/data/uploads`
4. Backend returns file URL (`/uploads/filename.jpg`)
5. Frontend updates `photoURL` in profile

### Future Enhancements

**Recommended**: Cloudinary or AWS S3 with CDN

**Image Processing**:
- Max size: 2MB
- Formats: JPG, PNG, WebP
- Dimensions:
  - Thumbnail: 150x150
  - Profile: 400x400
  - Original: max 2000x2000
- Compression: 80% quality

**Upload Flow** (Future):
1. User clicks profile picture area
2. Platform detection (mobile vs web)
3. Show appropriate picker:
   - Mobile: Camera/Gallery options
   - Web: File upload + drag-drop zone
4. Image selection
5. Image preview + crop (optional)
6. Resize/compress (if needed)
7. Upload to Cloudinary/S3
8. Update profile picture URL
9. Save to database

---

## Reminder System (Future)

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
   - Examples: Searching for athletes, joining a RunCrew, following another athlete
   - Message: "Complete your profile to be discovered!"

**Implementation Status**: 🚧 **TODO** - Not yet implemented

---

## Downstream Feature Integration

### Profile Matrix

The profile system supports **progressive profile loading** where users only fill out what they need for features they use.

#### Universal Profile (Always Required)

**Component**: `AthleteCreateProfile.jsx`

**Fields**: Core identity fields (firstName, lastName, email, gofastHandle, etc.)

**Used By**: Everyone, all features

#### Training Profile (Feature-Specific)

**Status**: 🚧 **TODO** - Needs to be created

**Component**: `ProfileTrainingSetup.jsx` (to be created)

**Additional Fields**:
- Current Pace (5K)
- Weekly Mileage
- Training Goal (event)
- Training Start Date
- Target Race

**Triggers**: When user clicks "Start Training Plan" or adds a race

**Storage**: Fields stored in `Athlete` model (already in schema)

#### Match Profile (Feature-Specific)

**Status**: ✅ **Exists** (in demo, not MVP1)

**Component**: `MatchProfileSetup.jsx` (exists in demo)

**Additional Fields**:
- Preferred Running Distance (1-3mi, 3-5mi, 5-8mi, etc.)
- Time Preference (Morning/Afternoon/Evening)
- Pace Range
- Bio/Personal Message
- Running Goals (Stay consistent, Find crew, PR, etc.)
- Social Handle (optional)

**Triggers**: When user clicks "Find Matches" or "Connect with Runners"

**Storage**: Fields stored in `Athlete` model (already in schema)

#### Crew Profile (No Extra Profile Needed)

**Status**: ✅ **Uses Universal Profile Only**

**Why**: Crew membership doesn't require additional "hydration data" for matching/picking

**Triggers**: When user clicks "Join a Crew" or "Start a Crew"

**Storage**: No additional fields needed - uses universal profile

#### Event Profile (Feature-Specific)

**Status**: 🚧 **TODO** - Needs to be created

**Component**: `ProfileEventSetup.jsx` (to be created)

**Additional Fields**:
- Estimated Finish Time
- Goal Time
- Race Category
- Emergency Contact
- T-Shirt Size

**Triggers**: When user clicks "Register for Race" or adds event to calendar

**Storage**: Fields to be added to `Athlete` model or separate `EventRegistration` model

### Flow Diagram

```
User Signs Up
    ↓
AthleteCreateProfile (MANDATORY)
    ↓
User Picks a Feature
    ↓
┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Join Training       │ Find Matches     │ Join/Start Crew  │ Register Event   │
│     ↓               │     ↓            │     ↓            │     ↓            │
│ Training Setup      │ Match Setup      │ No Extra Setup   │ Event Setup      │
│  (pace, mileage)    │ (prefs, bio)     │ (uses universal) │ (goals, info)    │
└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘
                            ↓
                    Single AthleteProfile
                    (Flattened Schema)
```

---

## Navigation & Hub Features

### Current Navigation

**Profile Page** (`AthleteProfile.jsx`):
- "Edit Profile" button → `/athlete-create-profile`
- "Settings" button → `/settings`
- "Back to Home" button → `/athlete-home`

**Settings Page** (`Settings.jsx`):
- Device Connections (Garmin, Strava)
- "Back to Home" button → `/athlete-home`

### Future Hub Icons (Not Yet Implemented)

**Profile Page Hub Icons** (Future):
- **📱 Connected Devices** → Navigate to Settings page (Garmin, Strava) ✅ **Exists**
- **✏️ Edit Profile** → Navigate to Profile Setup page ✅ **Exists**
- **🏃 Running Preferences** → Dedicated running preferences page (pace, distance, goals) 🚧 **TODO**
- **🎯 Goals & Targets** → Training goals and race targets 🚧 **TODO**
- **⚙️ Advanced Settings** → Account settings, notifications, privacy 🚧 **TODO**
- **📊 Stats & Analytics** → Performance dashboard (separate from profile) 🚧 **TODO**
- **👥 Social Settings** → Discovery preferences, following settings 🚧 **TODO**

**Hub Design Principles**:
1. **Lightweight** - Profile page does NOT hydrate heavy data
2. **Icon-based** - Visual icons for quick navigation
3. **Future-proof** - Easy to add new preference icons
4. **Separation of concerns** - Each icon links to dedicated page
5. **No inline preferences** - Don't cram everything into one page

---

## Data Flow

### Signup & Signin Flow (Unified)

**Note**: Both signup and signin use the **same flow** - they both call `POST /api/athlete/create` and route based on `gofastHandle`.

**Components**:
- Signup: `AthleteSignup.jsx`
- Signin: `AthleteSignin.jsx`

**Flow**:
```
1. User clicks "Sign up" or "Sign in" → Firebase Auth (Google OAuth)
2. Frontend gets Firebase token → Stores in localStorage
3. Frontend calls POST /api/athlete/create (NO body - route extracts from Firebase token)
4. Backend service finds or creates athlete by firebaseId:
   - If exists: Updates Firebase data (email, firstName, lastName, photoURL) and returns existing athlete
   - If not exists: Creates new athlete with Firebase data and returns new athlete
5. Backend returns athlete data (includes gofastHandle)
6. Frontend routes based on gofastHandle (data-driven routing, no flags):
   - If gofastHandle exists → Navigate to /athlete-home (profile complete)
   - If gofastHandle is null → Navigate to /athlete-create-profile (needs profile setup)
```

**Key Principles**:
- **No request body**: Route extracts all data from Firebase token via `verifyFirebaseToken` middleware
- **Data-driven routing**: Uses `gofastHandle` to determine next step, not flags
- **Unified flow**: Signup and signin are identical - both can create or find existing athletes

### Profile Setup Flow

```
1. User on profile setup page (AthleteCreateProfile.jsx)
2. User fills out form (firstName, lastName, gofastHandle, etc.)
3. Frontend calls PUT /api/athlete/:id/profile
4. Backend updates athlete record with profile data
5. Frontend stores athlete data in localStorage
6. Frontend navigates to /athlete-home
```

### Profile Hydration Flow

```
1. App loads → Frontend calls GET /api/athlete/hydrate (with Firebase token)
2. Backend finds athlete by firebaseId
3. Backend hydrates all relations (RunCrews, activities, etc.)
4. Backend returns complete athlete object
5. Frontend saves to localStorage (localStorage.setItem('athleteProfile', ...))
6. Downstream components read from localStorage (no API calls)
```

### Profile Update Flow

```
1. User clicks "Edit Profile" → Navigate to /athlete-create-profile
2. Frontend loads existing profile from localStorage
3. User updates fields
4. Frontend calls PUT /api/athlete/:id/profile
5. Backend updates athlete record
6. Frontend updates localStorage
7. Frontend navigates back to profile page
```

---

## Implementation Checklist

### Backend

- [x] Athlete model with profile fields
- [x] Athlete find-or-create service (`AthleteFindOrCreateService.js`)
- [x] Athlete find-or-create route (`POST /api/athlete/create`) - uses service, upserts Firebase data
- [x] Profile update route (`PUT /api/athlete/:id/profile`)
- [x] Universal hydration route (`GET /api/athlete/hydrate`)
- [x] Profile picture upload endpoint (`POST /api/upload`)
- [ ] Firebase token verification on profile routes
- [ ] Profile completion calculation
- [ ] Draft saving mechanism
- [ ] Image processing (resize, compress)
- [ ] Cloudinary/S3 integration for image storage
- [ ] Profile completion tracking fields in schema

### Frontend

- [x] Profile setup component (`AthleteCreateProfile.jsx`)
- [x] Profile display component (`AthleteProfile.jsx`)
- [x] Settings component (`Settings.jsx`)
- [x] Profile hydration on app load
- [x] LocalStorage storage pattern
- [ ] Profile picture upload integration
- [ ] Draft saving (auto-save on blur)
- [ ] Profile completion indicator
- [ ] Reminder banner on home page
- [ ] Profile picture click recovery
- [ ] Hub icons component (navigation icons)
- [ ] Running preferences page (future)
- [ ] Goals & targets page (future)
- [ ] Advanced settings page (future)

### Feature-Specific Profiles

- [ ] Training profile setup component
- [ ] Match profile setup component (port from demo)
- [ ] Event profile setup component
- [ ] Profile matrix documentation

---

## Related Documentation

- **`GOFAST_ARCHITECTURE.md`** - Main GoFast architecture documentation
- **`PROFILEMATRIX.md`** - Profile matrix for feature-specific profiles
- **`gofastfrontend-demo/docs/GoFast AthleteActivity-Architecture.md`** - Activity tracking architecture

---

**Last Updated**: January 2025  
**Status**: In Progress - Core profile system implemented, completion tracking and reminders pending  
**Next Steps**: Add profile completion calculation, reminder system, and image processing

