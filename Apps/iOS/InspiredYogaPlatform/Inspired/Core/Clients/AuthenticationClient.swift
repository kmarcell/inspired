import ComposableArchitecture
import Foundation
import FirebaseAuth

@DependencyClient
public struct AuthenticationClient: Sendable {
    public var currentUser: @Sendable () async throws -> User?
    public var loginWithGoogle: @Sendable () async throws -> User
    public var sendSignInLink: @Sendable (_ email: String) async throws -> Void
    public var signInWithLink: @Sendable (_ email: String, _ link: String) async throws -> User
    public var logout: @Sendable () async throws -> Void
    public var deleteAccount: @Sendable () async throws -> Void
}

extension AuthenticationClient: DependencyKey {
    public static let liveValue = Self(
        currentUser: {
            guard let firebaseUser = Auth.auth().currentUser else { return nil }
            return User(
                id: firebaseUser.uid,
                username: firebaseUser.email ?? "unknown",
                displayName: firebaseUser.displayName,
                bio: nil,
                lastSearchArea: nil,
                joinedCommunities: []
            )
        },
        loginWithGoogle: {
            // Placeholder for real Google Login dance
            return .mock
        },
        sendSignInLink: { email in
            let actionCodeSettings = ActionCodeSettings()
            actionCodeSettings.url = URL(string: "https://inspired-yoga.web.app/finishSignUp")
            actionCodeSettings.handleCodeInApp = true
            actionCodeSettings.setIOSBundleID(Bundle.main.bundleIdentifier!)
            
            try await Auth.auth().sendSignInLink(toEmail: email, actionCodeSettings: actionCodeSettings)
        },
        signInWithLink: { email, link in
            let result = try await Auth.auth().signIn(withEmail: email, link: link)
            // If it's a new user, result.user will have a UID but Firestore won't have a profile yet.
            // The AppFeature will handle the routing to onboarding.
            return User(
                id: result.user.uid,
                username: result.user.email ?? "unknown",
                displayName: result.user.displayName,
                joinedCommunities: []
            )
        },
        logout: {
            try Auth.auth().signOut()
        },
        deleteAccount: {
            try await Auth.auth().currentUser?.delete()
        }
    )
}

extension AuthenticationClient: TestDependencyKey {
    public static let previewValue = Self(
        currentUser: { .mock },
        loginWithGoogle: { .mock },
        sendSignInLink: { _ in },
        signInWithLink: { _, _ in .mock },
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
        id: "user_teacher_001",
        username: "yoga_maya#1001",
        displayName: "Maya Sharma",
        bio: "Certified Vinyasa teacher.",
        lastSearchArea: "Askew",
        joinedCommunities: ["area_askew"],
        privacySettings: .init(isProfilePublic: true, avatarPrivacy: .public)
    )
}
