# Athlete Home Architecture

**Last Updated**: January 2025  
**Purpose**: Architecture documentation for the Athlete Home hub - the main navigation and content hub for athletes

---

## Overview

Athlete Home (`/athlete-home`) is the **primary hub** for athletes after authentication. It provides a persistent sidebar navigation and section-specific content areas for the main athlete workflows.

**Key Principle**: **Choice-specific navigation** - Athletes choose what they want to do (Track, Crew, Events) rather than being presented with a dashboard of cards.

---

## Navigation Structure

### Left Sidebar (Persistent)

The sidebar provides primary navigation between main sections:

1. **Activity** (Track)
   - View activity history and stats
   - Weekly summary
   - Link to full activity list
   - **Connection prompt** if Garmin not connected

2. **Crew** (Run Crew)
   - Access to Run Crew management
   - Shows crew status (in crew / not in crew)
   - Links to crew admin or join/create flow

3. **Events**
   - Event management (create, view, manage volunteers)
   - Future: Event registration
   - Links to Event Management page

4. **Profile** (Footer)
   - Profile picture/avatar
   - Links to profile page

### Top Header

- **Section Title** - Changes based on active section (Activity, Crew, Events)
- **Section Description** - Brief description of current section
- **Settings Button** - Opens Settings page (account/device configuration)
- **Sign Out Button**

---

## Section Content Areas

### Activity Section

**Purpose**: View and manage activity tracking

**Content**:
- **Weekly Summary Card**
  - Total miles
  - Activity count
  - Calories burned
  - Link to "View All" activities

- **Connection Status**
  - If Garmin connected: Show weekly stats
  - If Garmin not connected: Show connection prompt card
    - "Connect Garmin to start tracking"
    - Button → Navigate to Settings

- **Empty State**
  - If no activities and not connected: Connection prompt
  - If no activities but connected: "No activities yet" message

**Routes**:
- Main view: `/athlete-home` (Activity section active)
- Full list: `/my-activities`
- Activity detail: `/activity/:id`

### Crew Section

**Purpose**: Access Run Crew management

**Content**:
- **If in Crew**:
  - Crew card with name/description
  - "Go to Run Crew" button
  - Links to `/crew/crewadmin`

- **If not in Crew**:
  - Empty state card
  - "Join or Create a Run Crew" button
  - Links to `/runcrew/join-or-start`

**Routes**:
- Main view: `/athlete-home` (Crew section active)
- Crew admin: `/crew/crewadmin`
- Join/Create: `/runcrew/join-or-start`

### Events Section

**Purpose**: Event management and registration

**Content**:
- **Event Management Card**
  - "Open Event Management" button
  - Links to `/settings/events`
  - **Note**: Temporary location until full refactor

- **Future**: Event list, registration, etc.

**Routes**:
- Main view: `/athlete-home` (Events section active)
- Event Management: `/settings/events`

---

## State Management

### Active Section State

```javascript
const [activeSection, setActiveSection] = useState('activity'); // 'activity', 'crew', 'events'
```

**Auto-detection**: Updates based on current route:
- `/my-activities` or `/activity/*` → `activity`
- `/crew/*` or `/runcrew/*` → `crew`
- `/settings/events` → `events`

### Athlete Data

- Loaded from localStorage (full hydration model)
- Includes: profile, activities, crew context
- Refreshed on mount

---

## User Flows

### Flow 1: View Activities

1. Athlete lands on `/athlete-home` (default: Activity section)
2. If Garmin connected: Shows weekly summary
3. If Garmin not connected: Shows connection prompt
4. Click "View All" → Navigate to `/my-activities`

### Flow 2: Access Crew

1. Click "Crew" in sidebar
2. If in crew: Shows crew card → Click "Go to Run Crew" → `/crew/crewadmin`
3. If not in crew: Shows empty state → Click "Join or Create" → `/runcrew/join-or-start`

### Flow 3: Manage Events

1. Click "Events" in sidebar
2. Shows Event Management card
3. Click "Open Event Management" → Navigate to `/settings/events`

### Flow 4: Connect Device

1. In Activity section, see connection prompt
2. Click "Connect Device" → Navigate to `/settings`
3. Connect Garmin in Settings
4. Return to Activity section → See weekly summary

---

## Component Structure

### AthleteHome.jsx

**Location**: `src/Pages/Athlete/AthleteHome.jsx`

**Structure**:
```
<div className="flex min-h-screen">
  <Sidebar />
  <MainContent>
    <Header />
    <SectionContent>
      {activeSection === 'activity' && <ActivitySection />}
      {activeSection === 'crew' && <CrewSection />}
      {activeSection === 'events' && <EventsSection />}
    </SectionContent>
  </MainContent>
</div>
```

**Props/State**:
- `activeSection` - Current section ('activity', 'crew', 'events')
- `athleteProfile` - Full athlete profile
- `weeklyActivities` - Cached weekly activities
- `weeklyTotals` - Weekly stats (miles, calories, count)
- `runCrewId` - Current crew ID (if in crew)
- `connections` - Device connection status (from Settings)

---

## Design Principles

1. **Persistent Sidebar** - Always visible, clear navigation
2. **Section-Specific Content** - Each section has its own content area
3. **Connection Awareness** - Activity section prompts for connection if needed
4. **Empty States** - Clear messaging when no data/connections
5. **Progressive Disclosure** - Show summary, link to details

---

## Future Enhancements

1. **Persistent Layout Component**
   - Sidebar stays visible across all pages
   - Not just on `/athlete-home`

2. **Event Registration**
   - Register for events (future state)
   - View registered events
   - Separate from event management

3. **Activity Quick Actions**
   - Quick log activity
   - Sync now button
   - Recent activities preview

4. **Crew Quick Actions**
   - Upcoming runs
   - Recent messages
   - Crew stats

5. **Settings Integration**
   - Settings as right sidebar or modal
   - Quick access to device connections
   - Account settings inline

---

## Key Takeaways

1. ✅ **Athlete Home = Main Hub** - Primary navigation point
2. ✅ **Sidebar Navigation** - Track, Crew, Events
3. ✅ **Section-Specific Content** - Each section has dedicated content
4. ✅ **Connection Prompts** - Activity section guides to connection
5. ✅ **Settings Access** - Top right button (not in sidebar)
6. ✅ **Route-Based Active State** - Sidebar reflects current route

---

**Last Updated**: January 2025  
**Status**: Refactored Implementation  
**Next Steps**: Make sidebar persistent across all pages, add event registration

