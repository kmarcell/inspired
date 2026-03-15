import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Onboarding Snapshot Tests")
@MainActor
struct OnboardingSnapshotTests {
    
    @Test("Onboarding Snapshots", arguments: SnapshotTheme.allCases)
    func testOnboardingSnapshots(theme: SnapshotTheme) {
        let store = Store(initialState: OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "OnboardingView"
        )
    }

    @Test("Onboarding Rate Limit Snapshots", arguments: SnapshotTheme.allCases)
    func testOnboardingRateLimitSnapshots(theme: SnapshotTheme) {
        var state = OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")
        state.error = "onboarding.error.rateLimited"
        state.isRateLimited = true
        
        let store = Store(initialState: state) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "OnboardingRateLimitError"
        )
    }

    @Test("Onboarding Permission Denied Snapshots", arguments: SnapshotTheme.allCases)
    func testOnboardingPermissionDeniedSnapshots(theme: SnapshotTheme) {
        var state = OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")
        state.error = "onboarding.error.permissionDenied"
        
        let store = Store(initialState: state) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "OnboardingPermissionDenied"
        )
    }
}
