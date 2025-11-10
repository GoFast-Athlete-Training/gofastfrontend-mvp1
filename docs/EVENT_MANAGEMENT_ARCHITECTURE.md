# Event Management Architecture

**Last Updated**: January 2025  
**Purpose**: Event management system for GoFast fun runs and club events - lightweight volunteer signup without requiring user accounts

---

## Overview

Event Management enables GoFast to organize 5K fun runs and community events. The system is designed for **clubs and organizations that host frequent fun runs** and need a simple way to:

1. **Create events** with details (date, location, route, etc.)
2. **Collect volunteer signups** without requiring user accounts
3. **Manage volunteers** - view who signed up, edit details, assign roles
4. **Display public volunteer rosters** (name only) for transparency

**Key Principle**: **No auth required for volunteers** - they just provide name and email as strings. Only event organizers (authenticated athletes) can view full volunteer details.

---

## Use Cases

### Primary Use Case: 5K Fun Runs
- GoFast hosts community 5K runs (e.g., "Boys Gotta Run – Discovery 5K")
- Volunteers sign up via public link (no account needed)
- Organizers manage volunteers through Settings → Event Management

### Future Use Case: Club Events
- Run clubs host regular fun runs
- Club admins create events and manage volunteers
- Public-facing volunteer pages for each event

---

## Data Model

