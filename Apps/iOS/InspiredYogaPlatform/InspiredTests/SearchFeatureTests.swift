import ComposableArchitecture
import Testing
@testable import Inspired

@Suite("Search Feature Tests")
@MainActor
struct SearchFeatureTests {
    @Test("Discovery load on appear")
    func testLoadSuggestions() async {
        let store = TestStore(initialState: SearchFeature.State(currentAreaPrefix: "W12")) {
            SearchFeature()
        } withDependencies: {
            $0.searchClient.search = { query, prefix in
                #expect(query == "")
                #expect(prefix == "W12")
                return [.community(.mock)]
            }
        }
        
        await store.send(.loadSuggestions) {
            $0.isLoading = true
        }
        
        await store.receive({ action in
            if case .searchResponse(.success) = action { return true }
            return false
        }) {
            $0.isLoading = false
            $0.suggestedCommunities = [.mock]
        }
    }

    @Test("Discovery load caching")
    func testLoadSuggestionsCaching() async {
        var state = SearchFeature.State(currentAreaPrefix: "W12")
        state.suggestedCommunities = [.mock]
        
        let store = TestStore(initialState: state) {
            SearchFeature()
        } withDependencies: {
            $0.searchClient.search = { _, _ in
                Issue.record("searchClient.search should not be called when suggestions are cached")
                return []
            }
        }
        
        await store.send(.loadSuggestions)
        // Should return .none immediately, no state change
    }
    
    @Test("Search query debounce")
    func testSearchDebounce() async {
        let clock = TestClock()

        let store = TestStore(initialState: SearchFeature.State(currentAreaPrefix: "W12")) {
            SearchFeature()
        } withDependencies: {
            $0.searchClient.search = { query, _ in
                return [.studio(.mock)]
            }
            $0.continuousClock = clock
        }

        await store.send(.binding(.set(\.query, "Askew"))) {
            $0.query = "Askew"
            $0.isLoading = true
        }

        // Advance clock less than debounce
        await clock.advance(by: .milliseconds(100))

        // Change query again
        await store.send(.binding(.set(\.query, "Askew Road"))) {
            $0.query = "Askew Road"
        }

        // Advance clock to trigger search
        await clock.advance(by: .milliseconds(300))

        await store.receive({ action in
            if case .searchResponse(.success) = action { return true }
            return false
        }) {
            $0.isLoading = false
            $0.results = [.studio(.mock)]
        }
    }
}
