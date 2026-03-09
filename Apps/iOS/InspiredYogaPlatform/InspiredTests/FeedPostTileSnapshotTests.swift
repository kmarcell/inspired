import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Feed Post Tile Snapshot Tests")
@MainActor
struct FeedPostTileSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

    @Test("Verify FeedPostTile - Basic", arguments: Theme.allCases)
    func testFeedPostTileBasic(theme: Theme) {
        let view = FeedPostTile(post: .mock)
            .environment(\.colorScheme, theme.colorScheme)
            .padding()
            .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 393, height: 300)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "FeedPostTile_Basic"
        )
    }

    @Test("Verify FeedPostTile - Long Content", arguments: Theme.allCases)
    func testFeedPostTileLong(theme: Theme) {
        let view = FeedPostTile(post: .mockLong)
            .environment(\.colorScheme, theme.colorScheme)
            .padding()
            .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 393, height: 400)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "FeedPostTile_Long"
        )
    }

    @Test("Verify FeedPostTile - Short Content", arguments: Theme.allCases)
    func testFeedPostTileShort(theme: Theme) {
        let view = FeedPostTile(post: .mockShort)
            .environment(\.colorScheme, theme.colorScheme)
            .padding()
            .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(x: 0, y: 0, width: 393, height: 200)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "FeedPostTile_Short"
        )
    }
}
