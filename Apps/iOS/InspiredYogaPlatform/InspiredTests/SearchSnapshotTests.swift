import ComposableArchitecture
import SnapshotTesting
import SwiftUI
import Testing
@testable import Inspired

@Suite("Search Snapshot Tests")
@MainActor
struct SearchSnapshotTests {
    
    @Test("Search Discovery Mode", arguments: SnapshotTheme.allCases)
    func testSearchDiscovery(theme: SnapshotTheme) {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.suggestedCommunities = [.mock, .mock2]
        
        let view = SearchView(
            store: Store(initialState: state) {
                SearchFeature()
            }
        )
        
        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Search_Discovery"
        )
    }
    
    @Test("Search Loading State", arguments: SnapshotTheme.allCases)
    func testSearchLoading(theme: SnapshotTheme) {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.query = "Yoga"
        state.isLoading = true
        
        let view = SearchView(
            store: Store(initialState: state) {
                SearchFeature()
            }
        )
        
        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Search_Loading"
        )
    }
    
    @Test("Search Results State", arguments: SnapshotTheme.allCases)
    func testSearchResults(theme: SnapshotTheme) {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.query = "Askew"
        state.results = [
            .studio(.mock),
            .community(.mock)
        ]
        
        let view = SearchView(
            store: Store(initialState: state) {
                SearchFeature()
            }
        )
        
        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Search_Results"
        )
    }
    
    @Test("Search No Results State", arguments: SnapshotTheme.allCases)
    func testSearchNoResults(theme: SnapshotTheme) {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.query = "NoMatchQuery"
        state.results = []
        state.suggestedCommunities = [.mock, .mock2]
        
        let view = SearchView(
            store: Store(initialState: state) {
                SearchFeature()
            }
        )
        
        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Search_NoResults"
        )
    }
    
    @Test("Search Error State", arguments: SnapshotTheme.allCases)
    func testSearchError(theme: SnapshotTheme) {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.query = "Yoga"
        state.error = "search.error.generic"
        
        let view = SearchView(
            store: Store(initialState: state) {
                SearchFeature()
            }
        )
        
        assertSnapshot(
            of: view,
            theme: theme,
            testName: "Search_Error"
        )
    }
}
