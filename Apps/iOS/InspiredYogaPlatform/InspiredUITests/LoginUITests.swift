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

        // Verify key elements are present using accessibility identifiers
        XCTAssertTrue(app.buttons["login.googleButton"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["login.magicLinkButton"].exists)
        XCTAssertTrue(app.textFields["login.emailTextField"].exists)
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
