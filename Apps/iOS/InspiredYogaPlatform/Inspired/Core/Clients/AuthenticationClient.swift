import ComposableArchitecture
import Foundation

@DependencyClient
public struct AuthenticationClient: Sendable {
    public var currentUser: @Sendable () async throws -> User?
    public var loginWithGoogle: @Sendable () async throws -> User
    public var logout: @Sendable () async throws -> Void
    public var deleteAccount: @Sendable () async throws -> Void
}

extension AuthenticationClient: TestDependencyKey {
    public static let previewValue = Self(
        currentUser: { .mock },
        loginWithGoogle: { .mock },
        logout: { },
        deleteAccount: { }
    )

    public static let testValue = Self()
}

extension DependencyValues {
    public var authenticationClient: AuthenticationClient {
        get { self[AuthenticationClient.self] }
        set { self[AuthenticationClient.self] = newValue }
    }
}

// --- Mocks ---
extension User {
    public static let mock = User(
        id: "user_maya_001",
        username: "yoga_maya#1001",
        displayName: "Maya Sharma",
        bio: "Certified Vinyasa teacher.",
        lastSearchArea: "Askew",
        isTeacher: true,
        joinedCommunities: ["area_askew"]
    )
}
