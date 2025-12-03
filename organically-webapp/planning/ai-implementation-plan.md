# Content Management Implementation Plan

This plan outlines the implementation strategy for "Organically" - a manual content management system for social media creators.

## 1. Core Architecture: Manual Content Management

The app focuses on giving users full control over their content creation process with structured organization tools.

- **Services:** Firebase CRUD operations for posts, ideas, and profiles
- **Function:** To provide a structured system for planning and organizing social media content
- **Profile-Based:** User profiles store preferences that guide their content strategy (platforms, consistency level, audience, etc.)

---

## 2. Page-by-Page Implementation

### A. Home Dashboard (`/profile/[id]/home`)

**Goal:** The daily command center. "What do I need to do today?"

- [x] **"Today's Focus" Widget:** Shows posts scheduled for today
- [x] **Quick Stats:** Display total posts, ideas, and active platforms
- [x] **Upcoming Posts:** Preview of posts scheduled for the week
- [x] **Quick Actions:** Buttons to navigate to calendar and idea dump

### B. Calendar (`/profile/[id]/calendar`)

**Goal:** Strategic overview and content scheduling.

- [x] **"Add Post" Button:** Manually create posts with a dialog
  - _Input:_ Title, content, platform, scheduled date
  - _Process:_ User writes their own content
  - _Output:_ Post is added to the calendar in "draft" status
- [x] **Month View:** Visual calendar grid showing all posts
- [x] **Status Coding:** Color-coded items (Idea ➝ Draft ➝ Ready ➝ Posted)
- [x] **Platform Icons:** Visual indicators for each platform

### C. Posts / Content Factory (`/profile/[id]/posts`)

**Goal:** Organize and edit content.

- [x] **Kanban Board:** Organize posts by status (idea, draft, ready, posted)
- [x] **Edit Drawer:** When clicking a post:
  - **Manual Editing:** Edit title, content, and private notes
  - **Status Management:** Move posts through the workflow
  - **Platform Display:** See which platform each post is for
  - **Delete Option:** Remove posts when no longer needed

### D. Idea Dump (`/profile/[id]/idea-dump`)

**Goal:** Quick capture of spontaneous content ideas.

- [x] **Simple Manual Entry:** Add idea button opens dialog with title and description fields
- [x] **View All Ideas:** Clean list view of all saved ideas
- [x] **Delete Ideas:** Remove ideas when no longer needed
- [x] **Full Width Layout:** Maximizes available space for idea management

**Note:** This is a lightweight note-taking feature for manual brainstorming and idea capture.

---

## 3. Technical Dependencies

1. **Firebase:** Firestore for database, Auth for authentication, Storage for images
2. **Database Collections:**
   - `users` collection: User account data
   - `profiles` collection: Profile information with brand settings
   - `posts` collection: `{ id, profileId, userId, status, content, platform, scheduledDate, title, notes, ... }`
   - `ideas` collection: `{ id, profileId, userId, title, description, createdAt, ... }`
3. **State Management:** `ProfileContext` and `AuthContext` for global state

## 4. Implementation Status

✅ **Completed:**

1. Setup `users`, `profiles`, `posts` and `ideas` collections in Firebase with comprehensive security rules
2. Implemented manual post creation via Calendar page
3. Implemented Kanban board for post management
4. Built Idea Dump as a simple manual note-taking page
5. Full TypeScript implementation with proper error handling
6. Firebase Authentication integration
7. Image upload for profile pictures
8. 5-step onboarding flow
9. Dashboard with today's focus and stats
10. Firestore Security Rules deployed and tested
