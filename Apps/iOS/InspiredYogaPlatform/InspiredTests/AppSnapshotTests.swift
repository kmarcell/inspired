import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("App Snapshot Tests")
@MainActor
struct AppSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

    static let iPhone16Pro = ViewImageConfig(
        safeArea: UIEdgeInsets(top: 62, left: 0, bottom: 34, right: 0),
        size: CGSize(width: 402, height: 874),
        traits: UITraitCollection { mutableTraits in
            mutableTraits.displayScale = 3
            mutableTraits.userInterfaceStyle = .light
        }
    )

    @Test("Verify Launching Splash Screen", arguments: Theme.allCases)
    func testLaunchingSplash(theme: Theme) {
        let store = withDependencies {
            $0.authenticationClient.currentUser = { .mock }
            $0.firestoreClient.fetchUserProfile = { _ in .mock }
        } operation: {
            Store(initialState: .launching) {
                AppFeature()
            }
        }
        let view = AppView(store: store)
            .environment(\.colorScheme, theme.colorScheme)
            .frame(width: 402, height: 874) // iPhone 16 Pro size
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 402, height: 874)

        assertSnapshot(
            of: vc,
            as: .image(on: AppSnapshotTests.iPhone16Pro),
            named: theme.rawValue,
            record: false, // Disabling recording after initial capture
            testName: "LaunchingSplash"
        )
    }

    @Test("Verify Authenticated Feedback Placeholder", arguments: Theme.allCases)
    func testAuthenticatedPlaceholder(theme: Theme) {
        let store = withDependencies {
            $0.authenticationClient.currentUser = { .mock }
            $0.firestoreClient.fetchUserProfile = { _ in .mock }
        } operation: {
            Store(initialState: .authenticated(.mock)) {
                AppFeature()
            }
        }
        let view = AppView(store: store)
            .environment(\.colorScheme, theme.colorScheme)
            .frame(width: 402, height: 874) // iPhone 16 Pro size
        
        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 402, height: 874)

        assertSnapshot(
            of: vc,
            as: .image(on: AppSnapshotTests.iPhone16Pro),
            named: theme.rawValue,
            record: false, // Disabling recording after initial capture
            testName: "AuthenticatedPlaceholder"
        )
    }
}
