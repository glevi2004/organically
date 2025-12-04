# Post Types and Multiple Platforms Implementation

## Overview

Add post types (short-video, long-video, thread) and enable multiple platforms per post. Platform selection is restricted based on post type (thread = Twitter/LinkedIn only; video types = all platforms). Post type is optional with a default, and platforms can only be selected after type is chosen.

**IMPORTANT: NO BACKWARD COMPATIBILITY - Complete migration to new structure.**

## Implementation Steps

### 1. Update Type Definitions

**File:** `src/types/post.ts`

- Add `PostType` type: `"short-video" | "long-video" | "thread"`
- **REMOVE** `platform: PostPlatform` field entirely
- **ADD** `platforms: PostPlatform[]` (required array, minimum 1 platform)
- Add `type?: PostType` to `Post` interface
- Update `CreatePostInput` to include `type?: PostType` and `platforms: PostPlatform[]`
- **DELETE** all references to the old `platform` field

### 2. Create Post Type Configuration

**File:** `src/lib/post-constants.ts` (new file)

- Define post types with labels and descriptions
- Create `getAllowedPlatformsForType(type: PostType | undefined): PostPlatform[]` function
  - `thread` → `["x", "linkedin"]`
  - `short-video` / `long-video` → all platforms
  - `undefined` (default) → all platforms

### 3. Update Post Service

**File:** `src/services/postService.ts`

- Update `createPost` to handle `platforms` array (ensure at least one platform, throw error if empty)
- Update `updatePost` to handle `platforms` array
- Update all `getPost*` functions to read `platforms` array from Firestore
- **DELETE** all backward compatibility code for old `platform` field
- **DELETE** any logic that sets or reads single `platform` field

### 4. Use Existing Shadcn Components for Multi-Select

**Use existing components - DO NOT create new multi-select component**

- Use `DropdownMenu` with `DropdownMenuCheckboxItem` from shadcn
- Display selected platforms as badges using existing `Badge` component
- Reference: `src/components/ui/dropdown-menu.tsx` already has `DropdownMenuCheckboxItem`

### 5. Update Create Post Dialog

**File:** `src/app/profile/[profileId]/posts/page.tsx`

- Add state for `postType` (optional, default to `undefined`)
- Add state for `platforms` (required array, default to empty `[]`)
- Add post type selector dropdown (optional field)
- Add platforms multi-select using `DropdownMenu` + `DropdownMenuCheckboxItem`
- Display selected platforms as `Badge` components
- Apply platform restrictions using `getAllowedPlatformsForType`
- Update `handleAddPost` to use `platforms` array
- Update validation to ensure at least one platform is selected
- **DELETE** old single platform selector code

### 6. Update Post Edit Page

**File:** `src/app/profile/[profileId]/posts/[postId]/page.tsx`

- Add post type selector in properties section
- Replace single platform display with platforms multi-select (DropdownMenu + CheckboxItem)
- Display all selected platforms as icons/badges
- Update `handleFieldSave` to handle `platforms` array and `type`
- Update `debouncedSave` to include `type` and `platforms` in save logic
- **DELETE** old single platform display code

### 7. Update Kanban Board Display

**File:** `src/app/profile/[profileId]/posts/page.tsx`

- Update `SortablePostCard` component to display all platform icons
- **REPLACE** single `platformLogo` with `post.platforms.map()` to show all icons
- Ensure proper spacing and layout for multiple icons
- **DELETE** old single platform logo code

### 8. Update Calendar View

**File:** `src/app/profile/[profileId]/calendar/page.tsx`

- Update post card rendering to show all platform icons
- **REPLACE** single `platformLogo` with `post.platforms.map()` to show all logos
- **DELETE** old single platform logo code

## Migration Strategy

**NO BACKWARD COMPATIBILITY - Breaking change**

- Existing posts in database will need manual migration or will show as having no platforms
- All code that references `post.platform` (singular) should be **DELETED**
- Only `post.platforms` (plural, array) should exist in the codebase

## Code Cleanup Checklist

- [ ] Delete all `platform` (singular) references from Post type
- [ ] Delete all `getPlatformIcon(post.platform)` - replace with `post.platforms.map()`
- [ ] Delete backward compatibility logic from postService
- [ ] Use existing shadcn DropdownMenu + CheckboxItem - DO NOT create custom multi-select
- [ ] Delete any unused helper functions or variables

## Notes

- Use existing shadcn components: `DropdownMenu`, `DropdownMenuCheckboxItem`, `Badge`, `Button`
- Do NOT create new custom components
- No migration for existing posts - they will need to be updated manually
- Platform restrictions only apply when creating/editing posts with a type selected
- Default behavior: if no type is selected, all platforms are available
