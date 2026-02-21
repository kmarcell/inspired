# GEMINI.md - Inspired Project Mandates

## Project Vision
**Inspired Yoga Platform** is a free-to-use yoga class platform designed to connect teachers and students. It features location-based services, group management, teacher discovery, user profiles, and community engagement tools.

## Backend & Data Architecture
- **Canonical Specification:** Detailed service descriptions, inter-service communication, throughput estimates, and system limitations are documented in **[@ARCHITECTURE.md](./ARCHITECTURE.md)**. This file must be reviewed and validated by a system architect.
- **Maintenance Mandate:** **@ARCHITECTURE.md** must be updated and maintained in synchronization with **@FEATURES.md** and **@GEMINI.md** as new features are added or system behavior changes.
- **Service Provider:** Google Cloud Platform via **Firebase iOS SDK**.
- **Tooling Strategy:** Use the **Firebase CLI** as the primary tool for all infrastructure, deployment, and environment management. The full **Google Cloud SDK (gcloud)** will be evaluated and installed only if strictly required for advanced IAM configurations or specific Terraform provider dependencies.
- **Authentication:** Firebase Auth (supporting Google, Apple, and Email/Password).
    - **Note:** "Login with Apple" is **deferred** until a paid Apple Developer account is available. Initial development will focus on Google Login and Email/Password.
- **Database:** **Cloud Firestore (NoSQL)**. 
    - **Rationale:** Chosen for superior cost efficiency (generous free tier), built-in real-time listeners for chat/posts, and schema flexibility during rapid development.
    - **Moderated Content:** Store studio profile comments and posts in Firestore with a `status` field (e.g., `pending`, `approved`, `rejected`).
    - **Moderation Workflow:** Use Firestore Security Rules and Cloud Functions to enforce studio-owner approval before content becomes public. 
    - **Automated Moderation:** Utilize **Firebase Extensions** (e.g., "Moderate Content with Perspective API") for initial automated filtering where appropriate.
    - **Rich Text & Markdown:** Store comments and posts as standard **Markdown** text. 
        - **Limit:** Enforce a maximum of **500 characters** per entry to ensure performance and readability.
        - **Rendering:** Use native SwiftUI `Text` or `AttributedString` Markdown support for rendering.
    - **Group Chat:** Implement real-time group chat using **Cloud Firestore** (message sub-collections) and **Firebase Cloud Messaging (FCM)** for push notifications.
        - **Real-time:** Use Firestore snapshots for instant message delivery within the app.
        - **Consistency:** Apply the same Markdown and 500-character limits as comments/posts.
- **Storage:** Cloud Storage for Firebase for user-generated content (e.g., profile pictures).
- **Image Processing & Multi-Resolution Mandate:**
    - **Local Processing:** Perform all image downsampling and compression **locally on the device** before uploading.
    - **Standard Resolutions:**
        - **Thumbnail:** 150x150 pixels (Square crop, JPEG, ~0.7 compression).
        - **Standard:** Max 1024x1024 pixels (Aspect-fit, JPEG, ~0.7 compression).
    - **Storage Strategy:** Store both versions in Cloud Storage (e.g., `avatars/{uid}_thumb.jpg` and `avatars/{uid}_std.jpg`) to optimize list views and profile pages.
    - **Cache Invalidation:** Use **URL Fingerprinting** (e.g., query-string timestamps) to force instant CDN and client-side cache refreshes upon image updates.
    - **Storage Hygiene:** Ensure old blobs (thumbnails and standard versions) are deleted from Cloud Storage when a user replaces their media to maintain a clean environment and control costs.
    - **Implementation:** Use native iOS `ImageRenderer` or `UIImage` resizing capabilities. Use the **Firebase Storage SDK** for all upload operations.
