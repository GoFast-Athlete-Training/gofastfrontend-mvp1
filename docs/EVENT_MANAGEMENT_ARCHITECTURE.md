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
  stravaRouteUrl String? // Strava route URL
  stravaRouteId  String? // Strava route ID
  distance       String? // Distance (e.g., "5K", "3.1 miles", "10K")
  
  // Future State: Registration
  registrantId   String? // Future: Links to athleteId for main UX registration (optional)
  
  // Metadata
  eventType   String?  // "race", "community-run", "training", etc.
  isActive    Boolean  @default(true)
  
  // System
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  volunteers  EventVolunteer[] // Volunteers linked via eventId
}
```

**Key Points**:
- `id` = **Primary identifier** - Used throughout the system (no eventSlug)
- Events are identified by their database ID (`eventId`)
- For public-facing pages (GoFast-Events repo), `eventId` is stored in localStorage or environment variable

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

**Authentication**: Uses Firebase auth via `athleteId` in localStorage (same as rest of GoFast app)

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

```
GET    /api/event                    → List all events (filter by isActive)
GET    /api/event/:id                → Get single event with volunteers
POST   /api/event                    → Create new event (eventId auto-generated)
PUT    /api/event/:id                → Update event
DELETE /api/event/:id                → Soft delete (set isActive=false)
```

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
- `GET /api/event?isActive=true` - Fetch events
- `POST /api/event` - Create event (eventId auto-generated, no eventSlug required)
- `GET /api/event-volunteer?eventId=xxx` - Fetch volunteers by eventId
- `POST /api/event-volunteer` - Create/update volunteer (requires eventId)

**Authentication**: Uses `athleteId` from localStorage (same pattern as rest of app)

### Backend: Event Routes

**Location**: `gofastbackendv2-fall2025/routes/Event/eventRoute.js`

**Features**:
- Full CRUD for events
- Includes volunteer count in list response
- Soft delete (isActive flag)

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

### Protected Endpoints
- `GET /api/event` - Should require auth (or at least filter sensitive data)
- `GET /api/event-volunteer` - Should return email only if authenticated

**Recommendation**: Add middleware to check for `athleteId` in request headers/localStorage and filter email accordingly.

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

---

**Last Updated**: January 2025  
**Status**: MVP Implementation  
**Next Steps**: Add volunteer update endpoint, implement email filtering in backend responses

