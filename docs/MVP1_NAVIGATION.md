# GoFast MVP1 Navigation Flow

## Overview
MVP1 focuses on **RunCrew** functionality with clean authentication flow and intuitive navigation.

## Authentication Flow

### 1. Splash Screen (`/`)
- **Purpose**: Token checker and router
- **Logic**:
  - ✅ **Has Firebase token** → Route to `/athlete-home`
  - ❌ **No Firebase token** → Route to `/signin`

### 2. Sign In (`/signin`)
- **Purpose**: Google auth + backend athlete creation
- **Flow**:
  1. Google Sign-in → Get Firebase token
  2. Backend call → `POST /api/athlete/create`
  3. Store auth data in localStorage
  4. **Routing Logic**:
     - ✅ **Has profile** (firstName, lastName) → Route to `/athlete-home`
     - ❌ **No profile** → Route to `/profile-setup`

### 3. Profile Setup (`/profile-setup`)
- **Purpose**: Complete athlete profile
- **After completion** → Route to `/athlete-home`

## Main Navigation

### 4. Athlete Home (`/athlete-home`)
- **Purpose**: Main dashboard and navigation hub
- **Content**: 
  - Personalized greeting: "Welcome, [FirstName]! What do you want to do today?"
  - Action cards for main features
  - Quick stats and recent activity

## Feature Navigation

### RunCrew Features
- **Create Crew** (`/runcrew/create`)
- **Join Crew** (`/runcrew/join`)
- **Crew Dashboard** (`/runcrew/dashboard`)
- **Find Running Clubs** (`/runcrew/find-clubs`)

### Training Features
- **Training Hub** (`/training/hub`)
- **Today's Workout** (`/training/today`)
- **Training Plan** (`/training/plan`)
- **Activity Tracking** (`/training/activities`)

### Profile & Settings
- **Athlete Profile** (`/athlete/profile`)
- **Settings** (`/settings`)
- **Link Garmin** (`/settings/garmin`)
- **Link Strava** (`/settings/strava`)

## Navigation Structure

```
/ (Splash)
├── /signin (Google Auth)
├── /profile-setup (New User)
└── /athlete-home (Main Hub)
    ├── RunCrew
    │   ├── /runcrew/create
    │   ├── /runcrew/join
    │   ├── /runcrew/dashboard
    │   └── /runcrew/find-clubs
    ├── Training
    │   ├── /training/hub
    │   ├── /training/today
    │   ├── /training/plan
    │   └── /training/activities
    └── Profile
        ├── /athlete/profile
        └── /settings
```

## Key Principles

1. **Simple Auth Flow**: Splash → Signin → Profile Setup → Athlete Home
2. **Athlete Home as Hub**: Central navigation point
3. **Progressive Profile**: Only ask for what's needed
4. **RunCrew Focus**: MVP1 priority features
5. **Intuitive Actions**: "What do you want to do today?"

## Next Steps

1. **Define Athlete Home Layout**: Action cards and navigation
2. **Map RunCrew Flow**: Create → Join → Dashboard
3. **Profile Setup Flow**: Universal profile completion
4. **Backend Integration**: Connect to `gofastbackendv2-fall2025`

## Notes

- Keep navigation simple and focused
- Athlete Home should be the main entry point
- Progressive disclosure of features
- Clear call-to-actions for each feature