- **Image Processing:** Perform image downsampling and compression **locally on the device** before uploading to minimize bandwidth and storage costs.
- **Studio Data:** Use **Google Places API** for discovery. Seed the database with manual entries or specific area-based discoveries to stay within free tier limits during early phases.
- **Security & Integrity:**
    - **Rate Limiting:** Implement logic-based rate limiting in Cloud Functions and client-side throttles to prevent DDoS/Brute-force attacks and control costs.
    - **Firestore Security Rules:** Enforce strict "Least Privilege" access. No collection-wide reads; queries must be scoped to specific IDs or approved filters.
    - **Location Privacy:** 
        - **Users:** Store only area-level data (e.g., postcode prefix or district). **Never store exact GPS coordinates for individual users.**
        - **Studios:** Store publicly available business addresses.
        - **Discovery:** Use Location Fuzzing for proximity searches to protect user/teacher privacy until a booking is confirmed.
- **Compliance & Data Residency:**
    - **GDPR & UK-GDPR:** Adhere strictly to EU and UK data protection standards. 
    - **Residency:** Prioritize European Google Cloud regions (e.g., `europe-west`) for data storage to align with EU/UK compliance.
    - **User Rights:** Implement and support mechanisms for Data Access, Rectification, Portability, and the "Right to be Forgotten" (Hard Delete).
    - **Future-proofing:** Design for future compliance with CCPA (US) and PIPL (Asia) as the platform scales.
- **Logic:** Use Firebase Cloud Functions for server-side logic (e.g., complex group management or future payment processing).

## Infrastructure & Cost Management
- **Cost Controls:**
    - **Monthly Budget:** Maintain a hard cost cap of **$50/month**.
    - **Alerting:** Configure GCP/Firebase budget alerts at 50%, 75%, and 90% of the threshold.
    - **Automated Mitigation:** Notify administrators immediately and consider programmatic disabling of high-cost services if the $50 threshold is approached.
- **Monitoring & Observability:**
    - **Usage Tracking:** Use Google Cloud Monitoring to track API usage and resource consumption across Firestore, Storage, and Cloud Functions.
    - **Performance Auditing:** Regularly audit Firestore query efficiency to minimize unnecessary read/write operations and costs.

## Infrastructure as Code (IaC) & Deployment
- **Mandate:** All backend infrastructure (Firestore indexes, Storage buckets, Cloud Functions, IAM roles) must be defined and deployed via **Infrastructure as Code** (e.g., Terraform or Firebase CLI Config) to ensure versioning, reproducibility, and rollback capabilities.
- **Validation & Correctness:**
    - **Syntax Check:** Always run `terraform validate` (or `firebase deploy --only firestore:indexes --dry-run` where applicable) before any deployment.
    - **Logical Check:** Review the `terraform plan` output to ensure only intended resources are modified/deleted.
- **Rollback Strategy:**
    - **Versioned Config:** All IaC configurations must be committed to Git. To revert a failed deployment, check out the previous known good state and re-deploy.
    - **State Management:** Use remote state with locking (e.g., GCS bucket) for Terraform to prevent concurrent modification and ensure a consistent source of truth.
- **Environment Strategy:**
    - **Multi-Project Setup:** Maintain two separate Firebase/GCP projects: `inspired-staging` and `inspired-prod`.
    - **Deployment Flow:** All changes must be deployed and verified in **Staging** before being promoted to **Production**.
    - **Environment Switching:** Use the Firebase CLI (`firebase use staging` / `firebase use prod`) to manage environment-specific deployments.
- **Scripts & Maintenance:**
    - **Deployment:** Maintain a `scripts/deploy.sh [environment]` script to handle the full IaC deployment pipeline.
    - **Teardown:** Maintain a `scripts/teardown.sh [environment]` script to safely remove all resources from a specific environment (e.g., wiping Staging for a clean re-test).
- **iOS Automation (Fastlane):**
    - **Mandate:** Use **Fastlane** for all iOS CI/CD tasks including running tests, managing code signing (`match`), and uploading to TestFlight (`pilot`).
    - **Lanes:** Maintain lanes for `test`, `build_staging`, and `deploy_prod`.
    - **Firebase Integration:** Use Fastlane plugins to automate IPA uploads to Firebase App Distribution for staging.
