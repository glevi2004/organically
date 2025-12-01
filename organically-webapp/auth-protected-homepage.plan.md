# Multi-Workspace System with Onboarding

## Overview

Implement workspace isolation where users can have multiple workspaces (Personal Brand, Startup, etc.). Each workspace contains its own content plans, ideas, calendar, and posts. New users go through an onboarding flow to create their first workspace before accessing the dashboard.

## Implementation Steps

### Phase 1: Firestore Setup & Data Structure

- **File**: `src/firebase/firebaseConfig.ts`

  - Import and initialize Firestore: `getFirestore`, `collection`, `doc`
  - Export `db` instance

- **File**: `src/types/user.ts` (new)

  - Define `UserProfile` interface:
    ```typescript
    interface UserProfile {
      id: string; // matches Firebase Auth UID
      email: string;
      displayName?: string;
      photoURL?: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
      onboardingCompleted: boolean;
    }
    ```

- **File**: `src/types/workspace.ts` (new)

  - Define `Workspace` interface:
    ```typescript
    interface Workspace {
      id: string;
      name: string;
      description?: string;
      icon: string; // emoji
      userId: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }
    ```

- **File**: `src/services/userService.ts` (new)

  - Create Firestore helper functions for user profiles:
    - `createUserProfile(userId, userData)` - Create user document on signup
    - `getUserProfile(userId)` - Get user profile
    - `updateUserProfile(userId, updates)` - Update user profile
    - `checkUserExists(userId)` - Check if user document exists

- **File**: `src/services/workspaceService.ts` (new)
  - Create Firestore helper functions:
    - `createWorkspace(userId, workspaceData)`
    - `getUserWorkspaces(userId)`
    - `getWorkspace(workspaceId)`
    - `updateWorkspace(workspaceId, updates)`
    - `deleteWorkspace(workspaceId)`

### Phase 2: Workspace Context & State Management

- **File**: `src/contexts/WorkspaceContext.tsx` (new)

  - Create context with:
    - `activeWorkspace: Workspace | null`
    - `workspaces: Workspace[]`
    - `loading: boolean`
    - `setActiveWorkspace(workspaceId)`
    - `createWorkspace(data)`
    - `refreshWorkspaces()`
  - Persist active workspace in localStorage
  - Load workspaces on mount
  - Provide context to app

- **File**: `src/app/layout.tsx`
  - Wrap app with `WorkspaceProvider` (inside `AuthProvider`)

### Phase 3: Onboarding Flow

- **File**: `src/app/onboarding/page.tsx` (new)

  - Create onboarding page with:
    - Welcome message
    - Form: workspace name, description (optional), icon picker (emoji)
    - Validation
    - Create workspace on submit
    - Redirect to workspace dashboard after creation
    - Protected route (requires auth)

- **File**: `src/components/ProtectedRoute.tsx`

  - Add workspace check:
    - If user has no workspaces → redirect to `/onboarding`
    - If user has workspaces but no active workspace → set first workspace as active

- **File**: `src/app/auth/page.tsx`
  - After successful signup/login, check if user has workspaces
  - If no workspaces → redirect to `/onboarding`
  - If workspaces exist → redirect to first workspace dashboard

### Phase 4: Workspace Switcher Component

- **File**: `src/components/workspace/WorkspaceSwitcher.tsx` (new)

  - Dropdown button showing current workspace (icon + name)
  - Dropdown menu with:
    - List of all workspaces (icon, name, description)
    - Checkmark for active workspace
    - Keyboard shortcuts (⌘1, ⌘2, etc.)
    - Separator
    - "Create Workspace" option
  - Handle workspace switching
  - Use shadcn DropdownMenu components

- **File**: `src/components/workspace/CreateWorkspaceDialog.tsx` (new)
  - Dialog component with form:
    - Workspace name (required)
    - Description (optional)
    - Icon picker (emoji selector or input)
  - Validation
  - Create workspace via context
  - Close dialog on success

### Phase 5: Update Sidebar

- **File**: `src/components/navigation/app-sidebar.tsx`
  - Replace current workspace logo dropdown with `WorkspaceSwitcher`
  - Update all navigation links to include workspace ID:
    - `/workspace/${workspaceId}/dashboard`
    - `/workspace/${workspaceId}/analytics`
    - `/workspace/${workspaceId}/idea-dump`
    - `/workspace/${workspaceId}/calendar`
    - `/workspace/${workspaceId}/posts`
    - `/workspace/${workspaceId}/settings`
  - Get workspace ID from `WorkspaceContext`

