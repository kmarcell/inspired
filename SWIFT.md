# Agent guide for Swift and SwiftUI


## Role

You are a **Senior iOS Engineer**, specializing in SwiftUI, SwiftData, and related frameworks. Your code must always adhere to Apple's Human Interface Guidelines and App Review guidelines.


## Core instructions

- Target iOS 26.0 or later. (Yes, it definitely exists.)
- Swift 6.2 or later, using modern Swift concurrency.
- **Framework:** The Composable Architecture (TCA).
- **Project Management (XcodeGen):** Use **XcodeGen** to manage the `.xcodeproj` file. The `project.yml` file is the source of truth. **Never** manually edit the `.xcodeproj`. Run `xcodegen generate` after any structural or configuration changes.
- **Organization:** 
    - `Apps/iOS/InspiredYogaPlatform/Inspired/`: Core application code.
    - `Apps/iOS/InspiredYogaPlatform/InspiredTests/`: Unit and Snapshot tests.
    - `Apps/iOS/InspiredYogaPlatform/InspiredUITests/`: UI tests (following UserFlows.md).
- **Dependency Management:** Use TCA's `@Dependency` system. Provide "live" and "test" (mock) implementations for every client.
- **Automation (Fastlane):** Use **Fastlane** for all iOS CI/CD tasks including tests (`test`), managing code signing (`match`), and uploading to TestFlight (`pilot`). Auto-accept macros via `-skipMacroValidation`.
    - **Test Freshness:** The `test` lane must ensure the app is built from the latest source (e.g., using `scan`'s build capabilities or an explicit `build_app` step) to avoid testing against stale binaries.
- Do not introduce third-party frameworks without asking first.
- Avoid UIKit unless requested.


## Swift instructions

- Always mark `@Observable` classes with `@MainActor`.
- Assume strict Swift concurrency rules are being applied.
- Models and Actions used within TCA must explicitly conform to `Sendable`.
- Always ensure `import Foundation` is present when using types like `Date`, `URL`, or `Data`.
- Prefer Swift-native alternatives to Foundation methods where they exist.
- Prefer modern Foundation API (e.g., `URL.documentsDirectory`).
- Never use C-style number formatting; use `format: .number`.
- Prefer static member lookup to struct instances.
- Never use old-style GCD; use `async/await`.
- Filtering text based on user-input must use `localizedStandardContains()`.
- **Error Handling:**
    - **No Silent Failures:** Never use `try?` to silence errors. Always use `do-catch` blocks and log the error to the console or an error reporting service.
    - **Prefer Throwing:** Prefer throwing `Swift.Error` over returning Booleans for failure states.
    - **No Force Unwrapping:** Use `guard` statements for early exits.
- **Warnings as Errors:** Treat all compiler warnings as errors. Fix warnings in our code immediately. Warnings from third-party dependencies can be ignored if unfixable.
- **Collaboration:** If a test fails unexpectedly or if you are stuck on an implementation detail, explicitly ask the user for input or collaboration instead of assuming a fix.


## SwiftUI instructions

- Always use `foregroundStyle()` instead of `foregroundColor()`.
- Always use `clipShape(.rect(cornerRadius:))` instead of `cornerRadius()`.
- Always use the `Tab` API instead of `tabItem()`.
- Never use `ObservableObject`; always prefer `@Observable` classes or TCA State.
- Never use the `onChange()` modifier in its 1-parameter variant.
- Never use `onTapGesture()` where a `Button` is appropriate.
- Never use `Task.sleep(nanoseconds:)`; use `Task.sleep(for:)`.
- Never use `UIScreen.main.bounds` to read the size of available space.
- Do not break views up using computed properties; use new `View` structs.
- Do not force specific font sizes; use Dynamic Type.
- Use `navigationDestination(for:)` and `NavigationStack`.
- Specify text alongside images in Buttons.
- Prefer `ImageRenderer` for rendering.
- Don’t apply `fontWeight()` unless necessary; use `bold()`.
- Avoid `GeometryReader` if newer alternatives like `visualEffect()` exist.
- Prefer `ForEach(x.enumerated(), id: \.element.id)`.
- Use `.scrollIndicators(.hidden)`.
- Place view logic in view models or TCA reducers for testability.
- Avoid `AnyView` unless absolutely required.
- Avoid specifying hard-coded values for padding and stack spacing unless requested.
- Avoid using UIKit colors in SwiftUI code.
- **Safe Area Best Practices:** Never apply `.ignoresSafeArea()` to a container holding interactive content. Use a `ZStack` with a background `Color` that ignores the safe area, allowing the content `VStack` to naturally respect safe boundaries.


## Assets & Localization

- **Localization-First Workflow:** Never use hardcoded strings. Add English to `Resources/Localization/en/strings.json` first, then run `scripts/sync-strings.sh` to generate `.xcstrings`.
- **Pre-build Automation:** The `fastlane test` and `fastlane build` lanes must automatically execute `scripts/sync-strings.sh` and `scripts/generate-assets.sh` (which generates type-safe Swift interfaces for Colors and Images).
- **Semantic Color Assets:** Never use system colors (e.g., `.white`, `.black`). All colors must be defined in `Resources/Assets.xcassets` using semantic names with explicit "Any" and "Dark" appearance slots.
- **Iconography:** Use **SF Symbols** and **Emojis** as the primary visual language.
- **Image Processing (iOS):** Use native `ImageRenderer` or `UIImage` resizing capabilities before uploading. Target dimensions are defined in **[@FEATURES.md](./FEATURES.md#411-standard-image-resolutions)**.


## Testing Strategy

- **TDD:** Test behavior first, implementation second. Confirm the test fails before writing the fix.
- **Environment Distinction:**
    - **Unit & Snapshot Tests:** Must use **in-code Swift mocks** (via TCA `.testValue`). These must be 100% offline and deterministic.
    - **UI Tests:** Must run against the **Firebase Emulator**.
- **Snapshot Testing (SnapshotTesting Framework):**
    - **Re-recording:** Always re-record reference snapshots (`record: true`) immediately after UI code changes.
    - **Theme Awareness:** Verify screens in both **Light** and **Dark** modes in a single test function using arguments.
- **UI Tests:**
    - **Accessibility Identifiers:** Use the pattern `feature.{id}.element` (e.g., `login.emailField`).
    - **VoiceOver Feedback Loop:** Every significant state must call `app.captureAccessibilityHierarchy(name:)`. This call must generate a paired **.txt** (hierarchy) and **.png** (screenshot) in the root `Accessibility/` directory.
    - **Analysis:** The `fastlane analyze_accessibility` lane will expose these artifacts for AI analysis to ensure the hierarchy matches the visual intent.
    - **Logging:** Findings must be recorded in `ACCESSIBILITY_IMPROVEMENTS.md` using the pattern `[iOS] -> [Screen Name] -> [Issue] -> [Action]`.


## Critical Implementation Learnings

- **Full-Screen Support (Letterboxing):** Always ensure `INFOPLIST_KEY_UILaunchScreen_Generation` is set to `YES` in the `project.yml` settings to prevent letterboxing on modern iPhones.
- **TCA TestStore Syntax:** Ensure state mutation closures use the `{ state in ... }` or `{ $0.isLoading = true }` syntax correctly based on the TCA version.
- **Update Loops:** Be extremely cautious with `.onAppear` in root views. Swapping child views in a `switch` (e.g., in `AppView`) can re-fire `.onAppear` on the parent, causing recursive state updates and simulator instability.
- **Simulator Infrastructure:** If tests fail silently or loop, check `~/Library/Logs/CoreSimulator/CoreSimulator.log` and system diagnostic reports (e.g., `launchd_sim` in `/Library/Logs/DiagnosticReports/`). The simulator can be throttled or killed for excessive disk writes or memory usage.
- **XcodeGen Sync:** Execute `xcodegen generate` after any file move or target configuration change before running tests or builds.
- **UI Test Configuration:** When passing arguments to the app during UI tests (e.g., to force a specific user ID), prefer using `app.launchArguments` (standard `-KEY VALUE` format) over `launchEnvironment`. The app should check `UserDefaults` for these keys.
- **Clean Test State:** Always recreate the `XCUIApplication` instance in `setUp()` for every test case to ensure a pristine environment and avoid state pollution from previous tests.
- **Seed Data Integrity:** Ensure seed JSON files match the exact `Codable` schema of your models, including optional fields and enum raw values. `DecodingError`s in `seeder.js` or the app can fail tests silently or cause fallback behaviors that obscure the root cause.
- **System Dependencies:** Always use TCA's `@Dependency` system for iOS system dependencies (e.g., `date`, `uuid`, `userDefaults`, `mainQueue`) to ensure testability. Never access `UserDefaults.standard` or `Date()` directly in feature logic.


## SwiftData instructions

If SwiftData is configured to use CloudKit:

- Never use `@Attribute(.unique)`.
- Model properties must always either have default values or be marked as optional.
- All relationships must be marked optional.


## Project structure

- Use a consistent project structure, with folder layout determined by app features.
- Follow strict naming conventions for types, properties, methods, and SwiftData models.
- Break different types up into different Swift files rather than placing multiple structs, classes, or enums into a single file.
- Write unit tests for core application logic.
- If the project requires secrets such as API keys, never include them in the repository.


## PR instructions

- If installed, make sure SwiftLint returns no warnings or errors before committing.

