# GoFast MVP1 Frontend Architecture

## Overview

MVP1 focuses on **RunCrew** functionality - activity tracking, leaderboards, and community engagement. The frontend architecture is based on the proven demo structure with clear separation of concerns.

## Core Philosophy

- **Wire first, build second** - No overbuilding until features are connected
- **Copy proven patterns** - Use demo structure that already works
- **Clear separation** - Each feature has its own folder and components
- **Scalable foundation** - Ready for future phases (training, matching, shopping)

## Folder Structure

```
gofastfrontend-mvp1/
├── src/
│   ├── Pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProfileSetup.jsx
│   │   ├── RunCrew/
│   │   │   ├── CrewDashboard.jsx ✅ (copy from demo)
│   │   │   ├── CreateCrew.jsx ✅ (copy from demo)
│   │   │   ├── JoinCrew.jsx ✅ (copy from demo)
│   │   │   ├── FindRunningClubs.jsx ✅ (copy from demo)
│   │   │   ├── ClubDetail.jsx ✅ (copy from demo)
│   │   │   ├── CrewExplainer.jsx ✅ (copy from demo)
│   │   │   ├── FormRunCrew.jsx ✅ (copy from demo)
│   │   │   ├── JoinOrStartCrew.jsx ✅ (copy from demo)
│   │   │   ├── RunCrewSuccess.jsx ✅ (copy from demo)
│   │   │   └── StartRunCrew.jsx ✅ (copy from demo)
│   │   ├── Activity/
│   │   │   ├── ActivityFeed.jsx
│   │   │   ├── GarminConnect.jsx
│   │   │   ├── ActivityStats.jsx
│   │   │   └── SeeActivities.jsx ✅ (copy from demo)
│   │   ├── Athlete/
│   │   │   ├── AthleteHome.jsx ✅ (copy from demo)
│   │   │   ├── AthleteProfile.jsx ✅ (copy from demo)
│   │   │   └── ProfileSetupUniversal.jsx ✅ (copy from demo)
│   │   ├── Dashboard/
│   │   │   └── GoFastDashboard.jsx ✅ (copy from demo)
│   │   └── Settings/
│   │       ├── Settings.jsx ✅ (copy from demo)
│   │       ├── LinkGarmin.jsx ✅ (copy from demo)
│   │       └── LinkStrava.jsx ✅ (copy from demo)
│   ├── Components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── RunCrew/
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── CrewMember.jsx
│   │   │   └── CrewStats.jsx
│   │   ├── Activity/
│   │   │   ├── ActivityCard.jsx
│   │   │   ├── ActivityChart.jsx
│   │   │   └── GarminSync.jsx
│   │   └── Shared/
│   │       ├── NavBar.jsx ✅ (copy from demo)
│   │       ├── ScrollToTop.jsx ✅ (copy from demo)
│   │       └── PersonalStats.jsx ✅ (copy from demo)
│   ├── api/
│   │   ├── authApi.js
│   │   ├── crewApi.js
│   │   ├── activityApi.js
│   │   └── axiosConfig.js ✅ (copy from demo)
│   ├── utils/
│   │   ├── auth.js
│   │   ├── garmin.js
│   │   └── helpers.js
│   ├── config/
│   │   ├── navigation.js ✅ (copy from demo)
│   │   └── constants.js
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── public/
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Key Features (MVP1)

### 1. Authentication Flow
- **Firebase Auth** integration
- **Profile setup** after login
- **JWT token** management
- **Protected routes**

### 2. RunCrew Management
- **Create crew** with join codes
- **Join existing crew** via code
- **Crew dashboard** with member management
- **Leaderboards** (miles, pace, calories)
- **Crew sharing** and invites

### 3. Activity Tracking
- **Garmin Connect** integration
- **Activity sync** and aggregation
- **Personal stats** and records
- **Points system** for achievements

### 4. Dashboard
- **Main hub** for all features
- **Quick access** to RunCrew, Activity, Settings
- **Recent activity** feed
- **Upcoming events** and challenges

## Implementation Strategy

### Phase 1: Foundation (Week 1)
1. **Copy demo structure** - Use proven patterns
2. **Set up routing** - React Router configuration
3. **Basic components** - NavBar, shared components
4. **API structure** - Axios config, base API calls

### Phase 2: Authentication (Week 2)
1. **Firebase setup** - Auth configuration
2. **Login/Register** - Basic auth flow
3. **Profile setup** - First-time user experience
4. **Protected routes** - Route guards

### Phase 3: RunCrew Core (Week 3)
1. **Crew creation** - Backend integration
2. **Crew joining** - Code-based joining
3. **Crew dashboard** - Member management
4. **Basic leaderboards** - Mock data first

### Phase 4: Activity Integration (Week 4)
1. **Garmin Connect** - API integration
2. **Activity sync** - Real data flow
3. **Leaderboard updates** - Live data
4. **Points system** - Achievement tracking

## Demo Components to Copy

### ✅ Ready to Copy (Proven Working)
- `CrewDashboard.jsx` - Complete crew management
- `AthleteHome.jsx` - Navigation hub
- `GoFastDashboard.jsx` - Main dashboard
- `CreateCrew.jsx` - Crew creation flow
- `JoinCrew.jsx` - Join existing crew
- `FindRunningClubs.jsx` - Club discovery
- `ClubDetail.jsx` - Club information
- `Settings.jsx` - User settings
- `LinkGarmin.jsx` - Garmin connection
- `PersonalStats.jsx` - Stats component

### 🔄 Needs Backend Integration
- Replace mock data with real API calls
- Add authentication checks
- Connect to Garmin API
- Implement real leaderboard calculations

## Navigation Flow

### Main Flow
```
Login → Profile Setup → Athlete Home → RunCrew Dashboard
```

### RunCrew Flow
```
Athlete Home → Create/Join Crew → Crew Dashboard → Leaderboards
```

### Activity Flow
```
Athlete Home → Settings → Link Garmin → Activity Feed → Stats
```

## API Integration Points

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### RunCrew
- `POST /api/crews` - Create crew
- `GET /api/crews/:code` - Get crew by code
- `POST /api/crews/:id/join` - Join crew
- `GET /api/crews/:id/leaderboard` - Get leaderboard

### Activity
- `GET /api/activities` - Get user activities
- `POST /api/activities/sync` - Sync from Garmin
- `GET /api/activities/stats` - Get activity stats

## Benefits of This Structure

### 1. Proven Patterns
- **Demo already works** - No need to reinvent
- **Clean separation** - Each feature isolated
- **Scalable** - Easy to add new features

### 2. Development Efficiency
- **Copy first** - Use existing components
- **Wire second** - Connect to backend
- **Build third** - Add new features

### 3. User Experience
- **Familiar patterns** - Users know how to navigate
- **Consistent design** - Same look and feel
- **Fast development** - Less time to MVP

## Next Steps

1. **Copy demo structure** to MVP1
2. **Set up basic routing** and components
3. **Connect to backend** APIs
4. **Add authentication** flow
5. **Integrate Garmin** for real data

## Notes

- **Don't overbuild** - Wire first, then build
- **Use demo patterns** - They already work
- **Focus on RunCrew** - MVP1 priority
- **Keep it simple** - Complex features come later
- **Test early** - Make sure everything connects

This architecture provides a solid foundation for MVP1 while keeping the door open for future phases (training, matching, shopping) without overbuilding.