- **Test User Management (Staging):**
    - **Google Login in Staging:** 
        - Use real, dedicated Google test accounts (e.g., `inspired.test.user1@gmail.com`) for manual staging tests. 
        - For automated testing, use the **Firebase Auth Emulator** to simulate Google login without real accounts.
    - **Identity Protection (No Git):** 
        - **Mandate:** Never commit real or test user emails, UIDs, or credentials to the git repository.
        - **Local Config:** Store staging user lists or test credentials in a `.env` or `scripts/local-config.json` file (listed in `.gitignore`).
        - **Console Management:** Manage the canonical list of authorized staging testers via the **Firebase Console** (Auth > Users).
- **Data Isolation:** Staging data and users must never be mixed with Production.
- **Database Migrations:**
    - **Development Phase:** Data loss is acceptable. Schema changes (renaming, merging, or dropping fields) may involve wiping the database and re-seeding to maintain velocity.
    - **Production Phase:** Zero data loss. Once live, any structural changes must be performed via **versioned migration scripts** (using Cloud Functions or administrative CLI tools) to transform existing NoSQL documents.
    - **Indexes:** Manage all Firestore composite indexes via the Firebase CLI as part of the IaC mandate.

## Architecture: TCA Integration
- **Dependency Pattern:** All backend services must be abstracted into **TCA Clients** (e.g., `AuthenticationClient`, `FirestoreClient`, `MediaClient`).
- **Media Loading:** **Never** use `AsyncImage` directly with real URLs in core features. All image fetching, processing, and caching must be abstracted via a `MediaClient` to support deterministic testing.
- **Interfaces:** Define clients with `async/await` interfaces.
- **Testing:** Provide "live" and "test" (mock) implementations for every client to support TDD and Snapshot testing without network dependencies.

## Coding Standards & Style
- **Formatting:** Use Xcode's built-in `swift-format` (4 spaces indentation, 120 character line limit enforced by `swift-format`).
- **Naming:** 
    - `camelCase` for variables and functions.
    - `PascalCase` for classes, structs, and enums.
    - Follow TCA naming conventions and standard Swift API Design Guidelines.
- **Concurrency:** Prefer `async/await` over Combine and GCD for all asynchronous operations.
- **Documentation:** Do not add documentation to code unless explicitly requested, **except for PII data** (see Security).
- **Engineering Principles:**
    - Adhere to **SOLID** and **DRY** principles.
    - Keep methods short and focused on a single task.
    - Prefer polymorphism or multiple function overloads instead of `Boolean` or `Enum` input parameters.
    - **No force unwrapping.** Use `guard` statements for early exits.
    - **Error Handling:** Prefer throwing exceptions over returning `Boolean` for success. Avoid `try?`; bubble up errors to the appropriate handling level to avoid silent failures.
    - Organize files into folders based on functionality.

## Testing Strategy
- **Methodology:** Test-Driven Development (TDD). 
    - 1. Write a test for intended behavior.
    - 2. Confirm the test fails.
    - 3. Implement minimal code to pass the test.
- **Unit Tests (Swift Testing):**
    - **Scope:** Target public interfaces and functions. Avoid testing internal/private logic.
    - **Scenarios:** Cover all requirement-driven scenarios and input variants.
    - **Edge Cases:**
        - `Int`: Test negative, zero, positive, and index-out-of-range. Test large numbers for performance/overflow but keep test execution time reasonable (avoid huge loops).
        - `String`: Test empty strings and special characters.
        - `Array`: Test empty, single-item, and multi-item collections.
- **Snapshot Tests (SnapshotTesting):**
    - **Framework:** Use the **Point-Free SnapshotTesting** framework.
    - **Method:** Snapshots must be generated using **Swift code** to programmatically capture UI states.
    - **Scope:** Test entire screens in various configurations.
    - **States:** Generate snapshots for **Empty**, **Minimal Data**, and **Full Data** (all optionals populated) scenarios.
    - **Stress Testing:** Use exceptionally long strings to verify `SwiftUI.Text` behavior (truncation, multi-line wrapping, and layout integrity).
    - **Storage (Git LFS):** All generated reference images (`.png`) must be tracked using **Git LFS** to keep the repository size manageable. Ensure `**/__Snapshots__/*.png` is configured in `.gitattributes`.
