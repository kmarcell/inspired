# TESTING.md - Testing Strategy & Verification Mandates

This document defines the testing methodology, environment isolation, and verification requirements for the "Inspired" platform.

---

## 1. Methodology
- **TDD (Test-Driven Development):** Test behavior first, implementation second. Confirm the test fails before writing the fix.
- **Negative Testing:** Every TDD cycle must include tests for "Permission Denied" or failure scenarios.

## 2. Environment Isolation
- **Unit & Snapshot Tests:** Must use **in-code Swift mocks** (via TCA `.testValue`). These must be **100% offline and deterministic**, relying zero on network or live backend services.
- **UI Tests:** Must run against the **Firebase Emulator**. This ensures integration testing without hitting cloud quotas.

## 3. Snapshot Testing (SnapshotTesting Framework)
- **Goal:** UI validation against design mockups in `@FEATURES.md`.
- **Environment Mandate:** All snapshot tests **MUST** be executed using the **iPhone 16 Pro (iOS 18.0)** simulator to ensure consistency.
- **Re-recording:** Always re-record reference snapshots (`record: true`) immediately after UI code changes.
- **Theme Awareness:** Verify screens in both **Light** and **Dark** modes in a single test function.
- **State Coverage:** Generative snapshots are required for:
    - **Empty State**
    - **Minimal Data State**
    - **Full Data State**

## 4. UI & Integration Testing
- **Source of Truth:** Scenarios are defined in `UserFlows.md`.
- **Accessibility Identifiers:** Use the pattern `feature.{id}.element` (e.g., `login.emailField`).
- **Clean Test State:** Always recreate the `XCUIApplication` instance in `setUp()` for every test case to avoid state pollution.
- **UI Test Configuration:** Prefer `app.launchArguments` (standard `-KEY VALUE` format) over `launchEnvironment`. The app should check `UserDefaults` for these keys.
- **Seed Data Integrity:** Ensure seed JSON files match the exact `Codable` schema. `DecodingError`s in `seeder.js` or the app can fail tests silently.

## 5. Accessibility Testing Loop
- **Verification:** Capture and analyze accessibility hierarchies for every significant screen state.
- **Feedback Loop:** Every significant state must call `app.captureAccessibilityHierarchy(name:)`. This generates a paired **.txt** (hierarchy) and **.png** (screenshot) in the root `Accessibility/` directory.
- **Analysis:** The `fastlane analyze_accessibility` lane exposes these artifacts for analysis to ensure the hierarchy matches visual intent.
- **Logging:** Findings must be recorded in `ACCESSIBILITY_IMPROVEMENTS.md` using the pattern `[iOS] -> [Screen Name] -> [Issue] -> [Action]`.

## 6. Critical Implementation Learnings (Testing)
- **TCA TestStore Syntax (Non-Equatable Actions):** When testing actions with non-equatable data (like `Error`), use the explicit predicate and assert closure syntax: 
  ```swift
  await store.receive({ action in 
      if case let .action(.failure(error)) = action { return error is ExpectedError }
      return false 
  }) assert: { ... state changes ... }
  ```
- **Pre-flight Authentication (UI Tests):** Never use `Task.sleep` or retry loops in a Reducer to wait for Firebase Auth state. Handle forced authentication at the `Scene` level (InspiredApp) using a `.task` on the `WindowGroup`.
- **Simulator Infrastructure:** If tests fail silently or loop, check `~/Library/Logs/CoreSimulator/CoreSimulator.log`. The simulator can be throttled for excessive disk writes or memory usage.
- **System Dependencies:** Always use TCA's `@Dependency` system for iOS system dependencies (e.g., `date`, `uuid`, `userDefaults`) to ensure testability. Never access `Date()` or `UserDefaults.standard` directly in feature logic.

---

## 7. Fastlane & AI CLI Execution Rules
To prevent context window exhaustion from verbose `xcodebuild` logs, the Gemini CLI MUST adhere to the following execution rules:

1. **Subagent Execution (Crucial):** Never run `fastlane test` directly in the main session. ALWAYS delegate test execution to a subagent (e.g., `generalist`) using the `invoke_agent` tool. Instruct the subagent to run the tests, parse the output/reports, and return only a concise summary of the success or the specific failures.
2. **Quiet Execution:** The subagent must execute Fastlane test commands with environment variables to disable unnecessary banners and output boxes. 
   - **Command format:** `FASTLANE_SKIP_ENV_PRINTER=1 FASTLANE_HIDE_CHANGELOG=1 fastlane test`
3. **Failure Diagnosis:** If `fastlane test` fails, the subagent **MUST NOT** attempt to read the massive raw terminal stdout.
4. **Structured Reading:** Instead, the subagent must read the structured JUnit XML report generated at `Apps/iOS/InspiredYogaPlatform/fastlane/test_output/report.junit`.
   - Use `grep` or standard search tools on the `.junit` file to locate `<failure>` nodes. This provides the exact file, line number, and error message for the failing test using minimal tokens.
5. **Build Errors:** If the failure occurred during compilation (before tests started), the subagent should read the raw log located at `Apps/iOS/InspiredYogaPlatform/fastlane/test_output/logs/Inspired-Inspired (Local).log`, using `grep -A 5 -B 5 "error:"` to extract only the relevant compiler errors.
