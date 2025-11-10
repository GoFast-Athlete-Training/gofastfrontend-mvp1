# RunCrew Admin Dashboard - Feature Roadmap & Checklist

**Last Updated**: November 2025  
**Status**: In Progress  
**Focus**: Verify and fix one feature at a time

---

## Current Priority: RunCrewAdmin Core Features

### ✅ Phase 1: Basic Admin Actions (Current Focus)

#### 1. Announcements
- [ ] **Can I create an announcement?**
  - [ ] Form accepts text input
  - [ ] "Post Announcement" button works
  - [ ] Announcement appears immediately in list
  - [ ] Announcement persists after page refresh
  - [ ] Backend route `/api/runcrew/announcements` is called
  - [ ] Error handling if backend fails

#### 2. Membership Management
- [ ] **Can I see all memberships?**
  - [ ] Members section displays all crew members
  - [ ] Shows member names (firstName + lastName)
  - [ ] Shows member photos (photoURL) or initials fallback
  - [ ] Shows member emails
  - [ ] Shows admin badges for admins
  - [ ] Shows join dates (joinedAt)
  - [ ] Empty state when no members
  - [ ] Data comes from `crew.memberships` hydration

#### 3. Run Management
- [ ] **Can I see athlete times/activities?**
  - [ ] Upcoming runs display correctly
  - [ ] Run details show date, time, location
  - [ ] Run details show distance, pace
  - [ ] Run details show description
  - [ ] Edit run modal works
  - [ ] Delete run works (if implemented)
  - [ ] Create run modal works
  - [ ] Runs persist after refresh

#### 4. RSVP System
- [ ] **Can I see RSVPs?**
  - [ ] RSVP count displays on run cards
  - [ ] "X going" shows correct count
  - [ ] Expanded run details show RSVP list
  - [ ] RSVP list shows athlete names
  - [ ] RSVP list shows athlete avatars
  - [ ] RSVP statuses display correctly (going/maybe/not-going)
  - [ ] RSVP data comes from `run.rsvps` array

#### 5. Member Role Management
- [ ] **Can I elevate members to admin roles?**
  - [ ] Settings page accessible from admin dashboard
  - [ ] Member list shows role badges
  - [ ] "Make Admin" button/action exists
  - [ ] Role change persists to backend
  - [ ] Role change reflects in UI immediately
  - [ ] Backend route `/api/runcrew/managers` or similar works
  - [ ] Error handling for permission issues

---

## Phase 2: Advanced Features (After Phase 1 Complete)

### 6. Messages/Chat
- [ ] Admin can post messages
- [ ] Messages display in feed
- [ ] Messages show author info
- [ ] Messages persist

### 7. Leaderboard
- [ ] Leaderboard displays member stats
- [ ] Toggle between miles/runs/calories works
- [ ] Data comes from `crew.leaderboardDynamic`
- [ ] Empty state when no data

### 8. Invite Management
- [ ] Join code displays
- [ ] Copy invite button works
- [ ] Invite shows when crew is empty
- [ ] Invite link is correct format

---

## Phase 3: Polish & Edge Cases

### 9. Error Handling
- [ ] Network errors handled gracefully
- [ ] Backend errors show user-friendly messages
- [ ] Loading states for async operations
- [ ] Optimistic updates with rollback on failure

### 10. Data Sync
- [ ] Re-sync button works
- [ ] Data refreshes after mutations
- [ ] LocalStorage stays in sync with backend
- [ ] No stale data issues

### 11. UI/UX Polish
- [ ] Spacing is consistent (flush left, no gaps)
- [ ] Modal forms don't cause page jumps
- [ ] Empty states are helpful
- [ ] Loading indicators are clear
- [ ] Success/error toasts work

---

## Testing Checklist Per Feature

When testing each feature, verify:

1. **Frontend UI**
   - [ ] Component renders correctly
   - [ ] Form inputs work
   - [ ] Buttons are clickable
   - [ ] Data displays correctly

2. **Backend Integration**
   - [ ] API route is called
   - [ ] Request payload is correct
   - [ ] Response is handled
   - [ ] Error responses are handled

3. **Data Persistence**
   - [ ] Changes persist in localStorage
   - [ ] Changes persist in backend
   - [ ] Changes survive page refresh
   - [ ] Data syncs correctly

4. **User Experience**
   - [ ] Loading states show
   - [ ] Success feedback appears
   - [ ] Error messages are clear
   - [ ] No white screens of death

---

## Current Known Issues

1. **Announcements**: Need to verify backend route works
2. **Memberships**: Need to verify data structure matches hydration
3. **RSVPs**: Need to verify RSVP data structure
4. **Role Management**: Settings page may need implementation
5. **Spacing**: Layout needs flush-left alignment

---

## Next Steps

1. Start with **Announcements** - verify end-to-end flow
2. Move to **Memberships** - verify display and data
3. Test **RSVPs** - verify count and list display
4. Check **Role Management** - verify settings page exists
5. Fix any issues found before moving to next feature

---

**Note**: Focus on one feature at a time. Don't move to next feature until current one is fully working.

