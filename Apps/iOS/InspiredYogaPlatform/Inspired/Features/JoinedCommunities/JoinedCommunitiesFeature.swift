import ComposableArchitecture
import Foundation

@Reducer
public struct JoinedCommunitiesFeature {
    @ObservableState
    public struct State: Equatable, Sendable {
        public var joinedCommunities: [Community] = []
        public var suggestedCommunities: [Community] = []
        public var isLoading = false
        public var error: String?
        public var user: User
        
        public init(user: User) {
            self.user = user
        }
    }
    
    public enum Action: Equatable, Sendable {
        case onAppear
        case fetchJoinedResponse(Result<[Community], JoinedCommunitiesError>)
        case fetchSuggestionsResponse(Result<[Community], JoinedCommunitiesError>)
        case exploreButtonTapped
        case communityTapped(Community)
        case unjoinTapped(Community)
        case confirmUnjoin(Community)
    }
    
    public enum JoinedCommunitiesError: Error, Equatable, Sendable {
        case fetchFailed(String)
    }
    
    @Dependency(\.firestoreClient) var firestoreClient
    
    public init() {}
    
    public var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .onAppear:
                state.isLoading = true
                return .run { send in
                    // In a real app, we might fetch communities by ID
                    // For now, we use the user's joined list
                    // Logic for fetching details would go here
                    await send(.fetchJoinedResponse(.success([]))) // Placeholder
                }
                
            case .fetchJoinedResponse(.success(let communities)):
                state.joinedCommunities = communities
                if communities.isEmpty {
                    return .run { send in
                        // Fetch suggestions if joined is empty
                        // Placeholder area prefix
                        await send(.fetchSuggestionsResponse(Result { try await firestoreClient.fetchSuggestedCommunities("W12") }
                            .mapError { .fetchFailed($0.localizedDescription) }))
                    }
                }
                state.isLoading = false
                return .none
                
            case .fetchSuggestionsResponse(.success(let communities)):
                state.suggestedCommunities = communities
                state.isLoading = false
                return .none
                
            case .fetchJoinedResponse(.failure(let error)), .fetchSuggestionsResponse(.failure(let error)):
                if case let .fetchFailed(message) = error {
                    state.error = message
                }
                state.isLoading = false
                return .none
                
            case .exploreButtonTapped, .communityTapped, .unjoinTapped, .confirmUnjoin:
                return .none
            }
        }
    }
}
