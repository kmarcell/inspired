import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Login Snapshot Tests")
@MainActor
struct LoginSnapshotTests {

    @Test("Verify LoginView layout", arguments: SnapshotTheme.allCases)
    func testLoginView(theme: SnapshotTheme) {
        let store = Store(initialState: LoginFeature.State()) {
            LoginFeature()
        }
        let view = LoginView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "LoginView"
        )
    }

    @Test("Verify Magic Link Sent state", arguments: SnapshotTheme.allCases)
    func testMagicLinkSent(theme: SnapshotTheme) {
        var state = LoginFeature.State()
        state.magicLinkSent = true
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "MagicLinkSent"
        )
    }

    @Test("Verify Magic Link Cooldown state", arguments: SnapshotTheme.allCases)
    func testMagicLinkCooldown(theme: SnapshotTheme) {
        var state = LoginFeature.State()
        state.magicLinkSent = true
        state.cooldownRemaining = 45
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "MagicLinkCooldown"
        )
    }

    @Test("Verify Rate Limit error state", arguments: SnapshotTheme.allCases)
    func testRateLimitError(theme: SnapshotTheme) {
        var state = LoginFeature.State()
        state.error = "login.error.tooManyRequests"
        let store = Store(initialState: state) {
            LoginFeature()
        }
        let view = LoginView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "RateLimitError"
        )
    }
}
