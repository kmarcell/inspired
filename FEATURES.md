# FEATURES.md - Inspired Feature & Data Specification

This file serves as the canonical source for all feature requirements, UI components, screen behaviors, and NoSQL data schemas for the "Inspired" yoga platform.

---

## 1. Feature Index
*Index of all features currently planned or in development.*

1.  **User Authentication & Login** (Status: Planned - Google & Email/Password.)
2.  **Landing Page Shell** (Navigation & Layout)
3.  **Community Feed & Post Card** (Unified Discovery & Mixed Content)
4.  **User Profiles & Teacher Privacy** (TBD)
5.  **Communities & Joined Groups** (TBD)
6.  **Notifications & Alerts** (TBD)
7.  **New Post Flow** (TBD)
8.  **Teacher Finder & Studio Discovery** (Shadow Profile Seeding)
9.  **Yoga Studio Profiles & Claiming Flow** (TBD)
10. **Real-time Chat** (TBD)
11. **Class Scheduling & Booking** (TBD)
12. **Localization** (TBD)
13. **Issue Reporting & Support** (TBD)
14. **Accessibility** (Requirements Defined)

---

## 2. NoSQL Data Schemas (JSON Specification)

This section documents the precise data contracts between the iOS application and Cloud Firestore.

### 2.1 User Profile Schema
*Collection: `/users/{userId}`*

**JSON Example:**
```json
{
  "id": "user_abc_123",
  "username": "yoga_explorer#4521",
  "displayName": "Jane Doe",
  "bio": "Yoga enthusiast based in London.",
  "lastSearchArea": "Askew",
  "profilePictureUrl": "https://storage.googleapis.com/.../profile_small.jpg",
  "thumbnailUrl": "https://storage.googleapis.com/.../thumb.jpg",
  "privacySettings": {
    "isProfilePublic": false,
    "avatarPrivacy": "groups-only",
    "showJoinedGroups": "members-only"
  },
  "joinedCommunities": ["area_askew", "studio_123"],
  "createdAt": "2026-02-18T10:00:00Z",
  "updatedAt": "2026-02-18T11:30:00Z"
}
```

**Field Documentation:**
| Field | Type | Description | PII? |
| :--- | :--- | :--- | :--- |
| `id` | `String` | Unique User ID (from Firebase Auth). | No |
| `username` | `String` | Public handle in `name#1234` format. | No |
| `displayName` | `String` | User's full name. | **Yes** |
| `bio` | `String` | Short biography (Max 280 chars). | No |
| `lastSearchArea`| `String` | Last area name searched or IP-detected (e.g., "Hammersmith"). | No |
| `profilePictureUrl` | `String` | URL for the **standard-resolution** (1024px) avatar. | **Yes** (Subject to Privacy Rules) |
| `thumbnailUrl` | `String` | URL for the **thumbnail-resolution** (150px) avatar. | **Yes** (Subject to Privacy Rules) |
| `privacySettings` | `Map` | User's granular privacy toggles. See 2.1.1. | No |
| `createdAt` | `Timestamp` | ISO 8601 creation date. | No |

#### 2.1.1 Privacy Settings Schema
| Field | Type | Description | Possible Values |
| :--- | :--- | :--- | :--- |
| `isProfilePublic` | `Boolean` | Controls public visibility of the profile (search, bio). | `true`, `false` |
| `avatarPrivacy` | `String` | Visibility level of the profile picture (Standard & Thumbnail). | `public`, `groups-only` |
| `showJoinedGroups` | `String` | Visibility level of the joined communities list. | `public`, `groups-only`, `members-only` |

**Constraints:**
- **Public Profile Constraint:** If `isProfilePublic` is `true`, `avatarPrivacy` must be `public`.
- **Default State:** New users default to `isProfilePublic: false` and `avatarPrivacy: "groups-only"`.

---

### 2.2 Yoga Studio Profile Schema
*Collection: `/studios/{studioId}`*

