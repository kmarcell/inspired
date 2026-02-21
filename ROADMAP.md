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
- [ ] **Firebase Emulator Initialization:** Run `firebase init emulators` and finalize local ports.
- [ ] **Staging Data Seeding:** Develop a script/process to seed the `inspired-yoga-app-staging` environment.

### 📈 Business & Compliance (BA & PM)
- [ ] **Monetization Strategy:** Clarify the long-term plan (e.g., "Free now, Premium later" vs. "Ad-supported") to ensure the database schema can support future billing entities.
- [ ] **Legal Placeholders:** Create placeholders for **Terms of Service** and **Privacy Policy** (required for Firebase Auth and App Store submission).
- [ ] **User Feedback Loop:** Define how users will report bugs or content (Moderation workflow).

---

## 2. Implementation Phases

### Phase 1: Technical Foundation (Current Focus)
1.  **Dependency Integration:** Add TCA, Firebase, and SnapshotTesting via SPM.
2.  **Scaffolding:** Establish `Core/`, `Features/`, and `UI/` folder structures.
3.  **Automation:** Implement `scripts/fetch-config.sh` and basic `Fastfile`.
4.  **IaC Foundation:** Initialize Terraform providers and GCS state bucket.

### Phase 2: Feature Specification & Mockups
*This phase begins once Phase 1 gaps are closed.*
1.  **Draft Feature Requirements:** Describe User Stories in **@FEATURES.md**.
2.  **Define Studio Claiming Flow:** Establish the verification process for studio owners to claim shadow profiles.
3.  **Generate Mockups:** Create low-fidelity layout sketches for every UI component.
3.  **Data Schema Finalization:** Update **@FEATURES.md** JSON examples based on mockups.

### Phase 3: TDD Development
1.  **Client Implementation:** Build `AuthenticationClient` and `FirestoreClient` (Mock & Live).
2.  **UI Implementation:** Develop SwiftUI views driven by TCA Reducers.
3.  **Snapshot Verification:** Compare high-fidelity snapshots against low-fidelity mockups.

### Phase 4: Staging & Deployment
1.  **IaC Deployment:** Push infrastructure to `inspired-yoga-app-staging`.
2.  **Beta Testing:** Distribute build to "Staging Testers" via Firebase App Distribution.
3.  **Bug Scrub:** Resolve issues identified during staging.

---

## 3. Project Milestones
- **M1: Foundation Ready:** All gaps in Section 1 closed.
- **M2: Design Approved:** Mockups and Features defined for first release.
- **M3: Alpha Release:** App running on physical device via USB with Google Login.
- **M4: Beta Release:** First build distributed to external testers via Firebase.
