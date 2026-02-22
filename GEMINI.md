# GEMINI.md - Inspired Project Mandates

## Project Vision
**Inspired Yoga Platform** is a free-to-use yoga class platform designed to connect teachers and students. It features location-based services, group management, teacher discovery, user profiles, and community engagement tools.

## Backend & Data Architecture
- **Canonical Specification:** Detailed service descriptions, inter-service communication, throughput estimates, and system limitations are documented in **[@ARCHITECTURE.md](./ARCHITECTURE.md)**. This file must be reviewed and validated by a system architect.
- **Maintenance Mandate:** **@ARCHITECTURE.md** must be updated and maintained in synchronization with **@FEATURES.md** and **@GEMINI.md** as new features are added or system behavior changes.
- **Service Provider:** Google Cloud Platform via **Firebase iOS SDK**.
- **Tooling Strategy:** Use the **Firebase CLI** as the primary tool. 
    - **Prerequisites:** **Java Runtime** (for Emulators), **Node.js** (for Seeding/Testing), **XcodeGen**, and **Fastlane**.
- **Security Rules Synchronization:** All data privacy and access control logic must be defined in **@ARCHITECTURE.md**. The automated rules test suite (`infrastructure/scripts/test-rules.js`) must be kept in perfect synchronization with these architectural mandates.
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
- **Studio Data & Shadow Profiles:** 
    - **Backend Seeding:** Use **Google Places API** via Cloud Functions to discover and "seed" yoga studios into Firestore as **Shadow Profiles**.
    - **iOS Client:** The app fetches studio data exclusively from Firestore. Direct client-side calls to the Google Places API are forbidden to minimize costs and exposure.
    - **Discovery:** Proximity searches are performed against indexed Firestore data using location fuzzing.
- **Security & Integrity:**
    - **Secret Management:** 
        - **Backend-Only Keys:** Sensitive keys like the Google Places API Key must live exclusively in Cloud Functions environment variables (IaC managed).
        - **Frontend Keys:** Minimize or eliminate third-party API keys in the iOS binary. Configuration is fetched via `GoogleService-Info.plist` at build time.
    - **Location Privacy:** 
        - **Users:** Store only area-level data (e.g., postcode prefix or district). **Never store exact GPS coordinates for individual users.**
        - **Studios:** Store publicly available business addresses.
        - **Discovery:** Use Location Fuzzing for proximity searches to protect user/teacher privacy until a booking is confirmed.
- **Compliance & Data Residency:**
    - **GDPR & UK-GDPR:** Adhere strictly to EU and UK data protection standards. 
    - **Regional Mandate:** All backend services (Firestore, Cloud Storage, Cloud Functions) must be deployed to the **`europe-west1` (Belgium)** region. This ensures data residency within the EU, minimizes inter-service latency, and reduces egress costs.
    - **User Rights:** Implement mechanisms for Data Access, Rectification, and the "Right to be Forgotten".
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
- **Mandate:** All backend infrastructure (Firestore indexes, Storage buckets, Cloud Functions, IAM roles) must be defined and deployed via **Infrastructure as Code using Terraform (.tf) files directly**.
- **Rationale:** Direct HCL (HashiCorp Configuration Language) is chosen to maintain industry standard compatibility, ensure full access to GCP provider features, and simplify debugging by avoiding unnecessary abstraction layers.
- **Validation & Correctness:**
    - **Syntax Check:** Always run `terraform validate` (or `firebase deploy --only firestore:indexes --dry-run` where applicable) before any deployment.
    - **Logical Check:** Review the `terraform plan` output to ensure only intended resources are modified/deleted.
- **Rollback Strategy:**
    - **Versioned Config:** All IaC configurations must be committed to Git. To revert a failed deployment, check out the previous known good state and re-deploy.
    - **State Management:** Use remote state with locking (e.g., GCS bucket) for Terraform to prevent concurrent modification and ensure a consistent source of truth.
- **Environment Strategy:**
    - **3-Tier Setup:**
        - **Local:** Targeted at the Firebase Emulator. Uses the `Debug (Local)` configuration and `-DFIREBASE_EMULATOR` flag.
        - **Staging:** Targeted at the `inspired-yoga-app-staging` cloud project.
        - **Production:** Targeted at the `inspired-yoga-app` cloud project.
    - **Deployment Flow:** All changes must be verified in **Local** (Emulator) and **Staging** before being promoted to **Production**.
    - **Environment Switching:** Use the Firebase CLI and the `scripts/fetch-config.sh` script to manage configurations.
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
- **Localization Synchronization:** 
    - **Structure:** `Resources/Localization/{locale}/strings.json` (e.g., `/en/strings.json`, `/pt/strings.json`).
    - **Automated Sync:** Use `scripts/sync-strings.sh` to transform these JSON files into iOS `.xcstrings` and React translation files. 
    - **Automation:** This script must be automatically called as a **pre-build step** in the Fastlane `deploy` and `test` lanes to ensure string consistency.