**Shadow vs. Claimed States:**
- **Shadow State:** Seeded from Google Places API via Cloud Functions. Contains basic name, address, and location. `isClaimed: false`.
- **Claimed State:** Verified by a studio owner. Unlocks management features (chat, scheduling, moderation). `isClaimed: true`.

**JSON Example:**
```json
{
  "id": "studio_xyz_456",
  "name": "Hyde Park Yoga Sanctuary",
  "address": "123 Hyde Park St, London W2 2UH",
  "about": "A peaceful oasis in the heart of London.",
  "rating": 4.8,
  "isClaimed": false,
  "ownerId": null,
  "reviewCount": 125,
  "moderationSettings": {
    "autoApproveMemberComments": true,
    "guestCommentsEnabled": false
  },
  "location": {
    "lat": 51.5074,
    "lng": -0.1278
  }
}
```

**Field Documentation:**
| Field | Type | Description | PII? |
| :--- | :--- | :--- | :--- |
| `id` | `String` | Unique Studio ID. | No |
| `name` | `String` | Business name of the studio. | No |
| `isClaimed` | `Boolean` | Flag indicating if the profile has been verified by an owner. | No |
| `ownerId` | `String` | User ID of the verified owner (if claimed). | No |
| `address` | `String` | Public business address. | No |
| `about` | `Markdown` | Formatted studio description (Max 500 chars). | No |
| `rating` | `Number` | Average user rating (0-5.0). | No |
| `location` | `Geopoint` | Exact coordinates for business location. | No |

---

### 2.3 Community Post Schema
*Collection: `/posts/{postId}`*

**JSON Example:**
```json
{
  "id": "post_123",
  "author": {
    "id": "user_abc",
    "username": "yoga_teacher#8821",
    "thumbnailUrl": "https://storage.googleapis.com/.../thumb.jpg",
    "avatarPrivacy": "groups-only"
  },
  "content": "Just finished a great morning flow! #yoga #zen",
  "source": {
    "type": "area",
    "name": "Askew"
  },
  "stats": {
    "likeCount": 12,
    "commentCount": 3
  },
  "createdAt": "2026-02-18T18:00:00Z"
}
```

**Field Documentation:**
| Field | Type | Description | PII? |
| :--- | :--- | :--- | :--- |
| `id` | `String` | Unique Post ID. | No |
| `author` | `Map` | Denormalized author info (ID, username, avatar, privacy) for fast rendering. | No |
| `content` | `Markdown`| Standard Markdown text (Max 500 chars). | No |
| `source` | `Map` | Origin: type (`area`|`community`) and name. | No |
| `stats` | `Map` | Denormalized counts for likes and comments. | No |
| `createdAt` | `Timestamp`| Chronological sort key. | No |

#### 2.3.1 Post Comments (Sub-collection)
*Collection: `/posts/{postId}/comments/{commentId}`*

**JSON Example:**
```json
{
  "id": "comment_789",
  "author": {
    "id": "user_xyz",
    "username": "yogi_fan#1234",
    "thumbnailUrl": "https://storage.googleapis.com/.../thumb.jpg"
  },
  "text": "This looks like a great spot! I'll be there.",
  "createdAt": "2026-02-18T19:30:00Z"
}
```

#### 2.3.2 Post Likes (Global Query Path)
*Collection: `/posts/{postId}/likes/{userId}`*

**JSON Example:**
```json
{
  "userId": "user_abc",
  "createdAt": "2026-02-18T19:00:00Z"
}
```

**Client-side Join Logic:**
- **Mechanism:** To determine if the current user has liked a post without bloating data, the client must perform a **batched query** for every new page of feed posts.
- **Batching:** Query the `likes` sub-collections where `userId == currentUser.id` for the specific `postIds` in the current view.
- **Consistency:** Storing by `userId` as the document ID in the sub-collection ensures a user can only like a post once.

---

## 4. Technical Implementation Details

