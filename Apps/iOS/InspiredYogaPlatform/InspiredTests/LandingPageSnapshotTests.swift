import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Landing Page Snapshot Tests")
@MainActor
struct LandingPageSnapshotTests {

    @Test("Verify LandingPage Loading state", arguments: SnapshotTheme.allCases)
    func testLandingPageLoading(theme: SnapshotTheme) {
        var state = LandingPageFeature.State(user: .mock)
        state.feed.isLoading = true
        
        let store = Store(initialState: state) {
            LandingPageFeature()
        } withDependencies: {
            $0.firestoreClient.fetchFeed = { _, _, _ in
                try await Task.sleep(nanoseconds: NSEC_PER_SEC * 10)
                return []
            }
        }

        let view = LandingPageView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "LandingPage_Loading"
        )
    }

    @Test("Verify LandingPage with Feed data", arguments: SnapshotTheme.allCases)
    func testLandingPageWithData(theme: SnapshotTheme) {
        let mockPosts: [Post] = [.mock, .mockLong, .mockShort, .mock, .mockLong]
        var state = LandingPageFeature.State(user: .mock)
        state.feed.posts = mockPosts
        state.feed.isLoading = false

        let store = Store(initialState: state) {
            LandingPageFeature()
        } withDependencies: {
            $0.firestoreClient.fetchFeed = { _, _, _ in mockPosts }
        }

        let view = LandingPageView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "LandingPage_WithData"
        )
    }

    @Test("Verify LandingPage Discovery mode", arguments: SnapshotTheme.allCases)
    func testLandingPageDiscovery(theme: SnapshotTheme) {
        var state = LandingPageFeature.State(user: .mock)
        state.feed.posts = []
        state.feed.isLoading = false
        state.feed.isDiscoveryMode = true
        state.feed.suggestedCommunities = .mocks

        let store = Store(initialState: state) {
            LandingPageFeature()
        }

        let view = LandingPageView(store: store)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "LandingPage_Discovery"
        )
    }
}
