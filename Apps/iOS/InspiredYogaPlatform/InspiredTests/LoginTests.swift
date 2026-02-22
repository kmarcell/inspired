import ComposableArchitecture
import Testing
import Foundation
@testable import Inspired

@Suite("Login Reducer Tests")
struct LoginTests {
    @Test("Test Google Login Success")
    @MainActor
    func testGoogleLoginSuccess() async {
        let store = TestStore(initialState: LoginReducer.State()) {
            LoginReducer()
        } withDependencies: {
            $0.authenticationClient.loginWithGoogle = { .mock }
        }

        await store.send(.googleLoginButtonTapped) {
            $0.isLoading = true
        }

        await store.receive(\.loginResponse.success) {
            $0.isLoading = false
            $0.user = .mock
        }
    }

    @Test("Test Google Login Failure")
    @MainActor
    func testGoogleLoginFailure() async {
        struct LoginError: Error, LocalizedError {
            var errorDescription: String? { "Login Failed" }
        }
        let store = TestStore(initialState: LoginReducer.State()) {
            LoginReducer()
        } withDependencies: {
            $0.authenticationClient.loginWithGoogle = { throw LoginError() }
        }

        await store.send(.googleLoginButtonTapped) {
            $0.isLoading = true
        }

        await store.receive(\.loginResponse.failure) {
            $0.isLoading = false
            $0.error = "Login Failed"
        }
    }
}
