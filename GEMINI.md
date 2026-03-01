# GEMINI.md - Inspired Project Mandates

## Project Vision
**Inspired Yoga Platform** is a free-to-use yoga class platform designed to connect teachers and students. It features location-based services, group management, teacher discovery, user profiles, and community engagement tools.

## Personal Mandates (User-Specific)
- **Local Customization:** Users of this repository are encouraged to define their own personal mandates in **[@PERSONAL_MANDATES.md](./PERSONAL_MANDATES.md)**. 
- **Privacy:** This file is listed in `.gitignore` and is intended for local use only. It will never be committed to the repository.
- **Precedence:** Instructions in `@PERSONAL_MANDATES.md` should be treated as supplemental to the core mandates defined in `@GEMINI.md`.
- **Mandate Consistency:** When adding or updating any mandate or rule (in `@GEMINI.md` or `@PERSONAL_MANDATES.md`), it must be rigorously checked for consistency against all existing mandates. If a conflict is identified, the user must be consulted to provide a resolution that maintains a consistent and non-contradictory set of rules before the change is applied.

## Backend & Data Architecture
- **Synchronization & Integrity Mandate:** **@FEATURES.md**, **@ARCHITECTURE.md**, and **@GEMINI.md** must be kept in perfect synchronization. 
    - **Feature Updates:** When adding or changing a feature in **@FEATURES.md**, the developer must check, document, and provide JSON examples for data usage. 
    - **Impact Review:** Review the implications for service and data usage (e.g., throughput, cost, latency).
    - **Architecture Sync:** If a feature change or security review impacts service or data usage, **@ARCHITECTURE.md** must be updated immediately, including all relevant architectural diagrams.
    - **Data Seeding:** If data structures change, backend seeding and seeder scripts must be updated to reflect the new requirements.
    - **Security & Validation:** Any change to data or service usage requires an update to the Security Rules. This must be followed by a security check, rule analysis, and an update to the automated rules test suite to ensure 100% coverage and compliance.
