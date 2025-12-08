<!-- 0a5c9670-77f5-4bf0-aa43-9169c128694d e54a6994-ab6a-4467-8048-f316f550ae67 -->
# Instagram Automations Backend Implementation

## Architecture Overview

```
Instagram Webhook → API Route → Inngest Event → Background Function → Instagram API
                      ↓
              Signature Verify
                      ↓
              Find Matching Automations
```

## Phase 1: Firestore Service for Automations

**File:** `src/services/automationService.ts`

CRUD operations for automations stored as a subcollection under organizations:

- `createAutomation(orgId, data)` - Create new automation
- `getAutomationsByOrganization(orgId)` - List all automations
- `getActiveAutomationsByChannel(orgId, channelId)` - For webhook matching
- `updateAutomation(orgId, automationId, data)` - Update automation
- `deleteAutomation(orgId, automationId)` - Delete automation
- `incrementTriggerCount(orgId, automationId)` - Update stats

Firestore path: `organizations/{orgId}/automations/{automationId}`

## Phase 2: Instagram Webhook Route

**File:** `src/app/api/webhooks/instagram/route.ts`

### GET Handler (Verification)

- Verify `hub.verify_token` matches `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` env var
- Return `hub.challenge` on success

### POST Handler (Events)

1. Verify `x-hub-signature-256` using `INSTAGRAM_APP_SECRET`
2. Parse webhook payload (messaging events and comment changes)
3. Extract: `senderId`, `recipientId`, `messageText` or `commentText`, `commentId`
4. Find organization by `providerAccountId` matching `recipientId`
5. Send Inngest event `instagram/webhook.received` with payload
6. Return 200 immediately (within 2 seconds)

## Phase 3: Inngest Functions

**File:** `src/inngest/functions.ts` (replace hello-world)

### Function: `processInstagramWebhook`

- Trigger: `instagram/webhook.received`
- Steps:

  1. **step.run("find-automations")** - Query active automations matching channel
  2. **step.run("match-keywords")** - Check if message/comment matches any trigger keywords
  3. **step.run("generate-response")** - If AI action, call OpenAI; otherwise use template
  4. **step.sleep("delay")** - Optional delay from automation config
  5. **step.run("send-message")** - Call Instagram API with correct endpoint

### Instagram API Helper

```typescript
// CORRECT: graph.facebook.com (not graph.instagram.com)
const url = `https://graph.facebook.com/v21.0/${instagramAccountId}/messages`;

// For DM reply:
recipient: { id: senderId }

// For comment private reply:
recipient: { comment_id: commentId }
```

## Phase 4: Update Inngest Route

**File:** `src/app/api/inngest/route.ts`

Register the new `processInstagramWebhook` function.

## Phase 5: Connect UI to Backend

**Files to update:**

- `src/app/organization/[organizationId]/automations/page.tsx` - Replace mock data with Firestore calls
- `src/app/organization/[organizationId]/automations/[automationId]/page.tsx` - Save to Firestore

## Environment Variables Required

```
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<random-string-you-choose>
INSTAGRAM_APP_SECRET=<from-meta-dashboard>
OPENAI_API_KEY=<for-ai-responses>
```

## Key Technical Corrections (from feedback)

1. **API Host**: Use `graph.facebook.com` NOT `graph.instagram.com`
2. **Comment Replies**: Must use `recipient: { comment_id }` for private replies to comments
3. **Signature Verification**: Mandatory - prevents unauthorized webhook calls
4. **Timeout**: Webhook must respond in under 2 seconds (Inngest handles async processing)

### To-dos

- [ ] Create automationService.ts with Firestore CRUD operations
- [ ] Create Instagram webhook route with signature verification
- [ ] Implement processInstagramWebhook Inngest function
- [ ] Register new function in Inngest API route
- [ ] Connect automations UI pages to Firestore service