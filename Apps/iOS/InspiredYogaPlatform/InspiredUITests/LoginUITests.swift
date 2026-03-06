import XCTest

final class LoginUITests: BaseUITestCase {

    override func setUpWithError() throws {
        try super.setUpWithError()
    }

    /// Functional test to verify the login screen appears correctly.
    func testLoginScreenArrival() throws {
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // Verify key elements are present using accessibility identifiers
        XCTAssertTrue(app.buttons["login.googleButton"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["login.emailTextField"].exists)
        XCTAssertTrue(app.buttons["login.magicLinkButton"].exists)
    }

    /// Accessibility test to capture the VoiceOver hierarchy.
    func testLoginScreenVoiceOver() throws {
        app.launchEnvironment["TEST_SCREEN"] = "Login"
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // Capture Accessibility Hierarchy for AI Analysis
        app.captureAccessibilityHierarchy(name: "LoginScreen_VoiceOver")
    }

    /// Functional and accessibility test for the Magic Link Sent state.
    func testMagicLinkSentAccessibility() throws {
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        let emailField = app.textFields["login.emailTextField"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        
        emailField.tap()
        emailField.typeText("test@example.com")
        
        app.buttons["login.magicLinkButton"].tap()
        
        // Wait for the success pill
        let successText = app.staticTexts["login.magicLinkSent"]
        XCTAssertTrue(successText.waitForExistence(timeout: 5))
        
        // Capture hierarchy to verify contrast/structure in the success state
        app.captureAccessibilityHierarchy(name: "LoginScreen_MagicLinkSent_VoiceOver")
    }
}
