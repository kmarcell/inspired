# ARCHITECTURE.md - System Architecture & Service Specification

This document provides a technical deep-dive into the "Inspired" yoga platform's backend architecture for system architect review.

---

## 1. System Overview & Data Flow
The system utilizes a serverless, event-driven architecture powered by the Google Cloud Platform (GCP) and the Firebase suite.

```mermaid
graph TD
    User([User / iOS App]) -->|TCA Clients| Auth[Firebase Auth]
    User -->|TCA Clients| Firestore[Cloud Firestore]
    User -->|TCA Clients| Storage[Cloud Storage]
    
    Auth -->|onDelete Event| Functions[Cloud Functions]
    Firestore -->|onCreate/onUpdate Event| Functions
    
    Functions -->|Triggers| FCM[Firebase Cloud Messaging]
    Functions -->|Data Scrubbing| Firestore
    Functions -->|Data Scrubbing| Storage
    
    Firestore -->|Query| Places[Google Places API]
    User -->|Discovery| Places
```

---

## 2. Service Specifications

### 2.1 Firebase Authentication (Auth)
*   **Purpose:** Identity management for Teachers and Students.
*   **Capabilities:** OAuth 2.0 (Google, Apple), Email/Password.
*   **Status:** "Login with Apple" is **deferred** (requires paid Apple Developer membership).
*   **Testing:** Rely on local USB debugging and "Personal Team" provisioning for on-device verification.
*   **Caveats:** 
    *   **Custom Claims:** Limited to 1KB. Used sparingly for `isTeacher` flags.
    *   **Rate Limits:** High, but Google/Apple login flows have external provider quotas.
*   **Documentation:** [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

### 2.2 Cloud Firestore (NoSQL)
*   **Purpose:** Core database for profiles, groups, and real-time chat.
*   **Architecture:** Document-Collection model.
*   **Inter-service Comm:** Triggers Cloud Functions for server-side moderation or notifications.
*   **Limitations:**
    *   **Document Size:** Max 1 MiB per document.
    *   **Write Frequency:** ~1 write/sec per document (can be scaled via sharding if needed for massive groups).
    *   **Complexity:** No built-in `JOIN` support; relationships are managed via sub-collections or redundant denormalized data.
*   **Documentation:** [Cloud Firestore Quotas](https://firebase.google.com/docs/firestore/quotas)

### 2.3 Cloud Storage for Firebase
*   **Purpose:** Blob storage for profile pictures and media.
*   **Capabilities:** Public/Private access controlled by Storage Rules.
*   **Content Delivery (CDN):**
    *   **Mandate:** Serve all public assets (avatars, studio media) via the **Firebase Hosting CDN**.
    *   **Mechanism:** Map the Storage bucket to a Firebase Hosting path (e.g., `https://inspired-yoga.web.app/avatars/...`).
    *   **Cache Consistency:** Use **URL Fingerprinting** (e.g., `avatar.jpg?v=[timestamp]`) to instantly bypass CDN and browser/app caches when an image is updated. This ensures global consistency across all edge locations.
    *   **Storage Cleanup:** When an image is replaced, the **Firebase Storage SDK** (Client-side) or a **Cloud Function** (Server-side) must explicitly delete the previous thumbnail and standard resolution blobs to minimize storage costs.
*   **Multi-Resolution Strategy:**
    *   **Thumbnail:** 150x150 pixels (optimized for lists/avatars).
    *   **Standard:** 1024x1024 pixels (optimized for profile pages).
*   **Inter-service Comm:** Serves content to iOS app.
*   **Caveats:**
    *   **Bandwidth:** Egress costs are minimized by using thumbnails for list views.
    *   **Processing:** Local iOS-native downsampling (0.7 JPEG compression) is mandatory before upload.
*   **Documentation:** [Cloud Storage Documentation](https://firebase.google.com/docs/storage)

### 2.4 iOS Content Caching Strategy
*   **Mechanism:** Use **Native `URLCache`** and `URLSession` configuration.
*   **Server Alignment:** Configure `StorageMetadata` (e.g., `Cache-Control: public, max-age=3600`) via the Firebase SDK during upload.
*   **Performance:** This ensures that images are stored in the local on-disk cache of the iPhone, reducing repeat network requests for the same session.

### 2.5 Cloud Functions (Node.js / Python)
*   **Purpose:** Server-side logic, moderation workflows, and PII scrubbing.
*   **Limitations:**
    *   **Cold Starts:** Initial latency for infrequently used functions (minimized by keeping functions "warm" or using small footprints).
    - **Execution Time:** Max 9 minutes per execution.
*   **Documentation:** [Cloud Functions Documentation](https://firebase.google.com/docs/functions)

---

## 3. Usage & Throughput Estimates (Abstract Level)

Based on a starting community of 10,000 active users:

| Metric | Estimated Value | Rationale |
| :--- | :--- | :--- |
| **Reads (Firestore)** | 500k - 1M / Day | Heavy browse/feed discovery usage. |
| **Writes (Firestore)** | 100k - 200k / Day | Profile updates, group messages, and posts. |
| **Throughput (FCM)** | ~50k / Day | Real-time notifications for chat/groups. |
| **Data Growth** | ~1-5 GB / Month | Primarily user-generated content (images) after downsampling. |
| **Places API** | ~5,000 requests / Month | Discovery-based studio searches. |

---

## 4. Cost Estimation & Budget Alignment ($50/Month Cap)

Based on the 10,000-user usage model on the **Firebase Blaze (Pay-as-you-go)** plan, but benefiting from the **Free Spark Tier** quotas:

| Service | Estimated Usage | Projected Monthly Cost | Rationale |
| :--- | :--- | :--- | :--- |
| **Cloud Firestore** | 30M Reads / 6M Writes | **$10 - $15** | Spark Tier covers 1.5M reads/600k writes/month. Excess is priced at $0.06 - $0.18 per 100k. |
| **Cloud Storage / CDN** | 50 GB Stored / 10 GB Egress | **$2 - $5** | Spark Tier covers 5GB Storage/10GB Hosting Transfer. CDN caching via Firebase Hosting significantly reduces repeated egress costs. |
| **Cloud Functions** | 200k Executions | **$0 - $2** | Spark Tier covers 125k. Excess cost is negligible for small functions. |
| **Firebase Auth** | 10k Active Users | **$0** | No cost for standard OAuth/Email providers. |
| **FCM** | 1.5M Notifications | **$0** | Free and unlimited. |
| **Google Places API** | 5,000 Autocomplete/Detail | **$10 - $20** | This is the highest variable cost. Usage must be strictly controlled (e.g., caching/fuzzing). |
| **TOTAL ESTIMATE** | **-** | **$22 - $42** | **Fits within $50/month cap.** |

**Budget Mitigation Strategy:**
*   **Alerting:** Set budget alerts at $25 (50%) and $40 (80%) in GCP Console.
*   **Throttling:** If costs approach $50, the `scripts/fetch-config.sh` or Cloud Functions can be set to "Read-Only" mode to prevent further billable writes.

---

## 5. Architect's Review & Validation

**Critical Validation Points:**
1.  **Denormalization Strategy:** Ensure Firestore schemas balance read performance with the risk of stale data.
2.  **Concurrency:** Monitor the 1 write/sec Firestore limit for high-frequency group chats. Consider "Chat Sub-collections" or Real-time Database for high-scale rooms.
3.  **Privacy:** Verify Firestore Security Rules against the "Least Privilege" mandate in `GEMINI.md`.

---

*Note: This documentation is maintained alongside the [FEATURES.md](./FEATURES.md) and [GEMINI.md](./GEMINI.md) files.*
