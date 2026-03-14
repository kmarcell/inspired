import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Landing Page Snapshot Tests")
@MainActor
struct LandingPageSnapshotTests {
    enum Theme: String, CaseIterable {
        case light, dark
        var colorScheme: ColorScheme { self == .light ? .light : .dark }
    }

    @Test("Verify LandingPage Loading state", arguments: Theme.allCases)
    func testLandingPageLoading(theme: Theme) {
        let store = Store(initialState: LandingPageFeature.State(user: .mock)) {
            LandingPageFeature()
        } withDependencies: {
            $0.firestoreClient.fetchFeed = { _, _, _ in
                try await Task.sleep(nanoseconds: NSEC_PER_SEC * 10)
                return []
            }
        }

        let view = LandingPageView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)
        vc.overrideUserInterfaceStyle = theme == .dark ? .dark : .light
        vc.view.backgroundColor = theme == .dark ? .black : .white

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "LandingPage_Loading"
        )
    }

    @Test("Verify LandingPage with Feed data", arguments: Theme.allCases)
    func testLandingPageWithData(theme: Theme) {
        let mockPosts: [Post] = [.mock, .mockLong, .mockShort, .mock, .mockLong]
        var state = LandingPageFeature.State(user: .mock)
        state.feed.posts = mockPosts

        let store = Store(initialState: state) {
            LandingPageFeature()
        } withDependencies: {
            $0.firestoreClient.fetchFeed = { _, _, _ in mockPosts }
        }

        let view = LandingPageView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)
        vc.overrideUserInterfaceStyle = theme == .dark ? .dark : .light
        vc.view.backgroundColor = theme == .dark ? .black : .white

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "LandingPage_WithData"
        )
    }
}
