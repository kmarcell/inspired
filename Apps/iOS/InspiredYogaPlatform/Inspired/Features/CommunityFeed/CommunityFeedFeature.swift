import ComposableArchitecture
import Foundation

public enum FeedError: Error, Equatable, Sendable {
    case detectionFailed(String)
    case fetchFailed(String)
}

@Reducer
public struct CommunityFeedFeature {
    @ObservableState
    public struct State: Equatable {
        public var posts: [Post] = []
        public var suggestedCommunities: [Community] = []
        public var currentArea: String?
        public var isLoading: Bool = false
        public var error: String?
        public var isDiscoveryMode: Bool = false
        public var user: User
        
        public init(user: User) {
            self.user = user
        }
    }
    
    public enum Action: Equatable, Sendable {
        case refresh
        case areaDetected(Result<String, FeedError>)
        case fetchFeed(daysBack: Int)
        case feedResponse(Result<[Post], FeedError>, daysBack: Int)
        case fetchSuggestions
        case suggestionsResponse(Result<[Community], FeedError>)
        case postTapped(id: String)
    }
    
    @Dependency(\.firestoreClient) var firestoreClient
    
    public init() {}
    
    public var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .refresh:
                state.isLoading = true
                return .run { send in
                    await send(.areaDetected(Result { try await firestoreClient.detectNearestArea() }
                        .mapError { .detectionFailed($0.localizedDescription) }))
                }
                
            case let .areaDetected(.success(area)):
                state.currentArea = area
                return .send(.fetchFeed(daysBack: 30))
                
            case let .areaDetected(.failure(error)):
                if case let .detectionFailed(message) = error {
                    state.error = "Error detecting area: \(message)"
                }
                state.isLoading = false
                return .none
                
            case let .fetchFeed(daysBack):
                guard let area = state.currentArea else { return .none }
                state.isLoading = true
                return .run { [communities = state.user.joinedCommunities] send in
                    await send(.feedResponse(
                        Result { try await firestoreClient.fetchFeed(area, communities, daysBack) }
                            .mapError { .fetchFailed($0.localizedDescription) },
                        daysBack: daysBack
                    ))
                }
                
            case let .feedResponse(.success(posts), daysBack):
                if posts.isEmpty {
                    if daysBack == 30 {
                        // Tier 2: Try 6 months
                        return .send(.fetchFeed(daysBack: 180))
                    } else {
                        // Tier 3: Discovery Mode
                        state.isDiscoveryMode = true
                        return .send(.fetchSuggestions)
                    }
                }
                state.posts = posts
                state.isDiscoveryMode = false
                state.isLoading = false
                return .none
                
            case let .feedResponse(.failure(error), _):
                if case let .fetchFailed(message) = error {
                    state.error = message
                }
                state.isLoading = false
                return .none
                
            case .fetchSuggestions:
                guard let area = state.currentArea else { return .none }
                return .run { send in
                    await send(.suggestionsResponse(Result { try await firestoreClient.fetchSuggestedCommunities(area) }
                        .mapError { .fetchFailed($0.localizedDescription) }))
                }
                
            case let .suggestionsResponse(.success(communities)):
                state.suggestedCommunities = communities
                state.isLoading = false
                return .none
                
            case let .suggestionsResponse(.failure(error)):
                if case let .fetchFailed(message) = error {
                    state.error = message
                }
                state.isLoading = false
                return .none
                
            case .postTapped:
                return .none
            }
        }
    }
}
