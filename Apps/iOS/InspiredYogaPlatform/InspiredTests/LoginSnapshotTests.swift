import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Login Snapshot Tests")
@MainActor
struct LoginSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

    @Test("Verify LoginView layout", arguments: Theme.allCases)
    func testLoginView(theme: Theme) {
        let store = Store(initialState: LoginFeature.State()) {
            LoginFeature()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
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

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "MagicLinkSent"
        )
    }

    @Test("Verify Magic Link Cooldown state", arguments: Theme.allCases)
    func testMagicLinkCooldown(theme: Theme) {
        var state = LoginFeature.State()
        state.magicLinkSent = true
        state.cooldownRemaining = 45
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "MagicLinkCooldown"
        )
    }

    @Test("Verify Rate Limit error state", arguments: Theme.allCases)
    func testRateLimitError(theme: Theme) {
        var state = LoginFeature.State()
        state.error = "login.error.tooManyRequests"
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "RateLimitError"
        )
    }
}
