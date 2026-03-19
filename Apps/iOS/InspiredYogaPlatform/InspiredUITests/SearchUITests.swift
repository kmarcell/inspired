import XCTest

final class SearchUITests: BaseUITestCase {
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        app.launchEnvironment["IS_UI_TEST"] = "YES"
        
        // Ensure we are logged in
        guard let password = ProcessInfo.processInfo.environment["TEST_USER_PASSWORD"] else {
            XCTFail("TEST_USER_PASSWORD environment variable is missing")
            return
        }
        app.launchArguments.append(contentsOf: ["-TEST_UID", "user_teacher_001", "-TEST_PWD", password])
    }
    
    func testSearchDiscoveryAndKeyword() throws {
        app.launch()
        
        // 1. Navigate to Search
        let searchButton = app.buttons["landing.searchButton"]
        XCTAssertTrue(searchButton.waitForExistence(timeout: 10))
        searchButton.tap()
        
        // 2. Verify Discovery Mode (Empty Query)
        XCTAssertTrue(app.staticTexts["search.discovery.header"].waitForExistence(timeout: 5))
        
        // 3. Search for "Askew"
        let searchField = app.textFields["search.textField"]
        XCTAssertTrue(searchField.exists)
        searchField.tap()
        searchField.typeText("Askew")
        
        // 4. Verify mixed results (Studio and Community)
        // Note: Using staticTexts for labels inside the tiles
        XCTAssertTrue(app.staticTexts["Askew Road Zen Den"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Askew"].exists) // Community name
        
        // 5. Clear and verify discovery returns
        app.buttons["search.cancelButton"].tap()
        XCTAssertFalse(app.staticTexts["search.discovery.header"].exists) // Should be dismissed
    }
    
    func testSearchPostcodePrefix() throws {
        app.launch()
        
        app.buttons["landing.searchButton"].tap()
        
        let searchField = app.textFields["search.textField"]
        XCTAssertTrue(searchField.waitForExistence(timeout: 5))
        searchField.tap()
        searchField.typeText("W6")
        
        // Verify W6 results (Hammersmith, Ravenscourt)
        XCTAssertTrue(app.staticTexts["Hammersmith"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ravenscourt Park Yoga"].exists)
    }
}
