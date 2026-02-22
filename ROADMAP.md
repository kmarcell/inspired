# Implementation Roadmap - Inspired Yoga Platform

This document outlines the strategic plan for the "Inspired Yoga Platform," identifying current gaps and establishing the sequence of execution.

---

## 1. Pre-requisite Gap Analysis (Kick-off Readiness)
*The following items must be resolved before full-scale feature development begins.*

### 🛠 Technical Infrastructure (Architect & Dev Lead)
- [x] **Secret Management Strategy:** backend-only keys managed via Cloud Functions environment variables (IaC).
- [x] **Xcode Target Configuration:** 3-Tier setup (Local, Staging, Production) managed via XcodeGen.
- [x] **Terraform State Management:** GCS bucket `inspired-yoga-app-staging-tfstate` created for remote state.
- [x] **Fastlane Scaffolding:** Updated to support 3-tier testing and deployment.

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
3.  **Generate Mockups:** Create low-fidelity layout sketches for every UI component. (In Progress).
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
- [ ] **Terraform Foundations:** Write the initial `.tf` files for Auth and Firestore.

#### 3.1 iOS Feature Implementation
1.  **Client Implementation:** Build `AuthenticationClient` and `FirestoreClient` (Mock & Live).
2.  **Fastlane Lane Implementation:** Develop and verify the `test`, `deploy_staging`, and `deploy_prod` lanes, including automated localization synchronization.
3.  **Accessibility Analysis Lane:** Implement the `analyze_accessibility` lane to trigger the Gemini-based VoiceOver review loop.
4.  **UI Implementation:** Develop SwiftUI views driven by TCA Reducers.
5.  **Snapshot Verification:** Compare high-fidelity snapshots against low-fidelity mockups.

### Phase 4: Staging & Deployment
1.  **IaC Deployment:** Push infrastructure to `inspired-yoga-app-staging`.
2.  **Beta Testing:** Distribute build to "Staging Testers" via Firebase App Distribution.
3.  **Bug Scrub:** Resolve issues identified during staging.

---

## 3. Project Milestones
- [x] **M1: Foundation Ready:** All technical gaps in Section 1 closed.
- [ ] **M2: Design Approved:** Mockups and Features defined for first release.
- [ ] **M3: Alpha Release:** App running on physical device via USB with Google Login.
- [ ] **M4: Beta Release:** First build distributed to external testers via Firebase.
