import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Onboarding Snapshot Tests")
@MainActor
struct OnboardingSnapshotTests {
    
    @Test("Onboarding Snapshots", arguments: ["light", "dark"])
    func testOnboardingSnapshots(themeName: String) {
        let isDark = themeName == "dark"
        let store = Store(initialState: OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)
            .environment(\.colorScheme, isDark ? .dark : .light)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: themeName,
            record: false,
            testName: "OnboardingView"
        )
    }

    @Test("Onboarding Rate Limit Snapshots", arguments: ["light", "dark"])
    func testOnboardingRateLimitSnapshots(themeName: String) {
        let isDark = themeName == "dark"
        var state = OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")
        state.error = "onboarding.error.rateLimited"
        state.isRateLimited = true
        
        let store = Store(initialState: state) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)
            .environment(\.colorScheme, isDark ? .dark : .light)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: themeName,
            record: false,
            testName: "OnboardingRateLimitError"
        )
    }

    @Test("Onboarding Permission Denied Snapshots", arguments: ["light", "dark"])
    func testOnboardingPermissionDeniedSnapshots(themeName: String) {
        let isDark = themeName == "dark"
        var state = OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")
        state.error = "onboarding.error.permissionDenied"
        
        let store = Store(initialState: state) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)
            .environment(\.colorScheme, isDark ? .dark : .light)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: themeName,
            record: false,
            testName: "OnboardingPermissionDenied"
        )
    }
}
