import XCTest

final class CommunityFeedUITests: BaseUITestCase {
    func testFeedAccessibility() throws {
        app.launchEnvironment["TEST_SCREEN"] = "Feed"
        app.launchEnvironment["PROJECT_DIR"] = ProcessInfo.processInfo.environment["PROJECT_DIR"]
        app.launch()
        
        // 1. Verify we are on the feed screen
        // Each tile is now a single accessibility element of type .button because of .onTapGesture
        let firstPost = app.buttons.matching(identifier: "feed.post.post_askew_001").firstMatch
        XCTAssertTrue(firstPost.waitForExistence(timeout: 5), "Feed should load with mocked data")
        
        // 2. Perform accessibility review
        app.captureAccessibilityHierarchy(name: "CommunityFeed_Live")
        
        // 3. Verify labels (consolidated via .combine)
        XCTAssertTrue(firstPost.label.contains("yoga_maya#1001"))
        XCTAssertTrue(firstPost.label.contains("Looking forward to seeing everyone at the Askew Zen Den tomorrow morning! 🧘‍♀️"))
        XCTAssertTrue(firstPost.label.contains("15 likes"))
    }
}
