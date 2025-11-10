# Athlete Settings Architecture

**Last Updated**: January 2025  
**Purpose**: Architecture documentation for the Athlete Settings system in GoFast MVP1

---

## Overview

The Settings page (`/settings`) is the central hub for athletes to manage their account, connections, and event management. The page should be clear, organized, and not overwhelming - focusing on what athletes actually need to configure.

**Key Principle**: Settings should feel like a **control panel**, not a feature showcase. Each section should have a clear purpose and be easy to navigate.

---

## Current Structure

### Athlete Home (`/athlete-home`) - Main Hub with Sidebar

**Left Sidebar Navigation:**
1. **Track** - Activity tracking and viewing
   - Route: `/my-activities`
   - Shows weekly activity summary
   - Links to full activity history

2. **Run Crew** - Crew management
   - Route: `/crew/crewadmin` (if in crew) or `/runcrew/join-or-start`
   - Manage crew, coordinate runs

3. **Events** - Event management
   - Route: `/settings/events`
   - Create events, manage volunteers
   - **Note**: Temporarily here until full refactor

**Top Right:**
- Settings button (opens Settings page)
- Profile button
- Sign Out

### Settings Page (`/settings`) - Account & Device Settings

**Purpose**: Account configuration and device connections only

**Sections:**
1. **Device Connections**
   - Garmin Connect integration (compact)
   - Strava integration (future, compact)
   - Connection status and management

2. **Account Settings** (Future)
   - Profile management
   - Privacy settings
   - Notification preferences

**Note**: Event Management moved to Athlete Home sidebar (temporary until full refactor)

---

## UX Problems (Current)

### Issue 1: Garmin Too Prominent
- Garmin connection cards take up too much visual space
- Feels like a "Garmin app" rather than GoFast settings
- Confusing for users who don't have Garmin devices

### Issue 2: Unclear Purpose
- Page header says "Device Connections" but also has Event Management
- No clear hierarchy of what's important
- Users might think "what am I doing here?"

### Issue 3: Mixed Concerns
- Event Management (organizational tool) mixed with Device Connections (personal tool)
- Should be separated or clearly organized

---

## Refactored Structure

### Athlete Home Layout (Main Hub)

```
Athlete Home (/athlete-home)
├── Left Sidebar (Persistent Navigation)
│   ├── Track → /my-activities
│   ├── Run Crew → /crew/crewadmin or /runcrew/join-or-start
│   └── Events → /settings/events (temporary)
├── Top Header
│   ├── Section Title (Track/Run Crew/Events)
│   └── Settings button, Profile, Sign Out
└── Main Content Area
    └── Section-specific content (Track summary, Run Crew card, Events card)
```

### Settings Page Layout (Account & Devices Only)

```
Settings (/settings)
├── Header: "Settings" - Account & Device Settings
├── Device Connections Section
│   ├── Garmin Connect (compact card)
│   └── Strava Connect (compact card)
└── Account Section (future)
    └── Profile, Privacy, Notifications
```

### Visual Hierarchy

**Athlete Home:**
1. **Sidebar Navigation** - Primary navigation (Track, Run Crew, Events)
2. **Main Content** - Section-specific content
3. **Settings Button** - Top right (secondary)

**Settings:**
1. **Device Connections** - Primary (compact cards)
2. **Account Settings** - Future expansion

---

## Component Structure

### Settings.jsx (Main Hub)

**Purpose**: Navigation hub to different settings sections

**Sections**:
- Event Management card (prominent)
- Device Connections (compact grid)
- Future: Account, Privacy, Notifications

**Design**:
- Clean, card-based layout
- Clear section headers
- Easy navigation to sub-sections

### EventManagement.jsx

**Purpose**: Full event CRUD and volunteer management

**Features**:
- Create events
- View events list
- Manage volunteers (view, edit)
- Pre-fill common events

**Route**: `/settings/events`

### Device Connection Cards

**Purpose**: Quick status and connection management

**Design**:
- Compact cards (not full-width)
- Status indicator (connected/not connected)
- Single action button (connect/disconnect)
- Less visual weight than current

---

## Navigation Flow

```
Athlete Home
  └── Settings (/settings)
      ├── Event Management → /settings/events
      ├── Garmin Connect (inline action)
      └── Strava Connect (inline action)
```

---

## Design Principles

1. **Clear Purpose**: Each section has a clear "why"
2. **Visual Hierarchy**: Most important features are most prominent
3. **Progressive Disclosure**: Don't show everything at once
4. **Consistent Patterns**: Use same card/button patterns throughout
5. **Less is More**: Remove clutter, focus on essentials

---

## Future Enhancements

1. **Account Settings Section**
   - Profile editing
   - Privacy controls
   - Notification preferences

2. **Settings Categories**
   - Tabs or sidebar for: Events, Devices, Account, Privacy

3. **Quick Actions**
   - Common actions at top (e.g., "Create Event", "Connect Device")

4. **Settings Search**
   - For power users with many settings

---

## Key Takeaways

1. ✅ **Settings is a hub** - Not a feature showcase
2. ✅ **Event Management is primary** - Most organizers need this
3. ✅ **Device Connections are secondary** - Compact, less prominent
4. ✅ **Clear hierarchy** - Users should know what they're doing
5. ✅ **Future-ready** - Structure supports expansion

---

**Last Updated**: January 2025  
**Status**: Refactoring in Progress  
**Next Steps**: Refactor Settings.jsx to match this architecture

