import XCTest

final class LandingPageUITests: BaseUITestCase {
    
    func testLandingPageAccessibility() {
        // Set environment variable to show Landing Page directly
        app.launchEnvironment["TEST_SCREEN"] = "Landing"
        app.launch()
        
        // Wait for landing page to appear
        let profileButton = app.buttons["landing.profileButton"]
        XCTAssertTrue(profileButton.waitForExistence(timeout: 10), "Landing page profile button should exist")
        
        // Perform accessibility audit
        app.captureAccessibilityHierarchy(name: "LandingPage_AccessibilityAudit")
        
        // Check other key elements
        XCTAssertTrue(app.buttons["landing.searchButton"].exists, "Search button should exist")
        XCTAssertTrue(app.buttons["landing.communitiesButton"].exists, "Communities button should exist")
        XCTAssertTrue(app.buttons["landing.notificationsButton"].exists, "Notifications button should exist")
        XCTAssertTrue(app.buttons["landing.createPostButton"].exists, "Create post button should exist")
    }
}
