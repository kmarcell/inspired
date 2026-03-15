import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Community Feed Snapshot Tests")
@MainActor
struct CommunityFeedSnapshotTests {

    @Test("Verify CommunityFeed Loading state", arguments: SnapshotTheme.allCases)
    func testFeedLoading(theme: SnapshotTheme) {
        var state = CommunityFeedFeature.State(user: .mock)
        state.isLoading = true
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_Loading"
        )
    }

    @Test("Verify CommunityFeed Empty state", arguments: SnapshotTheme.allCases)
    func testFeedEmpty(theme: SnapshotTheme) {
        var state = CommunityFeedFeature.State(user: .mock)
        state.isLoading = false
        state.isDiscoveryMode = false
        state.posts = []
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_Empty"
        )
    }

    @Test("Verify CommunityFeed with Data", arguments: SnapshotTheme.allCases)
    func testFeedWithData(theme: SnapshotTheme) {
        let mockPosts: [Post] = [.mock, .mockLong, .mockShort, .mock, .mockLong]
        
        var state = CommunityFeedFeature.State(user: .mock)
        state.posts = mockPosts
        state.isLoading = false
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_WithData"
        )
    }
}
