import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Community Feed Snapshot Tests")
@MainActor
struct CommunityFeedSnapshotTests {

    @Test("Verify FeedLoadingView", arguments: SnapshotTheme.allCases)
    func testFeedLoadingView(theme: SnapshotTheme) {
        let view = List {
            FeedLoadingView()
        }
        .listStyle(.plain)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_Loading"
        )
    }

    @Test("Verify FeedDiscoveryView", arguments: SnapshotTheme.allCases)
    func testFeedDiscoveryView(theme: SnapshotTheme) {
        var state = CommunityFeedFeature.State(user: .mock)
        state.suggestedCommunities = .mocks
        
        let store = Store(initialState: state) {
            CommunityFeedFeature()
        }
        
        let view = List {
            FeedDiscoveryView(store: store)
        }
        .listStyle(.plain)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_Discovery"
        )
    }
    
    @Test("Verify FeedErrorView", arguments: SnapshotTheme.allCases)
    func testFeedErrorView(theme: SnapshotTheme) {
        let view = List {
            FeedErrorView(error: "Something went wrong")
        }
        .listStyle(.plain)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_Error"
        )
    }

    @Test("Verify CommunityFeed with Data", arguments: SnapshotTheme.allCases)
    func testFeedWithData(theme: SnapshotTheme) {
        let mockPosts: [Post] = [.mock, .mockLong, .mockShort, .mock, .mockLong]
        
        var state = CommunityFeedFeature.State(user: .mock)
        state.posts = mockPosts
        state.isLoading = false
        
        let view = List {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }
        .listStyle(.plain)

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Feed_WithData"
        )
    }
}