- **Iconography:** Use **SF Symbols** and **Emojis** as the primary visual language for the iOS application.
- **Idea Tracking & Action Items:** Whenever an idea or requirement is introduced with triggers like "remember" or "take note," it must be immediately codified as a **To-Do** item in the relevant section of **@FEATURES.md**. If it is a new feature, a new section must be created. The **@ROADMAP.md** must also be updated to ensure these items are tracked to completion.

## Project Structure
- **Root:** Contains project-wide documentation (`.md` files) and cross-platform configuration.
- **Apps Path:** Frontend applications are located in `Apps/{Platform}/`.
- **Universal Frontend Mandate:** All architectural, security, privacy, and data integrity mandates defined in this document apply to **all frontend clients** (e.g., iOS, React, Web) unless explicitly noted.
- **Organization (iOS - InspiredYogaPlatform):** 
    - `Apps/iOS/InspiredYogaPlatform/Inspired/`: Core application code.
    - `Apps/iOS/InspiredYogaPlatform/InspiredTests/`: Unit and Snapshot tests.
    - `Apps/iOS/InspiredYogaPlatform/UI/`: Design system and mockups.

## Architecture: Frontend Clients
- **Dependency Pattern:** All backend services must be abstracted into platform-appropriate **Clients** (e.g., TCA Clients for iOS, Hooks/Services for React).
- **Testing Requirements:** Every frontend client must implement:
    - **TDD:** Test-driven development for all logic.
    - **Snapshot Testing:** UI validation against **@FEATURES.md** mockups.
    - **Offline Safety:** Mock implementations for all external dependencies.

## Architecture: iOS Specifics (TCA Integration)
- **Framework:** The Composable Architecture (TCA).
- **Project Management:** Use **XcodeGen** to manage the `.xcodeproj`.
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
- **Environment Distinction (Crucial):**
    - **Unit & Snapshot Tests:** Must use **in-code Swift mocks** (via TCA `.testValue`). These tests must be 100% offline and deterministic, relying zero on the Firebase Emulator or network.
    - **UI Tests:** Must run against the **Firebase Emulator**. This ensures we test the integration between the app and the backend logic (Rules, Functions) without hitting cloud quotas.
- **Unit Tests (Swift Testing):**
    - **Scope:** Target public interfaces and functions. Avoid testing internal/private logic.
    - **Security Testing:** Every TDD cycle must include **Negative Tests** to verify that "Permission Denied" scenarios are handled gracefully and that the backend properly rejects unauthorized requests.
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
    - **Semantic Identifiers:** All UI components must have descriptive `accessibilityIdentifier`s following the pattern `feature.{id}.element` (e.g., `posts.123.share`, `login.emailField`).
    - **High-Performance Mandate:** UI Tests must be designed for speed. Use NSPredicate-based expectations rather than hard `sleep()` waits. Optimize for zero-wait execution where possible.
    - **VoiceOver Feedback Loop:** 
        - **Snapshot:** UI Tests must capture the full accessibility tree (labels, values, traits) of each screen into a text file (e.g., `Accessibility/ScreenName.txt`).
        - **Analysis:** A dedicated Fastlane lane (`analyze_accessibility`) will trigger an automated review of these files using Gemini.
        - **Improvement:** Insights from this analysis must be converted into **@FEATURES.md** updates and code refinements to ensure the app embodies the inclusive ethos of the yoga community.

## Security & Privacy (High Priority)
- **Data Protection:** Security takes precedence over UX and performance. No data is shared without explicit user approval.
- **Security Audits:** Conduct periodic **Security Reviews and Penetration Testing** of Firestore and Storage rules to ensure strict adherence to the "Least Privilege" mandate.
- **Data Lifecycle (Hard Delete):**
    - Users must have the "Right to be Forgotten." 
    - Upon account deletion, an automated **Data Scrubbing** process (Cloud Function) must purge all associated PII from Auth, Firestore, and Storage.
- **Community-based Visibility:** 
    - **Connection Definition:** Two users are considered "connected" if they share at least one **Joined Community** (includes Groups or Area communities).
    - **Avatar Privacy:** Support `public` and `members-only` visibility settings. 
    - **Enforcement:** Privacy must be enforced at the database level. If a user is not authorized, the `profilePictureUrl` must not be accessible.
- **Deferred Choice & Reversibility:**
    - No unsolicited system pop-ups (e.g., location sharing, push notifications). All such requests must be initiated by the user or deferred for later.
    - All user privacy decisions and information sharing must be fully reversible and granularly controllable from the app's settings at any time (e.g., toggling profile visibility from public to private).
- **PII (Personally Identifiable Information):** 
    - Properties holding PII must be explicitly marked in the code.
    - Documentation is **required** for any property holding PII data.
- **Networking:** Do not implement network calls or API logic until specifically instructed. If a requirement implies API usage, state the intent and ask for permission first.
- **Environment Configuration:**
    - **No-Commit Mandate:** **Never** commit `GoogleService-Info.plist` or sensitive API keys to the repository.
    - **Secret Management:** 
        - **Backend-Only Keys:** Sensitive keys like the Google Places API Key must live exclusively in Cloud Functions environment variables (IaC managed).
        - **Frontend Keys:** Minimize or eliminate third-party API keys in the iOS binary. Configuration is fetched via `GoogleService-Info.plist` at build time.
    - **Automated Fetching:** Use the Firebase CLI (`firebase apps:sdkconfig`) to fetch environment-specific configurations during the setup or pre-build phase.
    - **Isolation:** Each build configuration (Staging/Prod) must point to its respective fetched configuration file.
    - **Development Access:** Use local USB deployment for testing on physical devices (Free Tier provisioning).
