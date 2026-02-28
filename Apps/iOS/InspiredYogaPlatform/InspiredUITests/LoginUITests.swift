//
//  InspiredUITestsLaunchTests.swift
//  InspiredUITests
//
//  Created by Marcell Kresz on 20/03/2024.
//

import XCTest

final class LoginUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Functional test to verify the login screen appears correctly.
    func testLoginScreenArrival() throws {
        let app = XCUIApplication()
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // Verify key elements are present using localized labels
        XCTAssertTrue(app.staticTexts["Inspired"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Sign in with Google"].exists)
    }

    /// Accessibility test to capture the VoiceOver hierarchy.
    func testLoginScreenVoiceOver() throws {
        let app = XCUIApplication()
        app.launchEnvironment["TEST_SCREEN"] = "Login"
        app.launchEnvironment["TEST_RESET_SESSION"] = "YES"
        app.launch()

        // Capture Accessibility Hierarchy for AI Analysis
        app.captureAccessibilityHierarchy(name: "LoginScreen_VoiceOver")
    }
}