- **UI Tests:**
    - **Source of Truth:** Scenarios are defined in the `UserFlows.md` file.
    - **Scope:** Generate UI tests *only* for the flows and scenarios explicitly documented in `UserFlows.md`.

## Security & Privacy (High Priority)
- **Data Protection:** Security takes precedence over UX and performance. No data is shared without explicit user approval.
- **Data Lifecycle (Hard Delete):**
    - Users must have the "Right to be Forgotten." 
    - Upon account deletion, an automated **Data Scrubbing** process (Cloud Function) must purge all associated PII from Auth, Firestore, and Storage.
- **Deferred Choice & Reversibility:**
    - No unsolicited system pop-ups (e.g., location sharing, push notifications). All such requests must be initiated by the user or deferred for later.
    - All user privacy decisions and information sharing must be fully reversible and granularly controllable from the app's settings at any time (e.g., toggling profile visibility from public to private).
- **PII (Personally Identifiable Information):** 
    - Properties holding PII must be explicitly marked in the code.
    - Documentation is **required** for any property holding PII data.
- **Networking:** Do not implement network calls or API logic until specifically instructed. If a requirement implies API usage, state the intent and ask for permission first.
- **Environment Configuration:**
    - **No-Commit Mandate:** **Never** commit `GoogleService-Info.plist` to the repository.
    - **Automated Fetching:** Use the Firebase CLI (`firebase apps:sdkconfig`) to fetch environment-specific configurations during the setup or pre-build phase.
    - **Isolation:** Each build configuration (Staging/Prod) must point to its respective fetched configuration file.
    - **Development Access:** Use local USB deployment for testing on physical devices (Free Tier provisioning).
- **Logging:** Use `os.log` only. 
    - No debug logs unless requested.
    - All API calls, identifiers, and user data in logs **must be obfuscated**.

## Feature & Data Documentation
- **Canonical Source:** All feature requirements, UI components, screen behaviors, and navigation flows are documented in **[@FEATURES.md](./FEATURES.md)**. This file must be treated as the primary context for all feature-related tasks.
- **Data Schemas & Contracts:**
    - **NoSQL Documentation:** **@FEATURES.md** must maintain a precise specification for all Firestore documents and collections.
    - **Fields & Types:** Every field must be documented with its data type (e.g., `String`, `Timestamp`, `Geopoint`), formatting rules, and purpose.
    - **JSON Examples:** Provide representative JSON objects for key entities (e.g., User Profiles, Yoga Studio Profiles, Groups) to serve as the contract for encoding/decoding in the iOS app.
    - **Integrity:** This documentation drives the communication between the Firebase API and the TCA Clients to prevent data corruption and ensure type safety.
- **Mockup-Driven Development (The Feedback Loop):**
    - **Step 1: Mockup Generation:** For every UI component or screen described in **@FEATURES.md**, a "napkin sketch" (low-fidelity SVG or wireframe) must be generated first. These are layout-focused sketches (rectangles representing buttons, avatars, subtitles, etc.) used to validate positioning and structure.
    - **Step 2: Storage:** Mockups must be checked into the repository under `**/Mockups/` using **Git LFS**.
    - **Step 3: Implementation:** Use the mockup as the visual specification for the SwiftUI implementation.
    - **Step 4: Validation:** After implementing, generate a high-fidelity **Snapshot Test** (with native buttons, colors, etc.). Compare the snapshot's layout to the mockup's positioning/intent.
    - **Step 5: Iteration:** If the layout or logic deviates from the mockup, adjust the code, re-generate the snapshot, and repeat. Continuous maintenance of **@FEATURES.md** and its data sections is required as features evolve.

## Development Workflow
- **Local-First Automation:** All CI/CD tasks (Testing, Building, and Deploying) are performed locally using **Fastlane**. This ensures 100% free execution and simplifies secret management.
- **Verification:** Follow Apple's Human Interface Guidelines (HIG) for all UI work.
- **Workflow:** Research and strategy must precede execution.
- **Finality:** Always run tests and verify behavior before considering a task complete.
