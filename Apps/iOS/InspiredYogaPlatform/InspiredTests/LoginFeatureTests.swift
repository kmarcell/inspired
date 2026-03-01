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

    @Test("Test Magic Link Flow")
    @MainActor
    func testMagicLinkFlow() async {
        let store = TestStore(initialState: LoginFeature.State()) {
            LoginFeature()
        } withDependencies: {
            $0.authenticationClient.sendSignInLink = { email in
                #expect(email == "test@example.com")
            }
        }

        // 1. Invalid email
        await store.send(.emailChanged("invalid")) {
            $0.email = "invalid"
        }
        await store.send(.sendMagicLinkTapped) {
            $0.error = "Please enter a valid email address."
        }

        // 2. Valid email & Success
        await store.send(.emailChanged("test@example.com")) {
            $0.email = "test@example.com"
            $0.error = nil
        }
        await store.send(.sendMagicLinkTapped) {
            $0.isLoading = true
        }
        await store.receive { action in
            if case .sendMagicLinkResponse(.success) = action {
                return true
            }
            return false
        } assert: {
            $0.isLoading = false
            $0.magicLinkSent = true
        }
    }

    struct SendError: Error, LocalizedError {
        var errorDescription: String? { "Network Error" }
    }

    @Test("Test Magic Link Failure")
    @MainActor
    func testMagicLinkFailure() async {
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

    struct LoginError: Error, LocalizedError {
        var errorDescription: String? { "Login Failed" }
    }

    @Test("Test Google Login Failure")
    @MainActor
    func testGoogleLoginFailure() async {
        let store = TestStore(initialState: LoginFeature.State()) {
            LoginFeature()
        } withDependencies: {
            $0.authenticationClient.loginWithGoogle = { throw LoginError() }
        }

        await store.send(.googleLoginButtonTapped) {
            $0.isLoading = true
        }

        await store.receive { action in
            if case let .loginResponse(.failure(error)) = action {
                return error is LoginError
            }
            return false
        } assert: {
            $0.isLoading = false
            $0.error = "Login Failed"
        }
    }
}
