import Foundation
import ComposableArchitecture
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
}