### 4.1 Image Handling (Avatars & Studio Media)
- **Downsampling:** All images are processed **on-device** before upload to Cloud Storage using platform-native APIs.
- **Target Resolutions (Standard):** See Section 4.1.1 for specific pixel requirements.
- **Upload Strategy:**
    - Use platform-appropriate storage SDKs.
    - File naming convention: `images/{feature}/{uid}_{version}.jpg` (e.g., `avatars/123_thumb.jpg`).
- **Data Integrity:** Store both `thumbnailUrl` and `standardUrl` in the corresponding Firestore document.

#### 4.1.1 Standard Image Resolutions
| Version | Dimensions | Format | Compression | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Thumbnail** | 150x150 px | JPEG (Square Crop) | ~0.7 | Lists, small avatars, previews. |
| **Standard** | Max 1024x1024 px | JPEG (Aspect-fit) | ~0.7 | Profile headers, full media views. |

### 4.2 Cache Policy & Asset Hygiene
- **Caching Mechanism:** Use native SwiftUI **AsyncImage** or a **URLSession** wrapper with standard `URLCache` policies.
- **Media Loading & Dependency Injection (TCA):** 
    - **Client Mandate:** Abstract all media fetching via a **`MediaClient`** dependency in TCA.
    - **Testability:** Provide a **`testValue`** implementation for deterministic, 100% offline snapshot testing.
- **Cache Refresh:** Use URL Fingerprinting (e.g., `?v=1708250000`) to force instant refreshes.
- **Storage Hygiene:** Perform a **delete-then-upload** sequence when updating media to avoid orphaned blobs.

### 4.3 Iconography & Visual Language
- **iOS Implementation:** Use **SF Symbols** for system icons and **Emojis** for community expression.
- **Mockups:** Represent icons and buttons using simple shapes with 1-2 letter intent identifiers (e.g., 'P' for Profile, 'JC' for Joined Communities, 'N' for Notifications, 'A' for Avatar).

### 4.4 Accessibility Standards
- **Ethos:** Yoga is for everyone; the app must be inclusive.
- **VoiceOver:** Every interactive element must have a descriptive label and hint. Use semantic order to guide users naturally through the feed.
- **Dynamic Type:** All text must scale with system font settings. Layouts must handle large sizes without breaking.
- **Touch Targets:** Minimum **44x44pt** for all buttons and interactive areas.
- **Semantic Identifiers:** Use dot-notation identifiers (`feature.{id}.element`) to support automated testing.

---

## 5. Screen & Component Behaviors

### 5.1 Login & Magic Link Flow
**Goal:** A high-frictionless, passwordless entry point for both new and returning users.
**Mockup:** `UI/Mockups/5.1_LoginScreen_v2.svg`

**Authentication Options:**
1.  **Google Sign-In**: Primary, single-tap OAuth.
2.  **Magic Link (Email)**:
    - **Validation**: Perform basic client-side validation (e.g., check for `@` and a period `.`) to prevent obvious typos before sending. Do not over-validate (avoid complex regex).
    - **Firebase Flow**: Firebase sends a secure verification link to the email.
    - **Sign-in**: Upon tapping the link (on the same device), the user is signed in.
    - **Testing Mandate**: **Manual Verification Required.** Because Magic Link relies on an out-of-band email delivery and deep-linking, it cannot be fully automated in UI tests. Developers must verify this flow manually on a physical device or simulator with a real email account.
3.  **Apple ID**: *Deferred (Phase 4)*.

**Identity & Username Strategy:**
- **Automatic Username Generation**: To avoid "Username Taken" friction, usernames are automatically generated in the `displayName#1234` format.
- **Backend Logic**: A Cloud Function triggers upon Firestore profile creation to append the random 4-digit suffix and ensure uniqueness.
- **One-Time Onboarding**:
    - **Trigger**: Detected when a user logs in for the first time (no Firestore document exists for their UID).
    - **Fields**: The user is prompted for their **Display Name** and optional **Bio**.
    - **Privacy Initialization**: Default privacy settings (`isProfilePublic: false`, `avatarPrivacy: "groups-only"`) are applied during this step.
