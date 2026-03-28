import ComposableArchitecture
import Foundation

@Reducer
public struct SearchFeature {
    @ObservableState
    public struct State: Equatable {
        public var query = ""
        public var results: [SearchResult] = []
        public var suggestedCommunities: [Community] = []
        public var isLoading = false
        public var currentAreaPrefix: String
        public var error: String?
        
        public init(currentAreaPrefix: String) {
            self.currentAreaPrefix = currentAreaPrefix
        }
    }
    
    public enum Action: BindableAction, Equatable, Sendable {
        case binding(BindingAction<State>)
        case loadSuggestions
        case searchResponse(Result<[SearchResult], SearchError>)
        case resultTapped(SearchResult)
        case suggestionTapped(Community)
    }
    
    @Dependency(\.searchClient) var searchClient
    @Dependency(\.continuousClock) var clock
    
    public init() {}
    
    private enum CancelID { case search }
    
    public var body: some ReducerOf<Self> {
        BindingReducer()
        Reduce { state, action in
            switch action {
            case .loadSuggestions:
                guard state.query.isEmpty else { return .none }
                guard state.suggestedCommunities.isEmpty else { return .none }
                state.isLoading = true
                return .run { [prefix = state.currentAreaPrefix] send in
                    do {
                        let results = try await searchClient.search("", prefix)
                        await send(.searchResponse(.success(results)))
                    } catch {
                        await send(.searchResponse(.failure(.unknown(error.localizedDescription))))
                    }
                }
                
            case .binding(\.query):
                state.error = nil
                if state.query.isEmpty {
                    state.results = []
                    // Trigger discovery reload if empty
                    return .send(.loadSuggestions)
                }
                
                state.isLoading = true
                return .run { [query = state.query, prefix = state.currentAreaPrefix] send in
                    try await clock.sleep(for: .milliseconds(300))
                    do {
                        let results = try await searchClient.search(query, prefix)
                        await send(.searchResponse(.success(results)))
                    } catch {
                        await send(.searchResponse(.failure(.unknown(error.localizedDescription))))
                    }
                } catch: { _, _ in
                    // Cancellation from debounce
                }
                .cancellable(id: CancelID.search, cancelInFlight: true)
                
            case let .searchResponse(.success(results)):
                state.isLoading = false
                if state.query.isEmpty {
                    state.suggestedCommunities = results.compactMap { 
                        if case let .community(c) = $0 { return c }
                        return nil
                    }
                } else {
                    state.results = results
                }
                return .none
                
            case .searchResponse(.failure):
                state.isLoading = false
                state.error = "search.error.generic"
                return .none
                
            case .binding, .resultTapped, .suggestionTapped:
                return .none
            }
        }
    }
}
