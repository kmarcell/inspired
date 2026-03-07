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

    @Test("Verify LandingPage layout", arguments: Theme.allCases)
    func testLandingPage(theme: Theme) {
        let store = Store(initialState: LandingPageFeature.State(user: .mock)) {
            LandingPageFeature()
        }
        let view = LandingPageView(store: store)
            .environment(\.colorScheme, theme.colorScheme)

        let vc = UIHostingController(rootView: view)
        vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size!)

        assertSnapshot(
            of: vc,
            as: .image(on: .iPhone16Pro),
            named: theme.rawValue,
            record: false,
            testName: "LandingPage"
        )
    }
}
