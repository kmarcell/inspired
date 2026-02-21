# Implementation Roadmap - Inspired Yoga Platform

This document outlines the strategic plan for the "Inspired Yoga Platform," identifying current gaps and establishing the sequence of execution.

---

## 1. Pre-requisite Gap Analysis (Kick-off Readiness)
*The following items must be resolved before full-scale feature development begins.*

### 🛠 Technical Infrastructure (Architect & Dev Lead)
- [ ] **Secret Management Strategy:** Define how the Google Places API Key and Firebase API keys will be injected into the app without committing them to Git (e.g., using `Secrets.xcconfig`).
- [ ] **Xcode Target Configuration:** The project needs separate Build Targets or Schemes for **Staging** and **Production** to support environment-specific `GoogleService-Info.plist` fetching.
- [ ] **Terraform State Management:** Create a dedicated GCS bucket in the staging project to hold the Terraform remote state (prevents state corruption).
- [ ] **Fastlane Scaffolding:** Initialize the `Fastfile` and `Appfile` to support the `fastlane test` and `fastlane deploy_staging` commands.

### 🧪 Validation Framework (Test Engineer)
- [ ] **Firebase Emulator Setup:** Configure the local Firebase Emulator (Auth, Firestore, Functions) to allow TDD without hitting real backend quotas.
- [ ] **Test Data Seed Script:** Create a script to populate the Staging/Emulator environments with deterministic "Yoga Studios" and "Test Teachers" for UI/Snapshot verification.

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
2.  **Generate Mockups:** Create low-fidelity layout sketches for every UI component.
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
