# Test Configuration - Morning Warriors

## Crew Details
- **Name**: Morning Warriors
- **Crew ID**: `cmhlg0io60001sj1vlqn13vnx`
- **Join Code**: `FAST123`

## Test Links

### 🌟 Universal Invite Link (RECOMMENDED)
**Works for BOTH new and existing users - auto-detects auth state**

```
https://athlete.gofastcrushgoals.com/joinruncrewwelcome?code=FAST123
```

**How it works:**
- If user is authenticated → Auto-redirects to `/runcrew/join?code=FAST123` (Athlete-First flow)
- If user is NOT authenticated → Shows invite page → Signup → Auto-join (Join Code-First flow)

**This is the link organizers should share** - they don't need to know if recipients are users or not!

### Direct Invite Link (Join Code-First Flow)
**For new users who haven't signed up yet**

```
https://athlete.gofastcrushgoals.com/joinruncrewwelcome?code=FAST123
```

**Test Steps:**
1. Copy link above
2. Open in **incognito/private window**
3. Should auto-validate code
4. Should show "Morning Warriors" crew info
5. Click "Join This Crew"
6. Redirects to signup with join context
7. Sign up with Google
8. Should auto-join crew during signup
9. Redirects to `/precrewpage?crewId=cmhlg0io60001sj1vlqn13vnx`
10. Hydrates and redirects to `/runcrew/cmhlg0io60001sj1vlqn13vnx`

### Authenticated Invite Link (Athlete-First Flow)
**For existing users who already have accounts**

```
https://athlete.gofastcrushgoals.com/runcrew/join?code=FAST123
```

**Test Steps:**
1. Copy link above
2. Open in **normal window** (as authenticated user)
3. Should show JoinCrewWelcome page
4. Code should be pre-filled: `FAST123`
5. Click "Find My Crew"
6. Should show "Morning Warriors" preview
7. Click "Join Crew"
8. Should join immediately
9. Redirects to RunCrew Central

## Quick Test Commands

### Browser Console
```javascript
// Import the generators
import { generateDirectInviteLink, generateAuthenticatedInviteLink } from '../utils/InviteLinkGenerator';
import { generateUniversalInviteLink } from '../utils/AuthDetectionService';

// Generate links
const universalLink = generateUniversalInviteLink('FAST123'); // ⭐ RECOMMENDED
const directLink = generateDirectInviteLink('FAST123');
const authLink = generateAuthenticatedInviteLink('FAST123');

console.log('🌟 Universal Link (Recommended):', universalLink);
console.log('Direct Link:', directLink);
console.log('Auth Link:', authLink);
```

### API Testing

**Validate Join Code:**
```bash
curl "https://gofastbackendv2-fall2025.onrender.com/api/join/validate?code=FAST123"
```

**Expected Response:**
```json
{
  "success": true,
  "crewName": "Morning Warriors",
  "managerName": "...",
  "memberCount": X,
  "runCrewId": "cmhlg0io60001sj1vlqn13vnx",
  "joinCode": "FAST123"
}
```

**Store Join Context:**
```bash
curl -X POST "https://gofastbackendv2-fall2025.onrender.com/api/join/temp" \
  -H "Content-Type: application/json" \
  -d '{"joinCode": "FAST123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "message": "Join context stored successfully"
}
```

## Expected Flow Results

### Universal Link Flow (Smart Routing)
```
/joinruncrewwelcome?code=FAST123
  ↓ (check auth state)
  
IF AUTHENTICATED:
  → Redirects to /runcrew/join?code=FAST123
  → Athlete-First flow (immediate join)
  
IF NOT AUTHENTICATED:
  → Shows invite page
  → Join Code-First flow (signup then join)
```

### Join Code-First Flow (New User)
```
/joinruncrewwelcome?code=FAST123
  ↓ (validate code)
Shows: "Morning Warriors" crew info
  ↓ (click "Join This Crew")
/athletesignup?hasJoinContext=true&sessionId=xxx
  ↓ (sign up with Google)
Auto-joins crew during signup
  ↓
/precrewpage?crewId=cmhlg0io60001sj1vlqn13vnx
  ↓ (hydrate)
/runcrew/cmhlg0io60001sj1vlqn13vnx
```

### Athlete-First Flow (Existing User)
```
/runcrew/join?code=FAST123
  ↓ (code pre-filled)
Click "Find My Crew"
  ↓ (validate)
Shows: "Morning Warriors" preview
  ↓ (click "Join Crew")
/runcrew/cmhlg0io60001sj1vlqn13vnx
```

## Debugging

### Check localStorage (after join)
```javascript
// In browser console
console.log('Join Code:', JSON.parse(localStorage.getItem('runCrewData') || '{}').joinCode);
console.log('RunCrew ID:', localStorage.getItem('runCrewId'));
console.log('Athlete ID:', localStorage.getItem('athleteId'));
```

### Expected localStorage Values
- `runCrewId`: `cmhlg0io60001sj1vlqn13vnx`
- `runCrewData.joinCode`: `FAST123`
- `runCrewData.name`: `Morning Warriors`

