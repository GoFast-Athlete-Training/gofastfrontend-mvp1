# Join Crew Flows Comparison

## Two Main Flows

### Flow 1: Athlete Chooses "Join Crew" from Home
**Entry Point**: Athlete Home → "Join or Create a Run Crew" → `/runcrew/join-or-start` → `/run-crew-join` or `/runcrew/join`

**Components**:
- `JoinOrStartCrew.jsx` - Entry point (join or create choice)
- `JoinCrew.jsx` - Join code input page (`/run-crew-join`)
- `JoinCrewWelcome.jsx` - Alternative join page (`/runcrew/join`)

**Backend Route**: `POST /api/runcrew/join`
- User is already authenticated
- Has `athleteId` in localStorage
- Calls join endpoint directly

**Flow**:
1. User clicks "Join Crew" from home
2. Navigates to `/runcrew/join-or-start`
3. Clicks "Join with Code" → `/run-crew-join` or `/runcrew/join`
4. Enters join code
5. Calls `POST /api/runcrew/join` with `joinCode`
6. Backend upserts athlete + creates membership
7. Redirects to `/runcrew/central`

---

### Flow 2: Athlete Gets Join Code Link (Direct Invite)
**Entry Point**: Direct link `/join/:code` or `/join?code=XXX`

**Components**:
- `JoinCodeWelcome.jsx` - Preview page (`/join/:code` or `/join`)
- `JoinCrewAthSignup.jsx` - Signup page (if not authenticated)
- `JoinCrewAthProfile.jsx` - Profile creation (if profile incomplete)

**Backend Route**: `POST /api/runcrew/join`
- **May or may not be authenticated** (key difference from Flow 1)
- **May or may not have `athleteId`**
- Backend handles athlete upsert + join atomically

**Flow**:
1. User clicks invite link `/join/FAST123`
2. `JoinCodeWelcome` auto-looks up crew
3. Shows crew preview
4. User clicks "Join This Crew"
   - **If authenticated + has token**: Complete join immediately (like Flow 1)
     - Upsert athlete → check profile → join crew → redirect to crew
   - **If not authenticated**: Shows "You're Joined!" → redirects to signup
5. **If not authenticated**:
   - `JoinCrewAthSignup` signs in → upserts athlete → checks profile
   - If profile incomplete → `JoinCrewAthProfile` → completes profile → joins crew
   - If profile complete → joins crew immediately
6. Redirects to `/runcrew/central` or `/crew/crewadmin`

---

## Key Differences

| Aspect | Flow 1 (From Home) | Flow 2 (Direct Link) |
|--------|-------------------|---------------------|
| **Entry** | `/runcrew/join-or-start` | `/join/:code` |
| **Auth State** | Always authenticated | **May or may not be authenticated** |
| **Athlete Exists** | Yes (has athleteId) | May or may not exist |
| **Backend Route** | `POST /api/runcrew/join` | `POST /api/runcrew/join` |
| **Backend Behavior** | Upserts athlete + creates membership | Upserts athlete + creates membership |
| **Profile Check** | Assumed complete | Checks and routes to profile if incomplete |
| **Components** | `JoinCrew.jsx`, `JoinCrewWelcome.jsx` | `JoinCodeWelcome.jsx`, `JoinCrewAthSignup.jsx`, `JoinCrewAthProfile.jsx` |
| **Key Difference** | Always authenticated athlete | **Handles both authenticated AND unauthenticated** |

---

## Conclusion

**Both flows use the same backend route**: `POST /api/runcrew/join`

**The route handles both cases**:
- Existing athletes (Flow 1): Upserts athlete data, creates membership
- New athletes (Flow 2): Creates athlete, creates membership

**The difference is in the frontend flow**:
- Flow 1: Simple - authenticated user enters code → joins
- Flow 2: Complex - handles signup, profile creation, then joins

Both end up calling the same canonical route, which is correct! ✅

