import Testing
import ComposableArchitecture
import Foundation
@testable import Inspired

@Suite("Authentication Client Tests")
struct AuthenticationTests {
    @Test("Verify mock user login")
    func testMockLogin() async throws {
        let client = withDependencies {
            $0.authenticationClient.loginWithGoogle = { .mock }
        } operation: {
            @Dependency(\.authenticationClient) var client
            return client
        }

        let user = try await client.loginWithGoogle()
        
        #expect(user.id == "user_maya_001")
        #expect(user.username == "yoga_maya#1001")
        #expect(user.isTeacher == true)
    }

    @Test("Verify current user status")
    func testCurrentUser() async throws {
        let client = withDependencies {
            $0.authenticationClient.currentUser = { .mock }
        } operation: {
            @Dependency(\.authenticationClient) var client
            return client
        }

        let user = try await client.currentUser()
        
        #expect(user?.id == "user_maya_001")
    }
}
