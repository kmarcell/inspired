import XCTest

final class AppLaunchUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["IS_UI_TEST"] = "YES"
    }

    /// Scenario A: Fresh Install / No Session
    func testAppLaunchRoutingToLogin() throws {
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // 1. Verify we end up on the Login Screen
        XCTAssertTrue(app.staticTexts["Inspired"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Sign in with Google"].exists)
    }

    /// Scenario B: Persistent Session Restoration
    func testAppLaunchRoutingToFeed() throws {
        // Simulate a restored identity from Firebase Auth using standard UserDefaults arguments
        app.launchArguments.append(contentsOf: ["-TEST_UID", "user_teacher_001"])
        app.launch()

        // 1. Verify we end up on the Authenticated Feed (Placeholder)
        // We look for the welcome text based on the seeder data
        XCTAssertTrue(app.staticTexts["Welcome, Maya Sharma!"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Inspired Feed"].exists)
    }
}
