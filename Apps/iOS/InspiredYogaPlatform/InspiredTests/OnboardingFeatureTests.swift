import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Onboarding Feature Tests")
@MainActor
struct OnboardingFeatureTests {
    
    @Test("Verify username generation")
    func testUsernameGeneration() async {
        let store = TestStore(initialState: OnboardingFeature.State(userId: "123")) {
            OnboardingFeature()
        }
        
        await store.send(.displayNameChanged("Maya Sharma")) {
            $0.displayName = "Maya Sharma"
            $0.proposedUsername = "maya_sharma#1234"
        }
    }

    @Test("Test Validation Success")
    func testValidationSuccess() async {
        let store = TestStore(initialState: OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")) {
            OnboardingFeature()
        } withDependencies: {
            $0.firestoreClient.validateDisplayName = { _ in true }
            $0.firestoreClient.createUserProfile = { _ in }
            $0.date.now = Date(timeIntervalSince1970: 1234567890)
        }

        await store.send(.confirmButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case .validationResponse(.success) = action { return true }
            return false
        }

        await store.receive { action in
            if case .createProfileResponse(.success) = action { return true }
            return false
        } assert: {
            $0.isLoading = false
        }
        
        await store.receive { action in
            if case .delegate(.profileCreated) = action { return true }
            return false
        }
    }

    @Test("Test Rate Limit Failure")
    func testRateLimitFailure() async {
        let clock = TestClock()
        let store = TestStore(initialState: OnboardingFeature.State(userId: "123", displayName: "BadName")) {
            OnboardingFeature()
        } withDependencies: {
            $0.firestoreClient.validateDisplayName = { _ in throw ProfileError.rateLimited }
            $0.continuousClock = clock
        }

        await store.send(.confirmButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case .validationResponse(.failure) = action { return true }
            return false
        } assert: {
            $0.isLoading = false
            $0.error = "onboarding.error.rateLimited"
            $0.isRateLimited = true
        }

        await clock.advance(by: .seconds(2))
        await store.receive { action in
            if case .rateLimitReset = action { return true }
            return false
        } assert: {
            $0.isRateLimited = false
        }
    }

    @Test("Onboarding Snapshots", arguments: ["light", "dark"])
    func testOnboardingSnapshots(themeName: String) {
        let isDark = themeName == "dark"
        let store = Store(initialState: OnboardingFeature.State(userId: "123", displayName: "Maya Sharma")) {
            OnboardingFeature()
        }
        let view = OnboardingView(store: store)
            .environment(\.colorScheme, isDark ? .dark : .light)
            .frame(width: 390, height: 844)
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
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
            .frame(width: 390, height: 844)
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
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
            .frame(width: 390, height: 844)
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone13Pro),
            named: themeName,
            record: false, // Capturing permission denied
            testName: "OnboardingPermissionDenied"
        )
    }
}