### Phase 6: Routing Structure Update

- **File**: `src/app/workspace/[workspaceId]/layout.tsx` (new)

  - Create workspace layout that:
    - Validates workspace exists and user has access
    - Wraps children with sidebar layout
    - Shows workspace name in breadcrumb
    - Redirects to onboarding if workspace doesn't exist

- **File**: `src/app/workspace/[workspaceId]/dashboard/page.tsx` (new)

  - Move current `/home/page.tsx` content here
  - Filter dashboard data by workspace ID
  - Update breadcrumb to show workspace name

- **File**: `src/app/workspace/[workspaceId]/analytics/page.tsx` (new)

  - Create analytics page (placeholder for now)
  - Workspace-scoped

- **File**: `src/app/workspace/[workspaceId]/idea-dump/page.tsx` (new)

  - Create idea dump page (placeholder for now)
  - Workspace-scoped

- **File**: `src/app/workspace/[workspaceId]/calendar/page.tsx` (new)

  - Create calendar page (placeholder for now)
  - Workspace-scoped

- **File**: `src/app/workspace/[workspaceId]/posts/page.tsx` (new)

  - Create posts page (placeholder for now)
  - Workspace-scoped

- **File**: `src/app/workspace/[workspaceId]/settings/page.tsx` (new)

  - Create settings page with General and Platforms tabs
  - Workspace-scoped settings

- **File**: `src/app/home/page.tsx`
  - Redirect to first workspace or onboarding:
    - Check if user has workspaces
    - If yes → redirect to first workspace dashboard
    - If no → redirect to onboarding

### Phase 7: Update Navigation & Links

- **File**: `src/app/home/layout.tsx`

  - Update breadcrumb to show workspace name
  - Update links to use workspace routes

- **File**: `src/components/navbar.tsx`
  - Update "Home" link to redirect to first workspace or onboarding

### Phase 8: Workspace Validation Middleware

- **File**: `src/lib/workspace-utils.ts` (new)
  - Helper functions:
    - `validateWorkspaceAccess(userId, workspaceId)`
    - `getWorkspaceFromUrl()`
    - `redirectToWorkspace(workspaceId)`

## Key Files to Create/Modify

**New Files:**

- `src/types/user.ts`
- `src/types/workspace.ts`
- `src/services/userService.ts`
- `src/services/workspaceService.ts`
- `src/contexts/WorkspaceContext.tsx`
- `src/app/onboarding/page.tsx`
- `src/components/workspace/WorkspaceSwitcher.tsx`
- `src/components/workspace/CreateWorkspaceDialog.tsx`
- `src/app/workspace/[workspaceId]/layout.tsx`
- `src/app/workspace/[workspaceId]/dashboard/page.tsx`
- `src/app/workspace/[workspaceId]/analytics/page.tsx`
- `src/app/workspace/[workspaceId]/idea-dump/page.tsx`
- `src/app/workspace/[workspaceId]/calendar/page.tsx`
- `src/app/workspace/[workspaceId]/posts/page.tsx`
- `src/app/workspace/[workspaceId]/settings/page.tsx`
- `src/lib/workspace-utils.ts`

**Modified Files:**

- `src/firebase/firebaseConfig.ts` - Add Firestore
- `src/app/layout.tsx` - Add WorkspaceProvider
- `src/components/ProtectedRoute.tsx` - Add workspace check
- `src/app/auth/page.tsx` - Redirect to onboarding if no workspaces
- `src/components/navigation/app-sidebar.tsx` - Add WorkspaceSwitcher, update links
- `src/app/home/page.tsx` - Redirect logic
- `src/app/home/layout.tsx` - Update breadcrumb

## Data Flow

1. User signs up/logs in → Check for workspaces
2. If no workspaces → Redirect to `/onboarding`
3. User creates workspace → Redirect to `/workspace/[id]/dashboard`
4. WorkspaceContext loads and sets active workspace
5. All pages filter data by active workspace ID
6. User can switch workspaces via WorkspaceSwitcher
7. All navigation updates to new workspace routes
