import ComposableArchitecture
import Foundation
import GoogleSignIn
import UIKit

@DependencyClient
public struct GoogleSignInClient: Sendable {
    public struct Tokens: Equatable, Sendable {
        public let idToken: String
        public let accessToken: String
    }
    
    public var signIn: @Sendable () async throws -> Tokens
    public var signOut: @Sendable () -> Void = { 
        Task { @MainActor in
            GIDSignIn.sharedInstance.signOut()
        }
    }
}

extension GoogleSignInClient: DependencyKey {
    public static let liveValue = Self(
        signIn: {
            // Get the top view controller on the main actor
            let topVC = await MainActor.run {
                topViewController()
            }
            
            guard let topVC = topVC else {
                throw GoogleSignInError.missingPresentingViewController
            }
            
            // signIn(withPresenting:) must be called on the Main Actor
            // We return the result from the MainActor block
            let result = try await signInOnMain(presenting: topVC)

            guard let idToken = result.user.idToken?.tokenString else {
                throw GoogleSignInError.missingIDToken
            }
            
            return Tokens(
                idToken: idToken,
                accessToken: result.user.accessToken.tokenString
            )
        },
        signOut: {
            GIDSignIn.sharedInstance.signOut()
        }
    )
}

public enum GoogleSignInError: Error, LocalizedError {
    case missingPresentingViewController
    case missingIDToken
    
    public var errorDescription: String? {
        switch self {
        case .missingPresentingViewController: return "Could not find a view to present the login screen."
        case .missingIDToken: return "Failed to retrieve the Google ID Token."
        }
    }
}

extension GoogleSignInClient: TestDependencyKey {
    public static let previewValue = Self(
        signIn: { Tokens(idToken: "mock_id", accessToken: "mock_access") },
        signOut: { }
    )
    public static let testValue = Self()
}

extension DependencyValues {
    public var googleSignInClient: GoogleSignInClient {
        get { self[GoogleSignInClient.self] }
        set { self[GoogleSignInClient.self] = newValue }
    }
}

// --- UIKit Helper (Contained Here) ---

@MainActor
private func signInOnMain(presenting: UIViewController) async throws -> GIDSignInResult {
    try await GIDSignIn.sharedInstance.signIn(withPresenting: presenting)
}

@MainActor
private func topViewController(controller: UIViewController? = nil) -> UIViewController? {
    let controller = controller ?? UIApplication.shared.connectedScenes
        .filter { $0.activationState == .foregroundActive }
        .compactMap { $0 as? UIWindowScene }
        .first?.windows
        .filter { $0.isKeyWindow }
        .first?.rootViewController
    
    if let navigationController = controller as? UINavigationController {
        return topViewController(controller: navigationController.visibleViewController)
    }
    if let tabController = controller as? UITabBarController {
        if let selected = tabController.selectedViewController {
            return topViewController(controller: selected)
        }
    }
    if let presented = controller?.presentedViewController {
        return topViewController(controller: presented)
    }
    return controller
}
