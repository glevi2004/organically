<!-- b6fc69bd-e260-45e6-ae16-4280db39feb4 575442e4-0990-45b5-932c-024ef3c0c9a2 -->
# Instagram Publishing Implementation

## 1. Create Instagram Publishing Service

Add publishing functions to `src/services/instagramService.ts`.

Use existing env variable: `process.env.INSTAGRAM_BASE_URL` (`https://graph.instagram.com/`)

### API Endpoints Reference

**Create Image Container:**

```
POST {INSTAGRAM_BASE_URL}/{IG_USER_ID}/media
Headers: Authorization: Bearer {ACCESS_TOKEN}
Body: {
  "image_url": "https://firebase-storage-url/image.jpg",
  "caption": "Post caption with #hashtags"
}
Response: { "id": "<IG_CONTAINER_ID>" }
```

**Create Video/Reel Container:**

```
POST {INSTAGRAM_BASE_URL}/{IG_USER_ID}/media
Body: {
  "video_url": "https://firebase-storage-url/video.mp4",
  "media_type": "REELS",
  "caption": "Post caption"
}
```

**Create Carousel Item Container (no caption):**

```
POST {INSTAGRAM_BASE_URL}/{IG_USER_ID}/media
Body: {
  "image_url": "https://...",
  "is_carousel_item": true
}
```

**Create Carousel Container:**

```
POST {INSTAGRAM_BASE_URL}/{IG_USER_ID}/media
Body: {
  "media_type": "CAROUSEL",
  "caption": "Post caption",
  "children": "<ID_1>,<ID_2>,<ID_3>"
}
```

**Check Container Status (poll for videos):**

```
GET {INSTAGRAM_BASE_URL}/{IG_CONTAINER_ID}?fields=status_code
Response: { "status_code": "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" }
```

**Publish Container:**

```
POST {INSTAGRAM_BASE_URL}/{IG_USER_ID}/media_publish
Body: { "creation_id": "<IG_CONTAINER_ID>" }
Response: { "id": "<IG_MEDIA_ID>" }
```

### Limitations

- JPEG only for images
- Max 10 items per carousel
- 100 posts per 24-hour period
- Container expires after 24 hours if not published

## 2. Create API Endpoint

Create `src/app/api/instagram/post/route.ts`:

```typescript
// POST /api/instagram/post
// Body: { postId, organizationId }
// Flow:
// 1. Fetch post and organization from Firestore (using adminDb)
// 2. Get connected Instagram channel + decrypt access token
// 3. For each media item:
//    - If single: createMediaContainer with caption
//    - If multiple: createMediaContainer with is_carousel_item=true
// 4. If video: poll status until FINISHED
// 5. If carousel: createCarouselContainer with children IDs
// 6. Call media_publish endpoint
// 7. Update post: status="posted", instagramMediaId, publishedAt
```

## 3. Update PostModal UI

Modify `src/components/PostModal.tsx`:

- Add `isPublishing` state
- Check if `activeOrganization?.channels` has Instagram channel
- Add "Publish" button next to "Add to calendar"
- Show "Connect Instagram" if no channel connected (links to settings)
- On publish success: update post status, show toast, close modal

## 4. Update Post Type

Add to `src/types/post.ts`:

- `instagramMediaId?: string`
- `publishedAt?: Date`

## Files to Modify

| File | Action |

|------|--------|

| `src/services/instagramService.ts` | Add createMediaContainer, createCarouselContainer, checkContainerStatus, publishMedia |

| `src/app/api/instagram/post/route.ts` | New endpoint |

| `src/components/PostModal.tsx` | Add Publish button |

| `src/types/post.ts` | Add instagramMediaId, publishedAt |

### To-dos

- [ ] Add publishing functions to instagramService.ts
- [ ] Create /api/instagram/post endpoint
- [ ] Add instagramMediaId and publishedAt to Post type
- [ ] Add Publish button to PostModal with connect check