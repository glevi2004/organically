# Enhanced Multi-Step Onboarding - Testing Guide

## Prerequisites

1. **Apply Firestore Rules**
   - Go to Firebase Console → Firestore Database → Rules
   - Copy the contents from `firestore.rules` file
   - Publish the rules

2. **Start Development Server**
   ```bash
   cd organically-webapp
   npm install
   npm run dev
   ```

## Test Scenarios

### 1. New User Complete Flow

**Steps:**
1. Sign up with a new email
2. Should automatically redirect to onboarding
3. Complete all 8 steps:
   - Step 1: Enter workspace name, select icon, add description
   - Step 2: Select project type
   - Step 3: Select platforms (at least 1) and primary platform if multiple
   - Step 4: Select growth goals, follower target, timeframe
   - Step 5: Select content types and formats
   - Step 6: Set target audience details, add interests/pain points
   - Step 7: Add content themes (tags), select brand voice
   - Step 8: Set posting frequency per platform, select preferred times
4. On final step, click "Complete"
5. Should redirect to workspace dashboard
6. Verify no onboarding prompt banner appears

**Expected Results:**
- Each step saves progress automatically
- Progress bar updates correctly
- All validation messages appear when fields are missing
- Final redirect goes to workspace dashboard
- Workspace data is saved in Firestore

### 2. Skip Functionality

**Steps:**
1. Start onboarding as new user
2. Complete Step 1 (workspace basics)
3. On Step 2, click "Skip for now"
4. Should redirect to dashboard with incomplete onboarding
5. Verify onboarding prompt banner appears showing "12% complete" (1 of 8 steps)
6. Click "Continue Setup" in banner
7. Should return to Step 2 (where you left off)

**Expected Results:**
- Skip only works after Step 1 is complete
- Dashboard shows prominent onboarding prompt
- Progress percentage is accurate
- "Continue Setup" button navigates back to onboarding

### 3. Back Navigation

**Steps:**
1. Start onboarding
2. Complete Steps 1-4
3. On Step 5, click "Back" button
4. Should return to Step 4 with previous data intact
5. Navigate forward again
6. Previous selections should still be present

**Expected Results:**
- Back button disabled on Step 1
- Back button enabled on Steps 2-8
- Data persists when navigating back and forth
- No data loss during navigation

### 4. Validation Testing

**Step 1 Validation:**
- Try to continue without workspace name → Error: "Please enter a workspace name"

**Step 2 Validation:**
- Try to continue without selecting project type → Error: "Please select a project type"
- Select "Other" without specifying → Error: "Please specify your project type"

**Step 3 Validation:**
- Try to continue without selecting platforms → Error: "Please select at least one platform"
- Select multiple platforms without primary → Error: "Please select a primary platform"

**Step 4 Validation:**
- Try to continue without growth goals → Error: "Please select at least one growth goal"

**Step 5 Validation:**
- Try to continue without content types → Error: "Please select at least one content type"
- Try to continue without content formats → Error: "Please select at least one content style"

**Step 7 Validation:**
- Try to continue without themes → Error: "Please add at least one content theme"
- Try to continue without brand voice → Error: "Please select a brand voice"

### 5. Data Persistence

**Steps:**
1. Complete Steps 1-3
2. Close browser tab
3. Sign in again
4. Navigate to workspace dashboard
5. Click "Continue Setup" in prompt
6. Verify you're on Step 4 (next incomplete step)
7. Verify all previous data is intact

**Expected Results:**
- Progress saved to Firestore after each step
- Onboarding resumes from correct step
- No data loss between sessions

### 6. Multiple Workspaces

**Steps:**
1. Complete onboarding for first workspace
2. Create a second workspace
3. Second workspace should show onboarding prompt
4. Complete onboarding for second workspace
5. Switch between workspaces
6. Each workspace should have its own onboarding state

**Expected Results:**
- Each workspace tracks onboarding independently
- Switching workspaces shows correct prompt state

### 7. Tag Input Testing

**In Steps 6 & 7:**
1. Type an interest and press Enter → Tag should appear
2. Try to add duplicate tag → Should not allow
3. Add 10 tags (max) → Should not allow 11th
4. Click X on a tag → Should remove it
5. Type text and press Backspace with empty input → Should remove last tag

**Expected Results:**
- Tags added/removed correctly
- Character limit enforced
- No duplicate tags

### 8. Platform Selector Testing

**In Step 3:**
1. Click Instagram → Should select with checkmark
2. Click TikTok → Both should be selected
3. Primary platform section should appear
4. Select Instagram as primary → Should show "Primary" badge
5. Deselect Instagram → Primary should clear
6. With multiple platforms selected, try to continue without primary → Should show error

**Expected Results:**
- Multi-select works correctly
- Primary platform required when > 1 platform
- Visual feedback (checkmarks, borders) works

### 9. UI/UX Testing

**Check on different screens:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Verify:**
- Progress bar visible and accurate
- Step content readable and not cut off
- Buttons accessible and clickable
- Forms work on touch devices
- Emoji picker works
- Tag input works on mobile

### 10. Error Handling

**Test these scenarios:**
1. Lose internet connection mid-step → Should show error toast
2. Firebase quota exceeded → Should show friendly error
3. Invalid workspace ID in URL → Should redirect safely
4. Try to access another user's workspace → Should be blocked by Firestore rules

## Firestore Data Verification

After completing onboarding, verify in Firebase Console:

**Workspace document should have:**
```
{
  id: string,
  name: string,
  icon: string,
  description: string,
  userId: string,
  onboardingCompleted: true,
  onboardingStep: 8,
  projectType: string,
  platforms: array,
  primaryPlatform: string,
  growthGoals: array,
  followerGoal: string,
  timeframe: string,
  contentTypes: array,
  contentFormats: array,
  targetAudience: {
    ageRange: string,
    gender: string,
    interests: array,
    painPoints: array
  },
  contentThemes: array,
  brandVoice: string,
  postingFrequency: object,
  preferredPostingTimes: array,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**User document should have:**
```
{
  id: string,
  email: string,
  onboardingCompleted: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Known Issues to Watch For

1. **Race Conditions:**
   - Fast navigation between steps
   - Multiple save operations simultaneously

2. **State Management:**
   - Context not updating after save
   - Stale data when navigating back

3. **Validation Edge Cases:**
   - Empty strings vs undefined
   - Whitespace-only inputs

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors during flow
✅ Data correctly saved in Firestore
✅ Firestore rules prevent unauthorized access
✅ UI responsive on all screen sizes
✅ Loading states show during async operations
✅ Error messages are clear and helpful
✅ Navigation is intuitive
✅ Progress persists across sessions
✅ Onboarding prompt shows/hides correctly

## Performance Checks

- Each step should save in < 2 seconds
- Navigation between steps should be instant
- No memory leaks during extended use
- Firestore reads minimized (use cache where possible)

## Accessibility Testing

- Keyboard navigation works (Tab, Enter, Esc)
- Screen reader announces progress
- Color contrast meets WCAG standards
- Focus indicators visible
- Error messages announced

## Next Steps After Testing

1. Fix any bugs found during testing
2. Optimize Firestore queries if needed
3. Add analytics tracking for onboarding completion rates
4. Consider A/B testing different onboarding flows
5. Implement AI-powered content generation (Phase 2)

