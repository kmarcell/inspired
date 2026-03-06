import ComposableArchitecture
import Testing
import Foundation
@testable import Inspired

@Suite("Login Feature Tests")
struct LoginFeatureTests {
    @Test("Test Google Login Success")
    @MainActor
    func testGoogleLoginSuccess() async {
        let store = TestStore(initialState: LoginFeature.State()) {
            LoginFeature()
        } withDependencies: {
            $0.authenticationClient.loginWithGoogle = { .mock }
        }

        await store.send(.googleLoginButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case .loginResponse(.success) = action {
                return true
            }
            return false
        } assert: {
            $0.isLoading = false
            $0.user = .mock
        }
    }

    @Test("Test Magic Link Flow with Cooldown")
    @MainActor
    func testMagicLinkFlowWithCooldown() async {
        let clock = TestClock()
        let store = TestStore(initialState: LoginFeature.State()) {
            LoginFeature()
        } withDependencies: {
            $0.authenticationClient.sendSignInLink = { _ in }
            $0.continuousClock = clock
        }

        await store.send(.emailChanged("test@example.com")) {
            $0.email = "test@example.com"
        }
        
        await store.send(.sendMagicLinkTapped) {
            $0.isLoading = true
        }
        
        await store.receive { action in
            if case .sendMagicLinkResponse(.success) = action { return true }
            return false
        } assert: {
            $0.isLoading = false
            $0.magicLinkSent = true
            $0.cooldownRemaining = 60
        }

        // Advance clock by 1 second
        await clock.advance(by: .seconds(1))
        await store.receive { action in
            if case .cooldownTick = action { return true }
            return false
        } assert: {
            $0.cooldownRemaining = 59
        }

        // Advance clock to finish cooldown
        await clock.advance(by: .seconds(59))
        await store.receive { action in
            if case .cooldownTick = action { return true }
            return false
        } assert: {
            $0.cooldownRemaining = 58
        }
        // Advance more to simulate full expiration
        for i in (0...57).reversed() {
            await clock.advance(by: .seconds(1))
            await store.receive { action in
                if case .cooldownTick = action { return true }
                return false
            } assert: {
                $0.cooldownRemaining = i
            }
        }
    }

    @Test("Test Magic Link Failure")
    @MainActor
    func testMagicLinkFailure() async {
        struct SendError: Error, LocalizedError {
            var errorDescription: String? { "Network Error" }
        }
        
        let store = TestStore(initialState: LoginFeature.State()) {
            LoginFeature()
        } withDependencies: {
            $0.authenticationClient.sendSignInLink = { _ in throw SendError() }
        }

        await store.send(.emailChanged("test@example.com")) {
            $0.email = "test@example.com"
        }
        await store.send(.sendMagicLinkTapped) {
            $0.isLoading = true
        }
        
        await store.receive { action in
            if case let .sendMagicLinkResponse(.failure(error)) = action {
                return error is SendError
            }
            return false
        } assert: {
            $0.isLoading = false
            $0.error = "Network Error"
        }
    }
}
