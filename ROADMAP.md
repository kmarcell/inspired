# Implementation Roadmap - Inspired Yoga Platform

This document outlines the strategic plan for the "Inspired Yoga Platform," identifying current gaps and establishing the sequence of execution.

> [!IMPORTANT]
> **MILESTONE ACHIEVED:** User Profile Screen & Settings Management (Phase 5 100% Completed)  
> **Plan References:** [`FEATURES.md`](file:///home/marcellkresz/developer/inspired/FEATURES.md#58-responsive-navigation--user-profile-screen) & [`docs/pwa_feature_parity_matrix.md`](file:///home/marcellkresz/developer/inspired/docs/pwa_feature_parity_matrix.md)  
> **Status:** All Profile Features Completed & Validated [2026-08-28]

---

## 1. Pre-requisite Gap Analysis (Kick-off Readiness)
*The following items must be resolved before full-scale feature development begins.*

### 🛠 Technical Infrastructure (Architect & Dev Lead)
- [x] **Secret Management Strategy:** backend-only keys managed via Cloud Functions environment variables (IaC).
- [x] **Xcode Target Configuration:** 3-Tier setup (Local, Staging, Production) managed via XcodeGen.
- [x] **Terraform State Management:** GCS bucket `inspired-yoga-app-staging-tfstate` created for remote state.
- [x] **Fastlane Scaffolding:** Updated to support 3-tier testing and deployment.
- [x] **Repository Security Hardening:** Hardening Actions policies and branch rulesets via GitHub CLI. [2026-07-17]

### 🧪 Validation Framework (Test Engineer)
- [x] **Firebase Emulator Initialization:** Java installed and ports configured in `firebase.json`.
- [x] **Dependency Integration:** TCA, Firebase, and SnapshotTesting added via project.yml.
- [x] **Project Scaffolding:** Core/Features/UI directory structure established.

### 📈 Business & Compliance (BA & PM)
- [ ] **Monetization Strategy:** Clarify the long-term plan to ensure the database schema can support future billing entities.
- [ ] **Legal Placeholders:** Create placeholders for **Terms of Service** and **Privacy Policy**.
- [ ] **User Feedback Loop:** Define how users will report bugs or content (Moderation workflow).

---

## 2. Implementation Phases

### Phase 1: Technical Foundation (100% Complete)
1.  [x] **Dependency Integration:** Add TCA, Firebase, and SnapshotTesting via SPM.
2.  [x] **Scaffolding:** Establish `Core/`, `Features/`, and `UI/` folder structures.
3.  [x] **Automation:** Implement `scripts/fetch-config.sh` and 3-tier `Fastfile`.
4.  [x] **IaC Foundation:** Initialize GCS state bucket.

### Phase 2: Feature Specification & Mockups
*Phase 2 is considered complete only when all feature To-Dos/Ideas in @FEATURES.md are clarified.*
1.  **Draft Feature Requirements:** Describe User Stories in **@FEATURES.md**. (In Progress: Login & Landing Shell done).
2.  **Define Studio Claiming Flow:** Establish the verification process for studio owners to claim shadow profiles.
3.  **Generate Mockups:** Create low-fidelity layout sketches for every UI component. (In Progress: Joined Communities View added).
4.  [x] **Localization Strategy:** JSON established as shared format; initial languages (en, de, fr, it, pt, es, hu) chosen.
5.  [x] **Terraform Generation Strategy:** Mandated direct use of `.tf` (HCL) files.
6.  [x] **Issue Reporting Flow:** External Google Form with `userId` pre-filling.
7.  [x] **Support Infrastructure:** External Google Form defined with `userId` pre-filling.
8.  [x] **Define Accessibility Requirements:** Establish mandates for Dynamic Type, VoiceOver, and high-contrast support in **@FEATURES.md**.
9.  [x] **Define Feed Data Requirements:** Schema for Posts, Comments, and Likes finalized in **@FEATURES.md**.
10. [x] **Data Seeding Strategy:** Deterministic JSON files created in `infrastructure/seeds/`.

### Phase 3: TDD Development

#### 3.0 Local Infrastructure Alignment (Prerequisite)
- [x] **Security Rules & Indexes:** Firestore rules verified with automated tests.
- [x] **Functions Scaffolding:** `functions/` directory verified.
- [x] **Seeding Implementation:** `infrastructure/scripts/seeder.js` verified.
- [x] **Security Review:** Initial review and automated testing of privacy rules completed.

#### 3.1 iOS Feature Implementation (TDD Cycle - Target: Local Emulator)

**Step 0: Technical Refinements & Mandates (Prerequisite)**
- [x] **Dependency Cleanup:** Refine `project.yml` to link whole packages.
- [x] **Localization-First Workflow:** Mandate and initial JSON strings implemented.
- [x] **Error Handling Refinement:** All reducers use native `Swift.Error`.
- [x] **Parameterized Testing:** Snapshot tests refactored for argument-based themes.
- [x] **Theme-Aware Snapshots:** Dark mode rendering verified.
- [x] **Initial Screen Fix:** Entry point set to LoginView.
- [x] **Google Sign-In Button:** Integrated native SDK button.
- [x] **Test Workflow Improvements:** Added emulator verification and optional re-seeding to `fastlane test`.
- [x] **App Launch Flow:** Implement `AppFeature` with splash screen and session restoration.
- [x] **Test Session Reset:** Implement `TEST_RESET_SESSION` flag for deterministic UI tests.
- [x] **Loading State Strategy:** Splash screen and circular loader defined as global pattern.
- [x] **Implementation Learnings:** Added Learnings section to **@GEMINI.md**.

**Step 1: Core Client Foundations (Interfaces & Mocks)**
- [x] **AuthenticationClient:** Complete interface and `testValue` (using `users.json` logic).
- [x] **FirestoreClient:** Define interface for fetching Feeds and Studios; implement `testValue`.
- [x] **MediaClient:** Define interface for image loading; implement `testValue` (returning local assets).

**Step 2: Authentication Logic (TDD)**
- [x] **Auth Unit Tests:** Swift Testing suites verified and passing.
- [x] **Fastlane Lane Implementation:** Develop and verify the `test` lane (Emulator-based), ensuring **auto-acceptance of Swift macros**.
- [x] **Login Screen UI:** LoginView implemented using TCA with Magic Link integration.
- [x] **Google Sign-In:** Native SDK integration with decoupled architecture.
- [x] **Login Snapshots:** Snapshots recorded and verified for all states (Login, Sent, Cooldown, Error).
- [x] **UI Polish (Login):** Fix `Spacer()` behavior to ensure legal footer remains at the bottom of the screen.
- [x] **Error Handling (Magic Link):** Implement and capture snapshots for API failure states during magic link request.

**Step 3: User Onboarding & Name Moderation (TDD)**
- [x] **Onboarding Screen UI:** Implement `OnboardingView` with Display Name field and uneditable Username label.
- [x] **Onboarding Logic:** Implement routing from Login to Onboarding if Firestore profile is missing.
- [x] **Onboarding Persistence:** Update `AppFeature` routing to ensure users are returned to Onboarding until profile completion.
- [x] **Prefill Logic:** Auto-populate Display Name from Google Auth metadata.
- [ ] **Moderation Cloud Function:** Implement `validateDisplayName` callable function using Google Cloud Natural Language API.
    - [ ] **Security Guard:** Restrict endpoint to authenticated users only (`request.auth != null`).
    - [ ] **Spam Protection:** Integrate **Firebase App Check** to prevent bot-driven billing exhaustion.
    - [ ] **Rate Limiting:** Implement server-side throttling (e.g., max 10 requests per 10 minutes per UID).
- [ ] **Validation Guard:** Enforce display name length (2-50 chars) and character constraints in Firestore Security Rules.
- [x] **Onboarding Snapshots:** Capture snapshots for empty and pre-filled states.

**Step 4: Landing Page Shell & Navigation**
- [x] **Landing Page Feature:** Create `LandingPageFeature` TCA component to manage global navigation state.
- [x] **Top Navigation Bar:** Implement the top bar with Profile avatar placeholder (Circle + SF Symbol `person.crop.circle.fill`), Search-styled button (navigates to search), Joined Communities (`person.2`), and Notifications (`bell`).
- [x] **Area Awareness:** Implement the adaptive area label ("You're currently viewing...").
    - [ ] **TODO:** Implement Cloud Function for Header-Based IP-to-Area detection.
- [x] **Post Entry Bar:** Implement the "What's on your mind?" bar above the feed (Opens Create Post screen placeholder, logs to console).
- [x] **UI Integration:** Replace the placeholder authenticated view in `AppView` with the real `LandingPageView`.
- [x] **Verification:** Snapshot tests (iPhone 16 Pro) and UI tests for landing page visibility.

**Step 5: Community Feed & Discovery (TDD)** (Completed 2026-03-11)
- [x] **Feed Post Tile UI:** Implement high-fidelity `FeedPostTile` with Author, Source, and Stat elements.
- [x] **Feed Snapshots:** Verify tile variations (Short/Long content) across themes on iPhone 16 Pro.
- [ ] **Postcode Metadata:** Seed `postcode_metadata` collection using ONS Open Data (OGL).
    - [ ] **TODO:** Define proximity logic for mapping postcode centroids to neighbouring prefixes.
- [x] **Feed Data Expansion:** Expand `infrastructure/seeds/posts.json` with diverse test data (varied dates, sources).
- [x] **Firestore Client (Feed Logic):**
    - [x] **Pagination:** Implement cursor-based fetching with a 25-post limit.
    - [x] **Tiered Discovery:** Implement the 30-day -> 6-month query fallback sequence.
- [x] **Community Feed Feature:** Create TCA reducer to manage feed state, engagement scores, and tiered fetching.
- [ ] **Empty State (Discovery Mode):** 
    - [ ] **UI Implementation:** Create "Communities Near You" view (Search-list style).
    - [ ] **Engagement Metrics:** Implement `engagementScore` calculation: `(Members * 1) + (Posts in last 7 days * 5)`.
    - [ ] **Fallback Logic:** Implement suggestion of popular communities from major hubs (e.g., London).
- [x] **Feed Integration:** Replace placeholders in `LandingPageView` with the live `CommunityFeedView`.
- [x] **Verification:** Snapshot tests for empty vs. full feed states.
- [x] **Scroll View:** Fix ScrollView and make sure the ForEach is not in a VStack to improve performance.
- [x] **Pull to Refresh:** Implement pull to refresh on the feed list.

**Step 6: Joined Communities & Summaries (TDD)**
- [ ] **Current Progress:** UI implemented. Investigating navigation bug and preparing tests. See `TODO.md ## [2026-05-15 15:30]`.
- [x] **Seed Data Requirements:** Define test users in `users.json` (User A: Full Joined Communities, User B: Empty Joined Communities).
- [ ] **Joined Communities UI (Full):** Implement management screen, Summary Tiles, and Swipe-to-Unjoin.
- [ ] **Joined Communities UI (Empty):** Implement "Communities Near You" state using reusable discovery components.
- [ ] **Recommendation Caching:** Implement in-memory caching for area-based recommendations in `FirestoreClient`.
- [ ] **Snapshot Tests:** Generate snapshots for both Empty and Full states using robust mock data (Light/Dark mode).
- [ ] **UI & Accessibility Tests:** Write UI tests for both states and run `app.captureAccessibilityHierarchy(name:)` to generate the required reports.
- [ ] **Verification:** Confirm swipe actions and navigation logic match `UserFlows.md`.

**Step 7: Privacy-First User Model & Security Rule Enforcement (TDD)**
- [x] **Data Model Refactor:** Remove `isTeacher` and standardize on `privacySettings`.
- [x] **Security Rule Implementation:** Implement "Community Overlap" and Profile Privacy logic in Firestore Rules.
- [x] **Privacy Constraint Enforcement:** Implement logic to force avatar to `public` if profile is `public`.
- [x] **Negative TDD:** Write comprehensive security tests for the Privacy Matrix.

#### 3.2 Advanced Feature Design & Specification (Prerequisite for Phase 4)
*Phase 3.2 must be complete before moving to Phase 4 Staging Deployment.*
- [x] **Email Registration Flow:** Design the "Create Account" screen for non-Google users.
- [ ] **Write Post Flow:** Define the full-screen composer UI, Markdown support, and Area/Community tagging.
- [x] **Search UI & Experience:** Define how search results (Areas, Communities, Teachers) are displayed and navigated.
    - [x] **TODO:** Implement caching for empty-query recommendations to prevent redundant searches.
    - [x] **TODO:** On "No Results" state, display recommended communities instead of an empty search screen.
- [ ] **Yoga Studio & Community Profiles:** Define the full UI and data requirements for claimed studio pages.
- [ ] **Shadow Profile Claiming:** Define the technical and UI flow for verifying studio ownership.
- [ ] **Hashtags & Mentions:** Define interaction logic, search behavior, and rendering mandates.
- [ ] **Real-time Chat:** Define the UI for group messaging and the FCM notification logic.
- [ ] **Share Post (Deferred):** Define the technical goal and UI for sharing (e.g., Deep linking vs. Image generation).
- [ ] **Mockup Generation:** Ensure all above features have corresponding sketches in `UI/Mockups/`.

### Phase 4: PWA Feature Parity & Deployment (100% Complete)
*Detailed parity blueprint: [`docs/pwa_feature_parity_matrix.md`](file:///home/marcellkresz/developer/inspired/docs/pwa_feature_parity_matrix.md)*
1. [x] **Step 1: Domain Types (`Apps/PWA/src/types/index.ts`):** Define TypeScript models matching Swift `User`, `Post`, `Community`, `Studio`.
2. [x] **Step 2: Services Layer (`Apps/PWA/src/services/`):** Implement `authService.ts` and `firestoreService.ts` with 3-tier feed query & 30-item `in` batching.
3. [x] **Step 3: Auth State Machine (`Apps/PWA/src/context/AuthContext.tsx`):** Replicate `AppFeature.swift` state transitions (`launching` -> `login` / `onboarding` / `authenticated`).
4. [x] **Step 4: Login Component (`Apps/PWA/src/components/LoginView.tsx`):** Magic link login with 60s cooldown timer and Google OAuth.
5. [x] **Step 5: Onboarding Component (`Apps/PWA/src/components/OnboardingView.tsx`):** Display name validation ($\ge 2$ chars) and handle generator (`name#XXXX`).
6. [x] **Step 6: Community Feed Component (`Apps/PWA/src/components/CommunityFeedView.tsx`):** Post cards, 30d -> 180d -> Discovery Mode fallback & pull-to-refresh.
7. [x] **Step 7: Joined Communities Component (`Apps/PWA/src/components/JoinedCommunitiesView.tsx`):** Management tiles, unread count, and swipe-to-unjoin list.

### Phase 5: User Profile Screen & Settings Management (100% Complete)
- [x] **Profile Screen Navigation:** Wire top-left Avatar / Handle tap to open `ProfileView`.
- [x] **Profile Management:** Edit bio, view Avatar, handle `name#XXXX`, and relocate mobile Logout button.
- [x] **Privacy Toggles:** Implement `isProfilePublic`, `avatarPrivacy`, and `showJoinedGroups` settings matrix.

### Phase 6: Search & Community Explorer (100% Complete)
- [x] **Search Engine (`firestoreService.searchEntities`):** Smart matching for postcode prefixes (`W12`, `W6`, `SW3`), area names, and partial keywords.
- [x] **Search Component (`SearchView.tsx`):** Discovery Mode, Search Query Results Mode with entity badges (👥 **Community** vs 🏢 **Studio** vs 📍 **Area**), and No Results fallback.
- [x] **Header Navigation Integration (`App.tsx`):** Interactive search bar in header following `5.2_LandingPageShell.svg` mockup.
- [x] **Automated Testing (`SearchView.test.tsx`):** 100% passing Vitest test suite for discovery mode, query filtering, and join button toggle.

### Phase 7: Company & Multi-Studio Creation & Management (100% Complete)
- [x] **Firestore Data Layer (`/companies` & `/studios`):** Multi-company ownership per user profile (`ownerId`) and multi-location studio branches with parent `companyId`.
- [x] **Studio Creation Form (`CreateStudioView.tsx`):** Step 1 Company Brand choice + Step 2 Studio location details with postcode prefix validation (`W12`, `W6`, `SW3`).
- [x] **Management Suite (`MyStudiosView.tsx`):** Multi-brand overview card, branch studio list, and edit/view actions.
- [x] **Navigation Entry Points (`App.tsx` & `ProfileView.tsx`):** Desktop Sidebar "🏢 My Studios" & Mobile Profile "🏢 My Studios & Company".
- [x] **Automated Testing (`CreateStudioView.test.tsx`, `MyStudiosView.test.tsx`):** 100% passing Vitest test coverage (40/40 tests passing across 11 test suites).

### Phase 8: Admin Claim Verification, Shadow Profile Claiming & Notification Suite (100% Complete)
- [x] **Outreach Email Template (`claim_invitation.html`):** Invitation email with direct claim link (`https://inspired.yoga/claim-studio?studioId=...&token=...`).
- [x] **Verification Submission (`ClaimStudioView.tsx`):** Claimant identity check & document upload submission (utility bill, insurance cert, business license) saved to `/studioClaims/{claimId}`.
- [x] **Search Integration (`SearchView.tsx`):** Unclaimed shadow studio tiles (`isClaimed: false`) render an interactive **"Claim Studio 🏢"** button.
- [x] **Cloud Function Approvals:** Automated verification email sent to studio owner upon approval (`isClaimed: true`).
- [x] **Rejection Flow with Optional Reason:** Admin rejection action incorporating optional message string in applicant email (`claim_rejection.html`).
- [x] **Automated Testing (`ClaimStudioView.test.tsx`):** 100% passing Vitest test coverage (43/43 tests passing across 12 test suites).
- [ ] **Production Legal & Email Template Links:** Update placeholder URLs (`privacyUrl`, `termsUrl`, `websiteUrl`) in `infrastructure/backend/templates/emails/index.ts` with final domain links prior to release.

---

## 3. Project Milestones
- [x] **M1: Foundation Ready:** All technical gaps in Section 1 closed.
- [ ] **M2: Design Approved:** Mockups and Features defined for first release.
- [ ] **M3: Alpha Release:** App running on physical device via USB with Google Login.
- [ ] **M4: Beta Release:** First build distributed to external testers via Firebase.