- **Legal Acceptance**: Login/Sign-up constitutes implicit acceptance of the **Privacy Policy** and **Terms of Service**.

### 5.1.1 App Launch & Session Management (Cold Start)
- **Goal:** Provide a seamless transition from app boot to the appropriate initial screen based on authentication state.
- **Visuals:** A dedicated "Launch" state displaying the app logo and a circular loading indicator.
- **Logic:**
    1.  **Check Identity:** Query `AuthenticationClient.currentUser()` for a cached Firebase Auth session.
    2.  **Profile Synchronization:** If an identity exists, fetch the latest user profile from Firestore (`users/{uid}`).
    3.  **Routing:**
        -   **Authenticated:** If identity and profile exist, route to the **Landing Page**.
        -   **Unauthenticated:** If no identity exists, route to **Login**.
        -   **Error/Incomplete:** If identity exists but profile is missing, route to **Profile Completion** (Future Feature).
- **Testing Mandate:**
    - **UI Tests:** Must be able to bypass session persistence using the `TEST_RESET_SESSION` environment variable to ensure a clean "First Launch" state for every test case.
    - **Snapshot Tests:** Must cover the `launching` state (Splash + Loader).

### 5.2 Landing Page Shell
**Goal:** The primary application frame and global navigation.
**Mockup:** `UI/Mockups/5.2_LandingPageShell.svg`

**Visual Elements:**
- **Navigation Bar (Inside):**
    - **Top Left:** Circle 'P' (Profile leads to Profile Page).
    - **Center Top:** Search Bar (Discovery).
    - **Bottom Left:** Small, left-aligned area label. 
        - **Format:** "You're currently viewing **[Area Name]**".
        - **Adaptive Strategy:** If the area name is too long, omit the "You're currently viewing" prefix and display only the **bolded area name**.
    - **Top Right 1:** Square 'JC' (Joined Communities page).
    - **Top Right 2:** Square 'N' (Notifications Bell).
- **Post Entry (Outside/Above Feed):** 
    - Full-width bar: "What's on your mind?"
    - **Icon:** SF Symbol `square.and.pencil` (SP) on the right side of the bar.
- **Content Area:** 
    - Hosts the **Community Feed** box (See 5.3).

### 5.3 Community Feed & Post Card
**Goal:** A unified chronological stream of local and community updates.
**Mockup:** `UI/Mockups/5.3_CommunityFeedPost.svg`

**Logic & Rules:**
1.  **Unified Feed:** Mixed chronological stream of posts from "Joined Communities" and the "Selected Area".
2.  **Area Switching:** Changing the area in the Search Bar updates the navigation label and the feed content.
3.  **Feed List Behavior:**
    - **Pagination:** TBD.
    - **Refresh Logic:** TBD.
4.  **Empty Feed Handling (TBD):** Logic for expanding discovery to neighboring areas if the local feed is sparse.

**Developer Notes (TCA):**
- **FeedReducer Side-effects:** Upon receiving a successful page fetch of posts, the reducer should immediately trigger a `fetchUserLikes(postIds:)` action. This batched query populates the user's specific "liked" state for the visible cards.
- **Like Action:** Use a **Firestore Transaction** to atomically increment the `likeCount` on the Post document while creating the individual Like document in the sub-collection.

**Visual Elements (Post Card):**
- **Header:**
    - Circle 'A' (Author Avatar).
    - Bold text: `username#1234`.
    - Small text: Relative timestamp (e.g., "2h ago").
    - Right-aligned Tag: `[Source Name]`.
- **Body:** Markdown rendered text.
- **Footer:**
    - Left: Square 'L' (Like Button) + Count.
    - Center: Square 'C' (Comment Button) + Count.
    - Right: Square 'S' (Share Button).

