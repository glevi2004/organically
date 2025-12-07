# Social Media Integration Plan (Instagram, TikTok, Twitter)

This plan outlines the steps to implement automated posting for scheduled posts to Instagram, TikTok, and Twitter (X) in the Organically WebApp.

## 1. Architecture Overview

To handle scheduled posting, we need:

1.  **OAuth 2.0 Authentication**: To get access tokens for users' social accounts.
2.  **Token Management**: Securely store and refresh tokens in Firestore/Firebase.
3.  **Scheduling Engine**: A mechanism to trigger posts at the scheduled time (e.g., Vercel Cron, Inngest, or a custom Firebase Cloud Function).
4.  **Publishing Service**: Adapters for each social platform's API.

## 2. Authentication & Permissions

We need to register applications on each platform's developer portal.

### Instagram (via Meta for Developers)

- **App Type**: Business App.
- **Permissions**: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
- **Flow**: Facebook Login -> Select Instagram Business Account.

### TikTok (via TikTok for Developers)

- **Permissions**: `video.publish`, `user.info.basic`.
- **Flow**: TikTok Login Kit.

### Twitter / X (via X Developer Portal)

- **App Type**: Web App.
- **Permissions**: `tweet.read`, `tweet.write`, `users.read`, `offline.access`.
- **Flow**: OAuth 2.0 with PKCE.

## 3. Database Schema Updates

We need to update the `profiles` collection to store connected account credentials.

```typescript
// stored in profiles/{profileId}
interface SocialConnections {
  instagram?: {
    accessToken: string;
    instagramBusinessId: string; // The IG user ID
    facebookPageId: string; // Linked FB Page ID
    expiresAt: number;
  };
  tiktok?: {
    accessToken: string;
    refreshToken: string;
    openId: string;
    expiresAt: number;
  };
  twitter?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
```

## 4. Implementation Steps

### Phase 1: OAuth Setup (Frontend & API)

1.  Create `/app/api/auth/[platform]/route.ts` endpoints for initiating OAuth flows.
2.  Create `/app/api/auth/[platform]/callback/route.ts` endpoints to exchange codes for tokens.
3.  Update Profile Settings UI to allow connecting/disconnecting accounts.

### Phase 2: Publishing Logic (Backend)

Create a `SocialMediaService` with methods for each platform.

#### Instagram Publishing

- **Image/Video**: Two-step process.
  1.  `POST /{ig-user-id}/media` (create container with image/video URL).
  2.  `POST /{ig-user-id}/media_publish` (publish container).

#### TikTok Publishing

- **Video**:
  1.  Initiate upload via `https://open.tiktokapis.com/v2/post/publish/video/init/`.
  2.  Upload video file.
  3.  Verify/finalize.

#### Twitter Publishing

- **Text/Media**:
  1.  Use `POST /2/tweets` for text.
  2.  For media, upload via v1.1 `media/upload` first, then attach `media_id` to v2 Tweet.

### Phase 3: Scheduling System

Since this is a Next.js app, we can use **Vercel Cron** or a dedicated queue like **Upstash QStash** or **Inngest**.

- **Approach**:
  1.  User creates a post with `scheduledTime`.
  2.  Save post to Firestore with `status: 'scheduled'`.
  3.  Cron job runs every minute/hour calling `/api/cron/publish`.
  4.  Query Firestore for posts where `scheduledTime <= now` and `status == 'scheduled'`.
  5.  Trigger `SocialMediaService.publish()`.
  6.  Update post `status` to `published` or `failed`.

## 5. Next Actions

1.  **Developer Accounts**: User needs to set up developer accounts for IG, TikTok, and X.
2.  **Environment Variables**: Add client IDs and secrets to `.env.local`.
3.  **Connect UI**: Build the "Connections" tab in settings.