### Event Model (Backend)

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String   // "Boys Gotta Run – Discovery 5K (Final Run)"
  description String?
  
  // Event Details
  date        DateTime
  startTime   String?  // "7:55 AM"
  location    String?  // "Discovery Elementary"
  address     String?  // "5275 N 36th St, Arlington, VA 22207"
  
  // Route Information
  stravaRouteUrl String? // Strava route URL (users just paste the URL)
  distance       String? // Distance (e.g., "5K", "3.1 miles", "10K")
  
  // Athlete Relationship - Events are created by athletes
  athleteId   String   // Links to Athlete.id (creator of the event)
  
  // Future State: Registration
  registrantId   String? // Future: Links to athleteId for main UX registration (optional)
  
  // Metadata
  eventType   String?  // "race", "community-run", "training", etc.
  isActive    Boolean  @default(true)
  
  // System
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  athlete     Athlete  @relation("EventCreator", fields: [athleteId], references: [id], onDelete: Cascade)
  volunteers  EventVolunteer[] // Volunteers linked via eventId
  
  @@index([athleteId])
  @@index([athleteId, title, date]) // For upsert lookup
}
```

**Key Points**:
- `id` = **Primary identifier** - Used throughout the system (no eventSlug)
- `athleteId` = **Required** - Events are scoped to the athlete who created them
- Events are identified by their database ID (`eventId`)
- For public-facing pages (GoFast-Events repo), `eventId` is stored in localStorage or environment variable
- **Upsert Logic**: Events are upserted by `athleteId + title + date` (same athlete, same title, same date = update existing)
- **Database Migration**: Prisma migrations are handled automatically by backend deploy (Render runs `npx prisma db push` on deploy)

### EventVolunteer Model (Backend)

```prisma
model EventVolunteer {
  id        String   @id @default(cuid())
  eventId   String   // Links to Event.id (primary identifier)
  name      String   // Volunteer name (public - displayed on roster)
  email     String   // Volunteer email (private - only organizers see)
  role      String   // Volunteer role (e.g., "Course Marshals", "Pacers – Fast")
  notes     String?  // Optional notes
  createdAt DateTime @default(now())

  // Relations
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

**Key Points**:
- `name` = **Public** - displayed on public volunteer rosters
- `email` = **Private** - only visible to authenticated event organizers
- `role` = Volunteer role (hardcoded list for now, configurable later)
- **No athleteId** - volunteers are NOT users, just name/email strings

---

## Access Control

### Public Access (No Auth Required)
- **Volunteer signup form** - Anyone can submit name, email, role
- **Public volunteer roster** - Shows **name and role only** (no email)

### Protected Access (Athlete Auth Required)
- **Event Management UI** (Settings → Event Management)
- **Full volunteer details** - Name, email, role, notes
- **Edit volunteers** - Update name, email, role, notes
- **Create/edit events** - Full CRUD on events
- **Event scoping** - Athletes can only see/edit events they created (filtered by `athleteId`)

**Authentication**: 
- Uses Firebase auth via `verifyFirebaseToken` middleware
- Backend verifies Firebase token and looks up athlete by `firebaseId`
- All event routes require authentication
- Events are automatically scoped to the authenticated athlete's `athleteId`
- Frontend sends `athleteId` from localStorage for verification

---

## Frontend Architecture

### Public Pages (GoFast-Events Repo)
- `/volunteer` - Event overview page
- `/volunteer/signup` - Volunteer signup form (no auth)
- `/volunteer/roster` - Public roster (name + role only)

### Protected Pages (GoFast Frontend MVP1)
- `/settings/events` - Event Management dashboard
  - List all events
  - Create new events
  - View full volunteer details (name + email)
  - Edit volunteers

---

## API Endpoints

### Event Routes (`/api/event`)

**All routes require Firebase authentication** (`verifyFirebaseToken` middleware)

```
GET    /api/event                    → List events for authenticated athlete (filter by isActive)
       - Automatically filtered by athleteId (only shows events created by authenticated athlete)
       - Query params: ?isActive=true (optional)
       - Requires: Firebase token in Authorization header
       
GET    /api/event/:id                → Get single event with volunteers
       - Verifies event belongs to authenticated athlete
       - Returns 403 if event belongs to another athlete
       - Requires: Firebase token in Authorization header
       
POST   /api/event                    → Create new event (with upsert support)
       - Body: { title, date, athleteId?, ... }
       - Upsert logic: If event exists with same athleteId + title + date, updates existing
       - Returns: { success, data, wasUpdated: true/false }
       - Automatically sets athleteId from authenticated athlete
       - Requires: Firebase token in Authorization header
       
PUT    /api/event/:id                → Update event
       - Verifies event belongs to authenticated athlete
       - Returns 403 if event belongs to another athlete
       - Requires: Firebase token in Authorization header
       
DELETE /api/event/:id                → Soft delete (set isActive=false)
       - Verifies event belongs to authenticated athlete
       - Returns 403 if event belongs to another athlete
       - Requires: Firebase token in Authorization header
```

**CORS**: Routes include explicit CORS preflight handling for cross-origin requests

### Event Volunteer Routes (`/api/event-volunteer`)

```
POST   /api/event-volunteer          → Create volunteer signup (public - no auth)
       Body: { eventId, name, email, role, notes? }
       Required: eventId (primary identifier)
       
GET    /api/event-volunteer          → List volunteers for event (public or protected)
       Query: ?eventId=xxx (required)
       
       Public response: { name, role } (no email)
       Protected response: { name, email, role, notes } (full details)
```

**Key Points**:
- `eventId` is the **primary identifier** - no eventSlug
- For public pages (GoFast-Events repo), `eventId` is hardcoded in localStorage or env variable
- Backend should check for `athleteId` in request to determine if response should include email

---

## Volunteer Roles (Hardcoded - Future: Configurable)

Current hardcoded roles:
- Course Marshals (5)
- Pacers – Fast
- Pacers – Medium
- Pacers – Finish Crew
- Finish Line Holders (2)
- Water Station Crew
- Setup & Teardown

**Future**: Make roles configurable per event or organization.

---

## User Flows

### Flow 1: Volunteer Signs Up (Public)

1. Volunteer visits `/volunteer` (public page - GoFast-Events repo)
2. Page loads with `eventId` from localStorage or env variable
3. Clicks "Sign Up to Help"
4. Fills form: name, email, role, notes (optional)
5. Submits → `POST /api/event-volunteer` with `eventId`
6. Success message shown
7. Volunteer appears on public roster (name + role only)

**No account creation required** ✅  
**eventId is hardcoded in GoFast-Events repo** (localStorage or env variable)

### Flow 2: Organizer Manages Events (Protected)

1. Authenticated athlete navigates to Settings → Event Management
2. Views list of all events
3. Can:
   - Create new event
   - View full volunteer details (name + email)
   - Edit volunteer information
   - See volunteer count per event

**Requires authentication** 🔒

### Flow 3: Public Views Roster (Public)

1. Anyone visits `/volunteer/roster`
2. Sees list of volunteers with:
   - Name ✅
   - Role ✅
   - Notes (if provided) ✅
   - **Email** ❌ (hidden)

**No authentication required** ✅

---

## Implementation Details

### Frontend: Event Management Component

**Location**: `gofastfrontend-mvp1/src/Pages/Settings/EventManagement.jsx`

**Features**:
- List all active events
- Create event modal with full form
- View volunteers per event (table view)
- Edit volunteer modal (name, email, role, notes)
- Refresh volunteers button

**API Calls**:
- `GET /api/event?isActive=true` - Fetch events (uses axios with auth token)
- `POST /api/event` - Create/upsert event (uses axios with auth token, sends athleteId for verification)
- `GET /api/event-volunteer?eventId=xxx` - Fetch volunteers by eventId
- `POST /api/event-volunteer` - Create/update volunteer (requires eventId)

**Authentication**: 
- Uses `api` from `axiosConfig.js` which automatically adds Firebase token to requests
- Gets `athleteId` from `LocalStorageAPI.getAthleteId()`
- Sends `athleteId` in POST body for verification (backend also verifies from Firebase token)
- Handles 401 errors by redirecting to signin

### Backend: Event Routes

**Location**: `gofastbackendv2-fall2025/routes/Event/eventRoute.js`

**Features**:
- Full CRUD for events
- **Authentication required** - All routes use `verifyFirebaseToken` middleware
- **Athlete scoping** - Events are automatically filtered by `athleteId` (only show events created by authenticated athlete)
- **Upsert support** - POST route checks for existing event with same `athleteId + title + date`, updates if exists, creates if not
- **Authorization checks** - GET/PUT/DELETE verify event belongs to authenticated athlete (403 if not)
- **CORS preflight handling** - Explicit OPTIONS handler for cross-origin requests
- Includes volunteer count in list response
- Soft delete (isActive flag)

**Upsert Logic**:
1. POST request comes in with `title`, `date`, and other fields
2. Backend gets authenticated athlete from Firebase token
3. Checks if event exists with same `athleteId + title + date` (same day)
4. If exists: Updates existing event with new data
5. If not exists: Creates new event with `athleteId` from authenticated athlete
6. Returns `wasUpdated: true/false` to indicate if event was updated or created

**Database Migration**:
- Prisma schema changes are automatically applied on backend deploy
- Render runs `npx prisma db push --accept-data-loss && npx prisma generate` on deploy
- No manual migration steps required

### Backend: Event Volunteer Routes

**Location**: `gofastbackendv2-fall2025/routes/Event/eventVolunteerRoute.js`

**Features**:
- Public signup (no auth required)
- Requires `eventId` (primary identifier - no eventSlug)
- Returns full details (name, email, role, notes)
- **TODO**: Add PUT endpoint for updating volunteers
- **TODO**: Filter email from public responses

---

## Security Considerations

### Public Endpoints
- `POST /api/event-volunteer` - No auth required (anyone can sign up, requires eventId)
- `GET /api/event-volunteer?eventId=xxx` - Should filter email for public requests

### Protected Endpoints (All require Firebase authentication)
- `GET /api/event` - **Requires auth** - Returns only events created by authenticated athlete
- `POST /api/event` - **Requires auth** - Automatically sets athleteId from authenticated athlete
- `GET /api/event/:id` - **Requires auth** - Verifies event belongs to authenticated athlete (403 if not)
- `PUT /api/event/:id` - **Requires auth** - Verifies event belongs to authenticated athlete (403 if not)
- `DELETE /api/event/:id` - **Requires auth** - Verifies event belongs to authenticated athlete (403 if not)

**Security Features**:
- All event routes use `verifyFirebaseToken` middleware
- Backend verifies Firebase token and looks up athlete by `firebaseId`
- Events are automatically scoped to authenticated athlete's `athleteId`
- Authorization checks prevent athletes from accessing/modifying other athletes' events
- CORS preflight handling ensures proper cross-origin request handling

**Recommendation**: 
- Backend should filter email from public volunteer roster responses (not yet implemented)
- Consider adding rate limiting for volunteer signups

---

## Future Enhancements

1. **Configurable Volunteer Roles**
   - Allow event organizers to define custom roles per event
   - Store roles in Event model or separate EventRole model

2. **Volunteer Update Endpoint**
   - Add `PUT /api/event-volunteer/:id` for editing volunteers
   - Currently creates new entry (needs cleanup)

3. **Email Filtering**
   - Backend should automatically filter email from public responses
   - Check for `athleteId` in request to determine access level

4. **Club Integration**
   - Link events to RunCrews
   - Allow club admins to manage events
   - Public event pages per club

5. **Volunteer Communication**
   - Email volunteers (using stored email)
   - Send reminders, updates, role assignments

6. **Analytics**
   - Track volunteer signup trends
   - Most popular roles
   - Event attendance patterns

---

## Key Takeaways

1. ✅ **No auth for volunteers** - Just name and email strings
2. ✅ **Public roster shows name only** - Email is private
3. ✅ **Organizers see full details** - Name + email for hydration
4. ✅ **Event Management in Settings** - Protected route for authenticated athletes
5. ✅ **Hardcoded roles for now** - Future: configurable per event
6. ✅ **Backend uses Event model** - Volunteers linked via eventId (primary identifier)
7. ✅ **Public pages in GoFast-Events repo** - Protected pages in main frontend
8. ✅ **eventId is primary identifier** - No eventSlug, eventId is hardcoded in GoFast-Events repo (localStorage or env variable)
9. ✅ **Prefill button actually fills form** - MVP1 just for organizer, prefill populates all fields
10. ✅ **Athlete-scoped events** - Events are linked to athleteId, athletes can only see/edit their own events
11. ✅ **Upsert functionality** - POST route upserts by athleteId + title + date (updates if exists, creates if not)
12. ✅ **Authentication required** - All event routes require Firebase authentication
13. ✅ **CORS handling** - Explicit CORS preflight handling for cross-origin requests
14. ✅ **Database migrations** - Prisma migrations run automatically on backend deploy (Render)

---

**Last Updated**: January 2025  
**Status**: MVP Implementation  
**Next Steps**: Add volunteer update endpoint, implement email filtering in backend responses

