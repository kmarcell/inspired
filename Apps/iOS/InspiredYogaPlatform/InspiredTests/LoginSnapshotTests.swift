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
        let store = Store(initialState: LoginFeature.State()) {
            LoginFeature()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)
            .frame(width: 390, height: 844)
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
            named: theme.rawValue,
            record: false, // Disabling recording after update
            testName: "LoginView"
        )
    }

    @Test("Verify Magic Link Sent state", arguments: Theme.allCases)
    func testMagicLinkSent(theme: Theme) {
        var state = LoginFeature.State()
        state.magicLinkSent = true
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)
            .frame(width: 390, height: 844)
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
            named: theme.rawValue,
            record: false, // Disabling recording after update
            testName: "MagicLinkSent"
        )
    }
}
