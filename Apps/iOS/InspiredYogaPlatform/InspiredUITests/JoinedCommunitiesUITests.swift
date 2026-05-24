import XCTest

final class JoinedCommunitiesUITests: BaseUITestCase {
    
    func testPresentJoinedCommunities() {
        // Launch app as a user with some data to get to the landing page
        app.launchArguments += ["-MOCK_USER", "user_active"]
        app.launch()
        
        // Wait for landing page
        let profileButton = app.buttons["landing.profileButton"]
        XCTAssertTrue(profileButton.waitForExistence(timeout: 5))
        
        let jcButton = app.buttons["landing.communitiesButton"]
        let searchButton = app.buttons["landing.searchButton"]
        
        // Tap Joined Communities button
        jcButton.tap()
        
        // Expectation: Only Joined Communities view is shown
        // If the bug exists, SearchView might also be presented as a fullScreenCover
        
        let jcTitle = app.staticTexts["Joined Communities"]
        XCTAssertTrue(jcTitle.waitForExistence(timeout: 5), "Joined Communities view should be shown")
        
        let searchDiscoveryTitle = app.staticTexts["landing.discovery.title"] // The localized key if not yet translated in UI test env
        // Or check for the cancel button which is unique to search
        let searchCancelButton = app.buttons["search.cancel"]
        
        XCTAssertFalse(searchCancelButton.exists, "Search view should NOT be shown when tapping JC button")
    }
}
