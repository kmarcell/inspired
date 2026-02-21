# FEATURES.md - Inspired Feature & Data Specification

This file serves as the canonical source for all feature requirements, UI components, screen behaviors, and NoSQL data schemas for the "Inspired" yoga platform.

---

## 1. Feature Index
*Index of all features currently planned or in development.*

1.  **User Authentication & Onboarding** (Status: Planned - Google & Email/Password. *Login with Apple deferred.*)
2.  **User Profiles** (TBD)
3.  **Teacher Finder & Studio Discovery** (TBD)
4.  **Yoga Studio Profiles** (TBD)
5.  **Groups & Community** (TBD)
6.  **Real-time Chat** (TBD)
7.  **Class Scheduling & Booking** (TBD)

---

## 2. NoSQL Data Schemas (JSON Specification)

This section documents the precise data contracts between the iOS application and Cloud Firestore.

### 2.1 User Profile Schema
*Collection: `/users/{userId}`*

**JSON Example:**
```json
{
  "id": "user_abc_123",
  "username": "yoga_explorer",
  "displayName": "Jane Doe",
  "bio": "Yoga enthusiast based in London.",
  "areaCode": "SW1A",
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
| `username` | `String` | Unique public handle (camelCase). | No |
| `displayName` | `String` | User's full name (Optional). | **Yes** |
| `bio` | `String` | Short biography (Max 280 chars). | No |
| `areaCode` | `String` | Area-level location (Postcode prefix). | No |
| `isTeacher` | `Boolean` | Flag identifying teacher accounts. | No |
| `privacySettings` | `Map` | User's granular privacy toggles. | No |
| `createdAt` | `Timestamp` | ISO 8601 creation date. | No |

---

### 2.2 Yoga Studio Profile Schema
*Collection: `/studios/{studioId}`*

**JSON Example:**
```json
{
  "id": "studio_xyz_456",
  "name": "Hyde Park Yoga Sanctuary",
  "address": "123 Hyde Park St, London W2 2UH",
  "about": "A peaceful oasis in the heart of London.",
  "rating": 4.8,
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
| `address` | `String` | Public business address. | No |
| `about` | `Markdown` | Formatted studio description (Max 500 chars). | No |
| `rating` | `Number` | Average user rating (0-5.0). | No |
| `location` | `Geopoint` | Exact coordinates for business location. | No |

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
- **Data Integrity:** Store both `thumbnailUrl` and `standardUrl` in the corresponding Firestore document (e.g., in the User Profile).

### 4.2 Cache Policy & Asset Hygiene
- **Caching Mechanism:** Use native SwiftUI **AsyncImage** or a **URLSession** wrapper with standard `URLCache` policies. This ensures that images are cached locally on the device for performance.
- **Media Loading & Dependency Injection (TCA):** 
    - **Client Mandate:** Abstract all media fetching (avatars, studio pictures) via a **`MediaClient`** dependency in TCA.
    - **Dependency Injection:** Inject `MediaClient` into all features that display remote images.
    - **Testability:** Provide a **`testValue`** implementation for `MediaClient` that returns local bundled assets. This ensures that **Snapshot Tests** are deterministic, performant, and 100% offline. 
    - **Caching:** The "Live" implementation must utilize `URLSession` with its default or custom `URLCache` policies.
- **Cache Refresh:** When an image URL is retrieved from Firestore, it should include a versioned suffix (e.g., `?v=1708250000`) to force an instant refresh if the image has changed.
- **Storage Hygiene:** 
    - When updating an avatar or studio media, the TCA Client must perform a **delete-then-upload** sequence (or use a Cloud Function) to ensure that the old image blobs are purged.
    - Never leave orphaned thumbnails or standard images in Cloud Storage after a replacement.

---

## 5. Screen & Component Behaviors
