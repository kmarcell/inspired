import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Community Feed Snapshot Tests")
@MainActor
struct CommunityFeedSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

    @Test("Verify CommunityFeed Loading state", arguments: Theme.allCases)
    func testFeedLoading(theme: Theme) {
        var state = CommunityFeedFeature.State(user: .mock)
        state.isLoading = true
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }
        .environment(\.colorScheme, theme.colorScheme)
        .frame(width: 393)
        .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)
        vc.overrideUserInterfaceStyle = theme == .dark ? .dark : .light
        vc.view.backgroundColor = theme == .dark ? .black : .white

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "Feed_Loading"
        )
    }

    @Test("Verify CommunityFeed Empty state", arguments: Theme.allCases)
    func testFeedEmpty(theme: Theme) {
        var state = CommunityFeedFeature.State(user: .mock)
        state.isLoading = false
        state.isDiscoveryMode = false
        state.posts = []
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }
        .environment(\.colorScheme, theme.colorScheme)
        .frame(width: 393)
        .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)
        vc.overrideUserInterfaceStyle = theme == .dark ? .dark : .light
        vc.view.backgroundColor = theme == .dark ? .black : .white

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "Feed_Empty"
        )
    }

    @Test("Verify CommunityFeed with Data", arguments: Theme.allCases)
    func testFeedWithData(theme: Theme) {
        let mockPosts: [Post] = [.mock, .mockLong, .mockShort, .mock, .mockLong]
        
        var state = CommunityFeedFeature.State(user: .mock)
        state.posts = mockPosts
        state.isLoading = false
        
        let view = ScrollView {
            CommunityFeedView(store: Store(initialState: state) {
                CommunityFeedFeature()
            })
        }
        .environment(\.colorScheme, theme.colorScheme)
        .frame(width: 393)
        .background(Color.primaryBackground)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)
        vc.overrideUserInterfaceStyle = theme == .dark ? .dark : .light
        vc.view.backgroundColor = theme == .dark ? .black : .white

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "Feed_WithData"
        )
    }
}