### 5.3.1 Privacy Fallback & Stale Metadata Handling
**Goal:** Handle inconsistencies between denormalized post metadata and live user privacy settings gracefully.

1.  **Image Fallback (403 Forbidden):**
    - **Scenario:** A user made a post when they were `public`, but has since gone `private`.
    - **Mechanism:** If the `MediaClient` or image loading component receives a **403 Forbidden** error from Cloud Storage, it must catch this error.
    - **Result:** Instead of showing a broken image or a "failed to load" state, display the **"Community-Only" Placeholder** avatar.
2.  **Navigation Guard (Permission Denied):**
    - **Scenario:** A user taps an author's name/avatar on an old post where the metadata says they are `public`, but they are now `private`.
    - **Mechanism:** The `FirestoreClient` will return a **Permission Denied** error when attempting to fetch the profile.
    - **Result:**
        - Do not navigate to the Profile Page.
        - Display a brief, user-friendly **Toast or Alert** saying: "This profile is now private."
3.  **Avatar Metadata Logic:**
    - If `avatarPrivacy` is `groups-only`, the client should display the **"Community-Only" Placeholder** immediately without attempting to fetch the binary (unless the client already knows they share a community, which is TBD).

### 5.4 Localization
**Goal:** Ensure the platform can be translated and culturally adapted.
- **Source of Truth:** Locale-based JSON files stored in `Resources/Localization/{locale}/strings.json`.
- **Initial Languages:** English (en), German (de), French (fr), Italian (it), Portuguese (pt), Spanish (es), Hungarian (hu).
- **Shared Strategy:** A single source of truth for both iOS and React, synchronized via script during the build process.
- [ ] **To-Do (remember):** Identify the primary **Regions** for initial launch to inform currency and date formatting.

### 5.5 Issue Reporting & Support
**Goal:** Provide a zero-maintenance way for users to report bugs or content issues.
- **Mechanism:** External **Google Form**.
- **Unified Flow:** Both authenticated and unauthenticated users use the same form.
- **Pre-filling Logic:** If the user is logged in, the app must append the `userId` to the Google Form URL as a pre-filled parameter (e.g., `?entry.12345=user_uid`).
- **Field Requirements:** The form must collect: Issue Category, Description, and the (Automated) User ID.

### 5.6 Security & Access Control
- **Canonical Source:** All data privacy and access control logic is defined in **[@ARCHITECTURE.md](./ARCHITECTURE.md)**.
- [ ] **To-Do (remember):** Conduct initial Security Review and Penetration Testing of Firestore and Storage rules.
- [ ] **To-Do (remember):** Implement TDD suites specifically for "Permission Denied" scenarios across all Firestore collections.
- [x] **Technical Implementation:** "Community Overlap" logic implemented in `firestore.rules`. Verified via `test-rules.js`.
- [ ] **To-Do (remember):** Conduct a "Scaling Audit" once the platform reaches significant scale (>100k users) to evaluate the cost/performance impact of the `get()` calls in Firestore rules and implement the optimization strategy defined in **@ARCHITECTURE.md**.

**Mandatory Security Test Cases (TDD):**
1.  **Scenario: Public Avatar**
    - User A (Privacy: `public`)
    - User B (Any status)
    - **Result:** User B can successfully read User A's `profilePictureUrl`.
2.  **Scenario: Community Member Access**
    - User A (Privacy: `groups-only`, Joined: `[area_askew]`)
    - User B (Joined: `[area_askew]`)
    - **Result:** User B can successfully read User A's `profilePictureUrl` due to community overlap.
3.  **Scenario: Unauthorized Access (No Overlap)**
    - User A (Privacy: `groups-only`, Joined: `[area_askew]`)
    - User B (Joined: `[area_chelsea]`)
    - **Result:** Firestore must return **Permission Denied** for User B attempting to read User A's profile.
4.  **Scenario: Unauthenticated Access**
    - Requester (Not logged in)
    - **Result:** **Permission Denied** for any profile read.
