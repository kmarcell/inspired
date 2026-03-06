import XCTest

class BaseUITestCase: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        // If the test failed, capture the state for debugging
        if let lastRun = testRun, lastRun.failureCount > 0 {
            let screenshotName = "FAILURE_\(self.name.replacingOccurrences(of: " ", with: "_"))"
            app.captureAccessibilityHierarchy(name: screenshotName)
        }
        try super.tearDownWithError()
    }
}
