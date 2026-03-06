import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Onboarding Feature Tests")
@MainActor
struct OnboardingFeatureTests {
    
    @Test("Verify username generation logic")
    func testUsernameGeneration() {
        let state = OnboardingFeature.State(userId: "123", displayName: "Jane Doe")
        #expect(state.proposedUsername == "jane_doe#1234")
    }

    @Test("Test Onboarding Success Flow")
    func testOnboardingSuccess() async {
        let staticDate = Date(timeIntervalSince1970: 1234567890)
        let store = TestStore(initialState: OnboardingFeature.State(userId: "user_123")) {
            OnboardingFeature()
        } withDependencies: {
            $0.firestoreClient.validateDisplayName = { _ in true }
            $0.firestoreClient.createUserProfile = { _ in }
            $0.date.now = staticDate
        }

        await store.send(.displayNameChanged("Jane Doe")) {
            $0.displayName = "Jane Doe"
            $0.proposedUsername = "jane_doe#1234"
        }

        await store.send(.confirmButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case let .validationResponse(.success(isValid)) = action { return isValid == true }
            return false
        }

        await store.receive { action in
            if case .createProfileResponse(.success) = action { return true }
            return false
        } assert: {
            $0.isLoading = false
        }

        await store.receive { action in
            if case let .delegate(.profileCreated(user)) = action { 
                return user.id == "user_123" && user.createdAt == staticDate
            }
            return false
        }
    }

    @Test("Test Validation Failure")
    func testValidationFailure() async {
        let store = TestStore(initialState: OnboardingFeature.State(userId: "user_123", displayName: "BadName")) {
            OnboardingFeature()
        } withDependencies: {
            $0.firestoreClient.validateDisplayName = { _ in false }
        }

        await store.send(.confirmButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case let .validationResponse(.success(isValid)) = action { return isValid == false }
            return false
        } assert: {
            $0.isLoading = false
            $0.error = "Please choose a more inspired name."
        }
    }

    // --- Snapshots ---

    @Test("Onboarding Snapshots", arguments: ["light", "dark"])
    func testOnboardingSnapshots(themeName: String) {
        let isDark = themeName == "dark"
        let store = Store(initialState: OnboardingFeature.State(userId: "123", displayName: "Jane Doe")) {
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
            record: false, // Finalized with all labels
            testName: "OnboardingView"
        )
    }
}
