# Profile Image Upload Implementation - Complete

## Summary

Successfully replaced the emoji-based profile icon system with Firebase Storage-based image uploads. Users can now upload custom images for their profiles, with automatic deletion of old images when new ones are uploaded.

## Changes Made

### 1. Type Definitions

- **Updated** `src/types/profile.ts`: Replaced `icon: string` with `imageUrl?: string`

### 2. Firebase Configuration

- **Updated** `src/firebase/firebaseConfig.ts`: Added Firebase Storage initialization

### 3. New Services

- **Created** `src/services/imageUploadService.ts`:
  - `uploadProfileImage()` - Uploads images to Firebase Storage
  - `deleteProfileImage()` - Deletes old profile images
  - `getDefaultProfileImageUrl()` - Returns placeholder image URL
  - `validateImageFile()` - Validates file type and size

### 4. Updated Services

- **Updated** `src/services/profileService.ts`:
  - Modified `createProfile()` to accept `imageUrl` instead of `icon`
  - Modified `updateProfile()` to automatically delete old images when updating

### 5. Updated Context

- **Updated** `src/contexts/ProfileContext.tsx`:
  - Changed `createProfile()` signature to accept `imageFile` instead of `icon`
  - Handles image upload during profile creation

### 6. New UI Components

- **Created** `src/components/ui/image-upload.tsx`:
  - Reusable image upload component with drag-and-drop
  - Image preview
  - File validation
  - Size and type restrictions

### 7. Updated UI Components

- **Updated** `src/components/profile/CreateProfileDialog.tsx`: Image upload instead of emoji picker
- **Updated** `src/components/profile/ProfileSwitcher.tsx`: Displays Avatar images instead of emojis
- **Updated** `src/app/profile/[profileId]/profile/page.tsx`: Complete image management UI
- **Updated** `src/app/profile/[profileId]/home/page.tsx`: Displays Avatar instead of emoji

### 8. Updated Onboarding

- **Updated** `src/app/onboarding/page.tsx`: Removed icon handling
- **Updated** `src/components/onboarding/steps/Step1Basics.tsx`: Removed emoji picker

### 9. Security Rules

- **Created** `storage.rules`: Firebase Storage security rules for profile images

## What You Need to Do

### 1. Deploy Firebase Storage Rules

You need to deploy the storage rules to your Firebase project:

```bash
cd /Users/gabriellevicarneiroramos/Desktop/projects/organically
firebase deploy --only storage
```

If you don't have Firebase CLI installed:

```bash
npm install -g firebase-tools
firebase login
firebase init  # Select your project
firebase deploy --only storage
```

### 2. Verify Firebase Storage is Enabled

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to Storage in the left menu
4. Ensure Storage is enabled for your project
5. Verify the storage bucket exists (check firebaseConfig.storageBucket)

### 3. Test the Implementation

1. **Create a new profile** with an image
2. **Upload an image** from the profile page
3. **Update the image** and verify the old one is deleted
4. **Test file validation** (try uploading a file > 5MB or non-image file)
5. **Verify images are publicly accessible** (open imageUrl in browser)

## Features

### Image Upload

- Drag and drop support
- File type validation (JPEG, PNG, WEBP, GIF)
- File size limit (5MB max)
- Image preview before upload
- Avatar fallback with first letter of profile name

### Image Management

- Automatic deletion of old images when uploading new ones
- Default placeholder for profiles without images
- Public read access for all profile images
- Secure write access (only owner can upload/delete)

### User Experience

- Seamless image upload in profile creation dialog
- Full image management on profile page
- Profile images displayed in:
  - Profile switcher (sidebar)
  - Home page welcome card
  - Profile page

## Migration Notes

### Existing Profiles

- Old profiles with `icon` field will not have `imageUrl`
- Components automatically use default placeholder if no `imageUrl` exists
- Users can add images to existing profiles from the profile page

### Backward Compatibility

- The `imageUrl` field is optional in the Profile type
- No data migration script is needed
- Existing functionality continues to work

## Technical Details

### Storage Path Structure

```
profile-images/
  └── {userId}/
      └── {profileId}/
          └── avatar.{ext}
```

### Security

- Only authenticated users can upload images
- Users can only upload/delete their own profile images
- 5MB file size limit enforced in both client and Firebase rules
- Only image/\* content types allowed

### Performance

- Images uploaded directly to Firebase Storage
- Download URLs cached in Firestore
- Old images deleted asynchronously (non-blocking)

## Default Placeholder

Currently using UI Avatars service (https://ui-avatars.com) for default profile images.
You can replace this with:

- Your own default image uploaded to Firebase Storage
- A data URI for an embedded image
- An external CDN image

To change the default, edit `getDefaultProfileImageUrl()` in `src/services/imageUploadService.ts`.
