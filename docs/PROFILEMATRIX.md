# Profile Matrix

## Profile Architecture

### Universal Profile (`AthleteCreateProfile.jsx`)
**Purpose**: Core identity - needed for ALL users

**Fields**:
- First Name
- Last Name
- Age
- City
- State
- Profile Photo
- Bio
- Instagram Handle

**Used By**: Everyone, all features

---

### Feature-Specific Profiles (Separate "Joining" Profiles)

#### 1. **Training Profile** (`ProfileTrainingSetup.jsx` - NEEDS TO BE CREATED)
**Purpose**: If you're joining Training module

**Additional Fields**:
- Current Pace (5K)
- Weekly Mileage
- Training Goal (event)
- Training Start Date
- Target Race

**Triggers**: When user clicks "Start Training Plan" or adds a race
**Status**: Needs to be created

---

#### 2. **Match Profile** (`MatchProfileSetup.jsx` - ALREADY EXISTS)
**Purpose**: If you're joining Matching feature

**Additional Fields**:
- Preferred Running Distance (1-3mi, 3-5mi, 5-8mi, etc.)
- Time Preference (Morning/Afternoon/Evening)
- Pace Range
- Bio/Personal Message
- Running Goals (Stay consistent, Find crew, PR, etc.)
- Social Handle (optional)

**Triggers**: When user clicks "Find Matches" or "Connect with Runners"
**Status**: ✅ Already exists

---

#### 3. **Crew Profile** (NO EXTRA PROFILE NEEDED - Uses Universal Only)
**Purpose**: Joining/starting a Run Crew

**Additional Fields**: None needed - just uses Universal Profile
**Why**: Crew membership doesn't require additional "hydration data" for matching/picking

**Triggers**: When user clicks "Join a Crew" or "Start a Crew"
**Status**: No separate profile component needed

---

#### 4. **Event Profile** (`ProfileEventSetup.jsx` - NEEDS TO BE CREATED)
**Purpose**: If you're registering for an event/race

**Additional Fields**:
- Estimated Finish Time
- Goal Time
- Race Category
- Emergency Contact
- T-Shirt Size

**Triggers**: When user clicks "Register for Race" or adds event to calendar
**Status**: Needs to be created

---

## UniversalAthlete Profile (`AthleteProfile.jsx`)

**Purpose**: The hydrated/dashboard view that aggregates ALL profile data

**Displays**:
- Universal Profile (name, age, location, photo)
- Active Training Plans (from Training Profile)
- Matches/Connections (from Match Profile)
- Crew Memberships (from Crew Profile)
- Upcoming Events (from Event Profile)
- Activity History
- Points/Badges
- Social Stats

**Access**: User dashboard, profile page, settings

**⚠️ DEPRECATED**: `src/Pages/Matching/Profile.jsx` (MatchProfile.jsx) needs to be merged into this

---

## Flow Diagram

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

## Implementation Notes

1. **Progressive Profile Loading**: Users only fill out what they need for features they use
2. **No Duplicate Data**: Each field only asked once
3. **Edit at Any Time**: Users can update any profile section from settings
4. **Privacy**: Users control what's visible in matching/search features
5. **Crew Simplicity**: Crew just uses universal profile - no extra hydration needed

---

## File Structure

```
src/Pages/Athlete/
├── AthleteCreateProfile.jsx     # Core identity ✅
├── AthleteProfile.jsx           # Dashboard view ✅
└── Setup/
    ├── TrainingSetup.jsx        # ❌ Needs to be created
    ├── MatchSetup.jsx           # ❌ Needs to be created
    └── EventSetup.jsx           # ❌ Needs to be created
```

---

## To-Do List

- [ ] Create `ProfileTrainingSetup.jsx`
- [ ] Create `ProfileEventSetup.jsx`
- [ ] Merge `MatchProfile.jsx` into `AthleteProfile.jsx` and delete duplicate
- [ ] Crew: No action needed - just uses universal profile
