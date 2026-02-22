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
  "isTeacher": false,
  "profilePictureUrl": "https://storage.googleapis.com/.../profile_small.jpg",
  "privacySettings": {
    "isProfilePublic": true,
    "showJoinedGroups": "connections_only"
  },
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
| `isTeacher` | `Boolean` | Flag identifying teacher accounts. | No |
| `privacySettings` | `Map` | User's granular privacy toggles. | No |
| `createdAt` | `Timestamp` | ISO 8601 creation date. | No |

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
    "thumbnailUrl": "https://storage.googleapis.com/.../thumb.jpg"
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
| `author` | `Map` | Denormalized author info (ID, username, avatar) for fast rendering. | No |
| `content` | `Markdown`| Standard Markdown text (Max 500 chars). | No |
| `source` | `Map` | Origin: type (`area`|`community`) and name. | No |
| `stats` | `Map` | Denormalized counts for likes and comments. | No |
| `createdAt` | `Timestamp`| Chronological sort key. | No |

---

## 4. Technical Implementation Details

### 4.1 Image Handling (Avatars & Studio Media)
- **Downsampling:** All images are processed **on-device** before upload to Cloud Storage using native iOS `UIImage` or `ImageRenderer`.
- **Target Resolutions:**
    - **Thumbnail:** 150x150 pixels (Square crop, 0.7 JPEG). Used for lists and small avatars.
    - **Standard:** Max 1024x1024 pixels (Aspect-fit, 0.7 JPEG). Used for profile headers and full media views.
- **Upload Strategy:**
    - Use **Firebase Storage SDK** for uploads.
    - File naming convention: `images/{feature}/{uid}_{version}.jpg` (e.g., `avatars/123_thumb.jpg`).
- **Data Integrity:** Store both `thumbnailUrl` and `standardUrl` in the corresponding Firestore document.

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

### 5.1 Login & Registration Screen
**Goal:** Unified entry for Google Sign-In and Email/Password.
**Mockup:** `Apps/iOS/InspiredYogaPlatform/UI/Mockups/5.1_LoginRegistrationScreen.svg`

**Logic & Rules:**
1.  **Direct Transition:** After successful authentication, the user is transitioned directly to the **Landing Page**.
2.  **Username Logic (Backend):** Usernames follow the `name#1234` format. Suffix automatically appended by backend.
3.  **Legal Links:** Links to placeholder Terms and Privacy URLs at bottom.
4.  **Implicit Acceptance:** Include text: "By logging in or creating an account, you accept our **Privacy Policy** and **Terms & Conditions**."
5.  **Report an Issue:** A "Report an Issue" button opens the external Support Google Form (See 5.5).

### 5.2 Landing Page Shell
**Goal:** The primary application frame and global navigation.
**Mockup:** `Apps/iOS/InspiredYogaPlatform/UI/Mockups/5.2_LandingPageShell.svg`

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
**Mockup:** `Apps/iOS/InspiredYogaPlatform/UI/Mockups/5.3_CommunityFeedPost.svg`

**Logic & Rules:**
1.  **Unified Feed:** Mixed chronological stream of posts from "Joined Communities" and the "Selected Area".
2.  **Area Switching:** Changing the area in the Search Bar updates the navigation label and the feed content.
3.  **Empty Feed Handling (TBD):** Logic for expanding discovery to neighboring areas if the local feed is sparse.
4.  - [ ] **To-Do (remember):** Define the exact data schema for Posts, Comments, and Likes.
5.  - [ ] **To-Do (remember):** Define #mentions and hashtags behavior (tapping to search, rendering styles, and indexing).

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

### 5.4 Localization
**Goal:** Ensure the platform can be translated and culturally adapted.
- **Source of Truth:** Locale-based JSON files stored in `Resources/Localization/{locale}/strings.json`.
- **Shared Strategy:** A single source of truth for both iOS and React, synchronized via script during the build process.
- [ ] **To-Do (remember):** Define initial set of supported Languages and Regions.

### 5.5 Issue Reporting & Support
**Goal:** Provide a zero-maintenance way for users to report bugs or content issues.
- **Mechanism:** External **Google Form**.
- **Unified Flow:** Both authenticated and unauthenticated users use the same form.
- **Pre-filling Logic:** If the user is logged in, the app must append the `userId` to the Google Form URL as a pre-filled parameter (e.g., `?entry.12345=user_uid`).
- **Field Requirements:** The form must collect: Issue Category, Description, and the (Automated) User ID.
