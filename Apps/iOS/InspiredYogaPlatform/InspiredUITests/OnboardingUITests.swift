import XCTest

final class OnboardingUITests: BaseUITestCase {

    override func setUpWithError() throws {
        try super.setUpWithError()
    }

    /// Accessibility test to capture the VoiceOver hierarchy for Onboarding.
    func testOnboardingScreenVoiceOver() throws {
        app.launchEnvironment["TEST_SCREEN"] = "Onboarding"
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // 1. Verify we land on the Onboarding Screen using identifier
        let title = app.staticTexts["onboarding.title"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))

        // 2. Capture Accessibility Hierarchy for AI Analysis
        app.captureAccessibilityHierarchy(name: "OnboardingScreen_VoiceOver")
    }
}
