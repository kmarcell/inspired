import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Feed Post Tile Snapshot Tests")
@MainActor
struct FeedPostTileSnapshotTests {

    @Test("Verify FeedPostTile - Basic", arguments: SnapshotTheme.allCases)
    func testFeedPostTileBasic(theme: SnapshotTheme) {
        let view = FeedPostTile(post: .mock)
            .padding()

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "FeedPostTile_Basic"
        )
    }

    @Test("Verify FeedPostTile - Long Content", arguments: SnapshotTheme.allCases)
    func testFeedPostTileLong(theme: SnapshotTheme) {
        let view = FeedPostTile(post: .mockLong)
            .padding()

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "FeedPostTile_Long"
        )
    }

    @Test("Verify FeedPostTile - Short Content", arguments: SnapshotTheme.allCases)
    func testFeedPostTileShort(theme: SnapshotTheme) {
        let view = FeedPostTile(post: .mockShort)
            .padding()

        assertSnapshot(
            of: view,
            theme: theme,
            testName: "FeedPostTile_Short"
        )
    }
}
