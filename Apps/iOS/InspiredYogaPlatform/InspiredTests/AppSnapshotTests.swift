import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
import UIKit
@testable import Inspired

@Suite("App Snapshot Tests")
@MainActor
struct AppSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

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

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
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

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "AuthenticatedPlaceholder"
        )
    }
}
