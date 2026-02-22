import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Login Snapshot Tests")
@MainActor
struct LoginSnapshotTests {
    enum Theme: String, CaseIterable {
        case light
        case dark
        
        var colorScheme: ColorScheme {
            self == .light ? .light : .dark
        }
    }

    @Test("Verify LoginView layout", arguments: Theme.allCases)
    func testLoginView(theme: Theme) {
        // isRecording = true // Enable this to record new snapshots
        let store = Store(initialState: LoginReducer.State()) {
            LoginReducer()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)
            .frame(width: 390, height: 844) // iPhone 13 Pro size
        
        // Use a wrapper to ensure background is rendered correctly for the theme
        let container = ZStack {
            theme.colorScheme == .light ? Color(UIColor.systemGroupedBackground) : Color.black
            view
        }
        .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: container)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
            named: theme.rawValue,
            record: false,
            testName: "LoginView"
        )
    }
}