- **Unified Cloud Strategy:** Use a unified cloud platform managed via Infrastructure as Code. Specific service and tool choices are documented in **[@ARCHITECTURE.md](./ARCHITECTURE.md)**.
- **Tooling Strategy:** Use CLI-first tooling for management, emulators for local development, and Infrastructure as Code (IaC) for all environment provisioning.
- **Security Rules Synchronization:** All data privacy and access control logic must be defined in **@ARCHITECTURE.md** and verified via automated test suites.
- **Authentication Principles:** Implement robust identity management supporting multiple providers (e.g., OAuth, Email).
- **Database Principles:** Use a scalable, cost-efficient NoSQL database solution. Favor real-time capabilities and schema flexibility for rapid development.
- **Content Moderation:** Implement a robust moderation workflow for community-generated content, combining automated filtering with administrative/owner approval.
- **Markdown Standardization:** Standardize on **Markdown** for rich text storage with strict character limits to ensure performance and readability across all clients.
- **Real-time Communication:** Implement real-time messaging and notifications using scalable cloud infrastructure.
- **Storage & Image processing:** 
    - Perform resource-intensive processing (e.g., downsampling, compression) **on the client device** before uploading to minimize bandwidth and storage costs.
    - **Standard Resolutions:** Support at least a **Thumbnail** (square crop) and a **Standard** (aspect-fit) resolution for all user-generated media. (Specific dimensions defined in **[@FEATURES.md](./FEATURES.md#411-standard-image-resolutions)**).
    - **Cache Invalidation:** Use platform-appropriate fingerprinting (e.g., query-string timestamps) to force instant CDN and browser/app cache refreshes upon updates.
    - **Hygiene:** Maintain storage hygiene by purging stale or replaced assets to control costs.
    - **Implementation:** Use platform-native image processing APIs.
- **Studio Data & Shadow Profiles:** 
    - **Backend Seeding:** Use automated discovery services via cloud functions to discover and "seed" yoga studios into the database as **Shadow Profiles**.
    - **Client Access:** Frontend clients fetch studio data exclusively from the database. Direct client-side calls to discovery APIs are forbidden.
    - **Discovery:** Proximity searches are performed against indexed database data using location fuzzing.
- **Security & Integrity:**
    - **Secret Management:** 
        - **Backend-Only Keys:** Sensitive keys must live exclusively in cloud function environment variables (IaC managed).
        - **Frontend Keys:** Minimize or eliminate third-party API keys in frontend binaries. Configuration should be fetched via environment-specific config files at build time.
    - **Location Privacy:** 
        - **Users:** Store only area-level data (e.g., postcode prefix or district). **Never store exact GPS coordinates for individual users.**
        - **Studios:** Store publicly available business addresses.
        - **Discovery:** Use Location Fuzzing for proximity searches to protect user/teacher privacy until a booking is confirmed.
- **Compliance & Data Residency:**
    - **Global Standards:** Adhere strictly to regional data protection standards (e.g., GDPR, UK-GDPR). 
    - **Regional Data Residency:** All backend services must be deployed to a single, strategically chosen region to ensure data residency compliance and minimize inter-service latency.
    - **User Rights:** Implement mechanisms for Data Access, Rectification, and the "Right to be Forgotten".
    - **Future-proofing:** Design for future compliance with global standards (e.g., CCPA, PIPL) as the platform scales.
- **Server-side Logic:** Use cloud-native serverless functions for complex management, moderation, and data scrubbing tasks.
- **Studio Data & Shadow Profiles:** 
    - **Backend Seeding:** Use automated discovery services via cloud functions to discover and "seed" yoga studios into the database as **Shadow Profiles**.
    - **Client Access:** Frontend clients fetch studio data exclusively from the database. Direct client-side calls to discovery APIs are forbidden.
    - **Discovery:** Proximity searches are performed against indexed database data using location fuzzing.
- **Security & Integrity:**
    - **Secret Management:** 
        - **Backend-Only Keys:** Sensitive keys must live exclusively in cloud function environment variables (IaC managed).
        - **Frontend Keys:** Minimize or eliminate third-party API keys in frontend binaries. Configuration should be fetched via environment-specific config files at build time.
    - **Location Privacy:** 
        - **Users:** Store only area-level data (e.g., postcode prefix or district). **Never store exact GPS coordinates for individual users.**
        - **Studios:** Store publicly available business addresses.
        - **Discovery:** Use Location Fuzzing for proximity searches to protect user/teacher privacy until a booking is confirmed.
- **Compliance & Data Residency:**
    - **Global Standards:** Adhere strictly to regional data protection standards (e.g., GDPR, UK-GDPR). 
    - **Regional Data Residency:** All backend services must be deployed to a single, strategically chosen region to ensure data residency compliance and minimize inter-service latency. (Specific region defined in **[@ARCHITECTURE.md](./ARCHITECTURE.md)**).
    - **User Rights:** Implement mechanisms for Data Access, Rectification, and the "Right to be Forgotten".
    - **Future-proofing:** Design for future compliance with global standards (e.g., CCPA, PIPL) as the platform scales.
- **Server-side Logic:** Use cloud-native serverless functions for complex management, moderation, and data scrubbing tasks.

## Infrastructure & Cost Management
- **Cost Controls:** Maintain a strict hard cost cap (defined in `@ARCHITECTURE.md`). Configure platform alerts and implement automated mitigation or throttling if thresholds are approached.
- **Monitoring & Observability:** Track API usage and resource consumption across all services. Regularly audit query efficiency to minimize unnecessary operations and costs.

## Infrastructure as Code (IaC) & Deployment
- **IaC Mandate:** All backend infrastructure must be defined and deployed via **Infrastructure as Code (IaC)** directly.
- **IaC Rationale:** Direct HCL or platform-native configuration is preferred to maintain standard compatibility, ensure full access to provider features, and simplify debugging.
- **Validation & Correctness:**
    - **Syntax Check:** Always validate IaC syntax before any deployment.
    - **Logical Check:** Review execution plans to ensure only intended resources are modified or deleted.
- **Rollback Strategy:**
    - **Versioned Config:** All configurations must be committed to Git. To revert a failed deployment, check out the previous known good state and re-deploy.
    - **State Management:** Use remote state management with locking to prevent concurrent modifications and ensure a consistent source of truth.
- **Environment Strategy:**
    - **3-Tier Setup:** Maintain **Local**, **Staging**, and **Production** environments.
    - **Deployment Flow:** All changes must be verified in **Local** (Emulators) and **Staging** before promotion to **Production**.
    - **Environment Switching:** Use platform-specific CLI tools and scripts to manage configurations.
- **Scripts & Maintenance:**
    - **Deployment:** Maintain deployment scripts to handle the full IaC deployment pipeline.
    - **Teardown:** Maintain teardown scripts to safely remove all resources from a specific environment.
- **Automation & CI/CD:**
    - **Mandate:** Use platform-appropriate automation tools (documented in platform-specific mandates like `@SWIFT.md`) for CI/CD tasks including testing, code signing, and distribution.
- **Test User Management (Staging):**
    - **Identity Protection (No Git):** 
        - **Mandate:** Never commit real or test user identifiers, credentials, or PII to the git repository. Store these in local, ignored configuration files.
        - **Seeding Guard:** Auth seeding (creating identities) is strictly permitted for the **Local Emulator ONLY**. Never attempt to seed the Auth service in Staging or Production.
    - **Management:** Manage the canonical list of authorized testers via the cloud platform console.
- **Data Isolation:** Staging data and users must never be mixed with Production.
- **Database Migrations:**
    - **Development Phase:** Data loss is acceptable. Schema changes may involve wiping the database and re-seeding to maintain velocity.
    - **Production Phase:** Zero data loss. Once live, any structural changes must be performed via versioned migration scripts.
- **Localization Synchronization:** 
    - **Source of Truth:** `Resources/Localization/{locale}/strings.json`.
    - **Automated Sync:** Use scripts to transform these JSON files into platform-native translation formats. 
- **Iconography:** Use platform-native symbols and emojis as the primary visual language.
- **Idea Tracking & Action Items:** Whenever an idea or requirement is introduced with triggers like "remember" or "take note," it must be immediately codified as a **To-Do** item in the relevant section of **@FEATURES.md**. The **@ROADMAP.md** must also be updated to ensure these items are tracked to completion.

## Project Structure
- **Root:** Contains project-wide documentation (`.md` files), centralized design assets (`UI/Mockups/`), and cross-platform configuration.
- **Apps Path:** Frontend applications are located in `Apps/{Platform}/`.

## Architecture: Frontend Clients
- **Universal Frontend Mandate:** All architectural, security, privacy, and data integrity mandates defined in this document apply to **all frontend clients** (e.g., iOS, React, Web) unless explicitly noted.
- **Dependency Pattern:** All backend services must be abstracted into platform-appropriate **Clients** (e.g., TCA Clients for iOS, Hooks/Services for React).
- **Testing Requirements:** Every frontend client must implement:
    - **TDD:** Test-driven development for all logic.
    - **Snapshot Testing:** UI validation against **@FEATURES.md** mockups.
    - **Offline Safety:** Mock implementations for all external dependencies.

## Platform-Specific Implementation Mandates
- **iOS (Swift/SwiftUI):** Detailed architectural patterns, coding standards, and implementation learnings for the iOS application are documented in **[@SWIFT.md](./SWIFT.md)**. These rules are foundational and must be strictly adhered to for all iOS development.

## Testing Strategy
- **Methodology:** Test-Driven Development (TDD). 
    - 1. Write a test for intended behavior.
    - 2. Confirm the test fails.
    - 3. Implement minimal code to pass the test.
- **Environment Distinction (Crucial):**
    - **Unit & Snapshot Tests:** Must use **in-code mocks**. These tests must be 100% offline and deterministic, relying zero on network or live backend services.
    - **UI Tests:** Must run against local emulators where applicable. This ensures integration testing without hitting cloud quotas.
- **Unit Tests:**
    - **Scope:** Target public interfaces and functions. Avoid testing internal/private logic.
    - **Security Testing:** Every TDD cycle must include **Negative Tests** to verify that "Permission Denied" scenarios are handled gracefully.
    - **Scenarios:** Cover all requirement-driven scenarios and input variants (empty, boundary, edge cases).
- **Snapshot Tests:**
    - **Goal:** UI validation against design mockups.
    - **Recording:** Always re-record reference snapshots immediately after UI changes to maintain a consistent source of truth.
    - **Themes:** Verify screens across all supported system themes (e.g., Light and Dark modes).
    - **States:** Generate snapshots for **Empty**, **Minimal Data**, and **Full Data** scenarios.
- **UI Tests:**
    - **Source of Truth:** Scenarios are defined in the `UserFlows.md` file.
    - **Performance:** Designed for speed, avoiding hard waits where possible.
    - **Accessibility Loop:** Capture and analyze accessibility hierarchies for every significant screen state to ensure they match visual intent.

## Security & Privacy (High Priority)
- **Data Protection:** Security takes precedence over UX and performance. No data is shared without explicit user approval.
- **Security Audits:** Conduct periodic **Security Reviews and Penetration Testing** of Firestore and Storage rules to ensure strict adherence to the "Least Privilege" mandate.
- **Data Lifecycle (Hard Delete):**
    - Users must have the "Right to be Forgotten." 
    - Upon account deletion, an automated **Data Scrubbing** process (Cloud Function) must purge all associated PII from Auth, Firestore, and Storage.
- **Community-based Visibility:** 
    - **Connection Definition:** Two users are considered "connected" if they share at least one **Joined Community** (includes Groups or Area communities).
    - **Asset Privacy:** Privacy must be enforced at the database level. If a user is not authorized, sensitive assets (like profile pictures) must not be accessible.
- **Deferred Choice & Reversibility:**
    - No unsolicited system pop-ups (e.g., location sharing, push notifications). All such requests must be initiated by the user or deferred for later.
    - All user privacy decisions and information sharing must be fully reversible and granularly controllable from the app's settings at any time.
- **PII (Personally Identifiable Information):** 
    - Properties holding PII must be explicitly marked in the code.
    - Documentation is **required** for any property holding PII data.
- **Networking:** Do not implement network calls or API logic until specifically instructed. If a requirement implies API usage, state the intent and ask for permission first.
- **Environment Configuration:**
    - **No-Commit Mandate:** **Never** commit sensitive API keys or environment-specific configuration files to the repository.
    - **Secret Management:** 
        - **Backend-Only Keys:** Sensitive keys like the Google Places API Key must live exclusively in Cloud Functions environment variables (IaC managed).
        - **Frontend Keys:** Minimize or eliminate third-party API keys in frontend binaries. 
    - **Automated Fetching:** Use the Firebase CLI to fetch environment-specific configurations during the setup or pre-build phase.
    - **Isolation:** Each build configuration (Staging/Prod) must point to its respective fetched configuration file.
- **Logging:** Use platform-native logging only. 
    - No debug logs unless requested.
    - All API calls, identifiers, and user data in logs **must be obfuscated**.

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
- **Explicit Commit Approval:** **NEVER** commit or push changes without asking for and receiving explicit, verbal confirmation from the user in the current turn. Previous approvals do not persist.
- **Roadmap Synchronization:** **@ROADMAP.md** must be updated at the conclusion of every significant task. Completed items must be ticked off, and any newly identified gaps or sub-tasks must be added to ensure the roadmap remains accurate and actionable.
- **Local-First Automation:** All CI/CD tasks are performed locally using platform-appropriate tools (documented in platform-specific mandates like `@SWIFT.md`).
- **Environment Stability Investigation:** 
    - **Trigger:** If tests fail unexpectedly with missing results, incomplete output, or if the process appears to hang/loop without a clear implementation-level error, the developer must investigate potential infrastructure failures.
    - **Execution Window Tracking:** Every automated test run must record its **Start** and **End** timestamps.
    - **Crash Log Correlation:** In the event of a suspected environment crash, the developer must check system diagnostic reports for platform-specific crash logs falling within the recorded test execution window.
    - **Analysis & Resolution:** The root cause of the crash must be analyzed, documented, and fixed before resuming feature development to maintain environment integrity.
- **Verification:** Follow platform-specific human interface guidelines for all UI work.
- **Workflow:** Research and strategy must precede execution.
- **Finality:** Always run tests and verify behavior before considering a task complete.
