# Invite Link Testing Guide

## Quick Test Setup

### 1. Find Your Crew's Join Code

**Option A: From RunCrew Central Admin**
- Navigate to `/crew/crewadmin`
- Look in the "Members" card section
- Join code is displayed there

**Option B: From Browser Console**
```javascript
// Get join code from localStorage
const crew = JSON.parse(localStorage.getItem('runCrewData') || '{}');
console.log('Join Code:', crew.joinCode || crew.inviteCode);
```

**Option C: From Database**
- Check `JoinCode` table in Prisma
- Look for code linked to your RunCrew

### 2. Generate Invite Links

**Using the Service:**
```javascript
import { generateDirectInviteLink, generateAuthenticatedInviteLink } from '../utils/InviteLinkGenerator';

const joinCode = 'MORNING'; // Replace with your actual code

// Direct Invite (New Users)
const directLink = generateDirectInviteLink(joinCode);
console.log('Direct Link:', directLink);
// Output: https://athlete.gofastcrushgoals.com/joinruncrewwelcome?code=MORNING

// Authenticated Link (Existing Users)
const authLink = generateAuthenticatedInviteLink(joinCode);
console.log('Auth Link:', authLink);
// Output: https://athlete.gofastcrushgoals.com/runcrew/join?code=MORNING
```

### 3. Test Join Code-First Flow (New Users)

**Steps:**
1. Copy the direct invite link (e.g., `/joinruncrewwelcome?code=MORNING`)
2. Open in **incognito/private window** (to simulate new user)
3. Should see:
   - Page auto-validates code
   - Shows crew info card (name, manager, members)
   - "Join This Crew" button
4. Click "Join This Crew"
5. Should redirect to `/athletesignup?hasJoinContext=true&sessionId=xxx`
6. Sign up with Google
7. Should auto-join crew during signup
8. Redirects to `/precrewpage?crewId=xxx`
9. Hydrates and redirects to `/runcrew/:id`

**Expected Result:**
- User lands directly in RunCrew Central
- Skipped AthleteHome entirely
- Already a member of the crew

### 4. Test Athlete-First Flow (Existing Users)

**Steps:**
1. Copy the authenticated invite link (e.g., `/runcrew/join?code=MORNING`)
2. Open in **normal window** (as authenticated user)
3. Should see:
   - JoinCrewWelcome page
   - Code pre-filled if in URL
   - "Find My Crew" button
4. Click "Find My Crew"
5. Shows crew preview
6. Click "Join Crew"
7. Should join immediately
8. Redirects to RunCrew Central

**Expected Result:**
- Immediate join (no signup step)
- Direct navigation to RunCrew Central
- Crew saved to localStorage

### 5. Test from RunCrew Central Admin

**Steps:**
1. Navigate to `/crew/crewadmin`
2. Look for "Invite teammates" section in Members card
3. Should see:
   - Direct Invite Link (orange) - for new users
   - Authenticated Link (blue) - for existing users
   - Join Code display
4. Click "Copy Direct Link" or "Copy Auth Link"
5. Test the copied link

## Common Test Scenarios

### Scenario 1: New User with Direct Invite
```
1. Admin shares: /joinruncrewwelcome?code=MORNING
2. New user clicks link
3. Validates → Shows crew info
4. Clicks "Join This Crew"
5. Signs up → Auto-joins → Lands in RunCrew Central
```

### Scenario 2: Existing User with Direct Invite
```
1. Admin shares: /joinruncrewwelcome?code=MORNING
2. Existing user clicks link (while logged in)
3. Could redirect to authenticated flow OR
4. Still works but user already signed up
```

### Scenario 3: Existing User with Auth Link
```
1. Admin shares: /runcrew/join?code=MORNING
2. Existing user clicks link
3. Code pre-filled → Validates → Joins immediately
```

## Debugging

### Check Join Context in Redis
```javascript
// Backend: Check Redis for join context
// Key format: joinctx:{sessionId}
// TTL: 5 minutes (300 seconds)
```

### Check localStorage
```javascript
// Frontend: Check for join context
console.log('Join Session ID:', localStorage.getItem('joinSessionId'));
console.log('RunCrew ID:', localStorage.getItem('runCrewId'));
console.log('RunCrew Data:', JSON.parse(localStorage.getItem('runCrewData') || '{}'));
```

### API Testing
```bash
# Validate join code
curl "https://gofastbackendv2-fall2025.onrender.com/api/join/validate?code=MORNING"

# Store join context
curl -X POST "https://gofastbackendv2-fall2025.onrender.com/api/join/temp" \
  -H "Content-Type: application/json" \
  -d '{"joinCode": "MORNING"}'
```

## Expected URLs

**Join Code-First Flow:**
- Welcome: `/joinruncrewwelcome?code=MORNING`
- Signup: `/athletesignup?hasJoinContext=true&sessionId=xxx`
- PreCrew: `/precrewpage?crewId=xxx`
- Final: `/runcrew/:id`

**Athlete-First Flow:**
- Welcome: `/runcrew/join?code=MORNING`
- Final: `/runcrew/:id` or `/runcrew/central`

