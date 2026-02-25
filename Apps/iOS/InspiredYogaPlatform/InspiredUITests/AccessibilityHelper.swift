import XCTest

extension XCUIApplication {
    func captureAccessibilityHierarchy(name: String) {
        let tree = self.debugDescription
        let screenshot = XCUIScreen.main.screenshot()
        
        // 1. Console Output (Fallback)
        print("--- ACCESSIBILITY HIERARCHY START: \(name) ---")
        print(tree)
        print("--- ACCESSIBILITY HIERARCHY END: \(name) ---")

        // 2. Host Filesystem Output (Primary for AI Analysis)
        if let projectPath = ProcessInfo.processInfo.environment["PROJECT_DIR"] {
            let accessibilityDir = URL(fileURLWithPath: projectPath).appendingPathComponent("Accessibility")
            
            print("📁 Accessibility Directory: \(accessibilityDir.path)")
            
            // Ensure directory exists
            do {
                try FileManager.default.createDirectory(at: accessibilityDir, withIntermediateDirectories: true)
                
                // Save Text Hierarchy
                let textURL = accessibilityDir.appendingPathComponent("\(name).txt")
                try tree.write(to: textURL, atomically: true, encoding: .utf8)
                print("📝 Saved hierarchy to: \(textURL.path)")
                
                // Save Screenshot
                let imageURL = accessibilityDir.appendingPathComponent("\(name).png")
                let data = screenshot.image.pngData()
                try data?.write(to: imageURL)
                print("📸 Saved screenshot to: \(imageURL.path) (Size: \(screenshot.image.size), Scale: \(screenshot.image.scale))")
            } catch {
                print("❌ Failed to save accessibility artifacts: \(error)")
            }
        } else {
            print("⚠️ PROJECT_DIR environment variable not set. Skipping file export.")
        }

        // 3. Keep as test attachments for Xcode UI / Fastlane Reports
        let treeAttachment = XCTAttachment(string: tree)
        treeAttachment.name = "\(name)_AccessibilityTree"
        treeAttachment.lifetime = .keepAlways
        
        let imageAttachment = XCTAttachment(screenshot: screenshot)
        imageAttachment.name = "\(name)_Screenshot"
        imageAttachment.lifetime = .keepAlways
        
        XCTContext.runActivity(named: "Capture Accessibility Data: \(name)") { activity in
            activity.add(treeAttachment)
            activity.add(imageAttachment)
        }
    }
}