- **Logging:** Use `os.log` only. 
    - No debug logs unless requested.
    - All API calls, identifiers, and user data in logs **must be obfuscated**.

## Project Structure
- **Root:** Contains project-wide documentation (`.md` files), centralized design assets (`UI/Mockups/`), and cross-platform configuration.
- **Apps Path:** Frontend applications are located in `Apps/{Platform}/`.
- **Universal Frontend Mandate:** All architectural, security, privacy, and data integrity mandates defined in this document apply to **all frontend clients** (e.g., iOS, React, Web) unless explicitly noted.
- **Organization (iOS - InspiredYogaPlatform):** 
    - `Apps/iOS/InspiredYogaPlatform/Inspired/`: Core application code.
    - `Apps/iOS/InspiredYogaPlatform/InspiredTests/`: Unit and Snapshot tests.
- **Project Management (XcodeGen):**
    - **Mandate:** Use **XcodeGen** to manage the `.xcodeproj` file. 
    - **Source of Truth:** The `project.yml` file is the canonical source for targets, configurations, and dependencies.
    - **No Manual Edits:** **Never** manually edit the `.xcodeproj` or commit it to Git. 
    - **Generation:** Run `xcodegen generate` after any structural or configuration changes.
- **Organization:** 
    - `Apps/iOS/InspiredYogaPlatform/Inspired/`: Core application code.
    - `Apps/iOS/InspiredYogaPlatform/InspiredTests/`: Unit and Snapshot tests.
    - `Apps/iOS/InspiredYogaPlatform/InspiredUITests/`: UI tests (following UserFlows.md).
    - `Apps/iOS/InspiredYogaPlatform/UI/`: Design system and mockups.

## Feature & Data Documentation
- **Canonical Source:** All feature requirements, UI components, screen behaviors, and navigation flows are documented in **[@FEATURES.md](./FEATURES.md)**. This file must be treated as the primary context for all feature-related tasks.
- **Requirement Preservation Mandate:** 
    - **Never Reduce:** Existing requirements, schemas, or visual definitions in **@FEATURES.md** must never be removed or replaced with "see previous" references. All sections must remain self-contained and fully descriptive.
    - **Add & Refine:** New requirements must be added as additive refinements.
    - **Conflict Resolution:** If a new requirement conflicts with an existing one, the developer must stop and consult the user for resolution before updating the file.
- **Data Schemas & Contracts:**
    - **NoSQL Documentation:** **@FEATURES.md** must maintain a precise specification for all Firestore documents and collections.
    - **Fields & Types:** Every field must be documented with its data type (e.g., `String`, `Timestamp`, `Geopoint`), formatting rules, and purpose.
    - **JSON Examples:** Provide representative JSON objects for key entities (e.g., User Profiles, Yoga Studio Profiles, Groups) to serve as the contract for encoding/decoding in the iOS app.
    - **Integrity:** This documentation drives the communication between the Firebase API and the TCA Clients to prevent data corruption and ensure type safety.
- **Mockup-Driven Development (The Feedback Loop):**
    - **Step 1: Mockup Generation:** For every UI component or screen described in **@FEATURES.md**, a "napkin sketch" (low-fidelity SVG or wireframe) must be generated first.
    - **Synchronization Mandate:** Mockups **must** be updated synchronously whenever their corresponding feature description in **@FEATURES.md** is modified. The visual sketch and textual requirement must never drift.
    - **Visual Language:** Use primitive shapes (circles, rectangles) with one or two letters to identify the intent of icons, buttons, and images.
    - **Step 2: Storage:** Mockups must be checked into the repository under the root **`UI/Mockups/`** directory using **Git LFS**.
    - **Step 3: Implementation:** Use the mockup as the visual specification for the SwiftUI implementation.
    - **Step 4: Validation:** After implementing, generate a high-fidelity **Snapshot Test** (with native buttons, colors, etc.). Compare the snapshot's layout to the mockup's positioning/intent.
    - **Step 5: Iteration:** If the layout or logic deviates from the mockup, adjust the code, re-generate the snapshot, and repeat. Continuous maintenance of **@FEATURES.md** and its data sections is required as features evolve.

## Development Workflow
- **Roadmap Synchronization:** **@ROADMAP.md** must be updated at the conclusion of every significant task. Completed items must be ticked off, and any newly identified gaps or sub-tasks must be added to ensure the roadmap remains accurate and actionable.
- **Local-First Automation:** All CI/CD tasks are performed locally using **Fastlane**.
- **Verification:** Follow Apple's Human Interface Guidelines (HIG) for all UI work.
- **Workflow:** Research and strategy must precede execution.
- **Finality:** Always run tests and verify behavior before considering a task complete.
