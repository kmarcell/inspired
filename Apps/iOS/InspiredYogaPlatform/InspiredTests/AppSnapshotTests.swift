import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
import UIKit
@testable import Inspired

@Suite("App Snapshot Tests")
@MainActor
struct AppSnapshotTests {

    @Test("Verify Launching Splash Screen", arguments: SnapshotTheme.allCases)
    func testLaunchingSplash(theme: SnapshotTheme) {
        let store = withDependencies {
            $0.authenticationClient.currentUser = { .mock }
            $0.firestoreClient.fetchUserProfile = { _ in .mock }
        } operation: {
            Store(initialState: .launching) {
                AppFeature()
            }
        }
        let view = AppView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "LaunchingSplash"
        )
    }
}
