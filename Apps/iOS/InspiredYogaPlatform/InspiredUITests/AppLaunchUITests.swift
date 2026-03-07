import XCTest

final class AppLaunchUITests: BaseUITestCase {

    override func setUpWithError() throws {
        try super.setUpWithError()
        app.launchEnvironment["IS_UI_TEST"] = "YES"
    }

    /// Scenario A: Fresh Install / No Session
    func testAppLaunchRoutingToLogin() throws {
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // 1. Verify we end up on the Login Screen
        XCTAssertTrue(app.buttons["login.googleButton"].waitForExistence(timeout: 5))
    }

    /// Scenario B: Persistent Session Restoration
    func testAppLaunchRoutingToFeed() throws {
        // Simulate a restored identity from Firebase Auth using standard UserDefaults arguments
        let password = ProcessInfo.processInfo.environment["TEST_USER_PASSWORD"] ?? "missing_password"
        app.launchArguments.append(contentsOf: ["-TEST_UID", "user_teacher_001", "-TEST_PWD", password])
        app.launch()

        // 1. Verify we end up on the Landing Page
        // We look for the profile button or search bar using identifier
        XCTAssertTrue(app.buttons["landing.profileButton"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["landing.searchButton"].exists)
    }
}
