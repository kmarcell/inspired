# GEMINI.md - Inspired Project Mandates

## 1. System Overview
- **Tech Stack:** Universal Frontend (iOS/SwiftUI, React, Web), Firebase (Firestore, Cloud Functions, Storage).
- **Architecture:** TCA (The Composable Architecture) for iOS, Serverless backend, Infrastructure as Code (IaC).
- **Objective:** A free-to-use yoga platform connecting teachers and students via location-based discovery.

## 2. AI Behavioral Guardrails
- **Expertise & Proactive Review:** Before implementing a request, perform an Architecture/Security review. Present findings and strategic recommendations (e.g., OAuth vs. basic setup) *before* or *alongside* acting.
- **Requirement Preservation:** **Never** reduce or delete requirements in `@FEATURES.md`. Additions must be additive refinements. Replacing detailed requirements with "see previous" is forbidden.
- **Idea Tracking Mandate:** Whenever an idea or requirement is introduced (triggers: "remember", "take note"), immediately codify it as a To-Do item in `TODO.md` and update `@ROADMAP.md`.
- **Mandate Consistency:** Before updating any mandate or rule, rigorously check for consistency against all existing mandates. Consult the user if a conflict is identified.
- **Environment Stability Investigation:** If tests fail unexpectedly, hang, or time out without a clear code error, proactively investigate system/simulator crash logs (`~/Library/Logs/CoreSimulator/`).
- **Test Failure Reporting:** If any automated tests fail, **ALWAYS** identify and echo the names of the specific failing tests in your response.
- **Coordination & Safety:** If a fix fails once or compiler errors persist, **STOP immediately** and ask for help.

## 3. Critical Rules & Anti-Patterns
- **Never Commit Secrets/PII:** Keys go in Cloud Functions env vars. Never commit test users or passwords.
- **Never Use Shell File Editors:** Never use `sed`, `cat`, etc. Use native AI file operations (`replace`, `write_file`).
- **Never Use xcodebuild Directly:** Always use `fastlane` for repetitive automation, testing, and deployment.
- **Data & State Management:** NoSQL database. Perform heavy image processing client-side. Backend seeding creates "Shadow Profiles" for studios. Location privacy is paramount (use Location Fuzzing).

## 4. Execution Workflows
- **Research Mandate:** Always read `README.md` at the start of any new session or task.
- **Planning Mandate:** Clarify proposed plan -> Obtain explicit verbal approval -> Track in `TODO.md` with date/timestamp.
- **Dev Loop:** Research -> Strategy (Plan/Ask Approval) -> Act -> TDD (Unit/Snapshot) -> Validate.
- **Definition of Done:** 
  - [ ] Implementation aligns 1:1 with `UI/Mockups/` and `@FEATURES.md`.
  - [ ] All Unit, Snapshot, and UI tests pass.
  - [ ] Security/Architecture impact evaluated; Firestore rules verified.
  - [ ] `@ROADMAP.md` updated.
  - [ ] Explicit verbal user confirmation received before committing.

## 5. Context Map (The Routing Logic)
*Refer to these files based on the task type to maintain high context density.*

- **`@SWIFT.md`:** (Load for: Swift/SwiftUI logic, TCA Reducers, Data Models, App Navigation).
- **`@TESTING.md`:** (Load for: Writing tests, diagnosing test failures, Fastlane/CI issues, Accessibility verification).
- **`@FEATURES.md`:** (Load for: New feature requirements, UI states, Mockup-driven development, NoSQL schemas).
- **`@ARCHITECTURE.md`:** (Load for: Firebase Rules, Cloud Functions, Security logic, Infrastructure, Cost limits).
- **`@PERSONAL_MANDATES.md`:** Local, user-specific rules (never committed).
- **`TODO.md` & `@ROADMAP.md`:** Mandatory tracking for all sub-tasks and project milestones.
