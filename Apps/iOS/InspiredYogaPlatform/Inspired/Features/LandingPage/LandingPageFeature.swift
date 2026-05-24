import ComposableArchitecture
import Foundation

@Reducer
public struct LandingPageFeature {
    @ObservableState
    public struct State: Equatable {
        public var user: User
        public var currentArea: String = "London"
        public var feed: CommunityFeedFeature.State
        @Presents public var search: SearchFeature.State?
        public var path = StackState<Path.State>()
        
        public init(user: User) {
            self.user = user
            self.feed = .init(user: user)
        }
    }
    
    public enum Action: Equatable, Sendable {
        case profileButtonTapped
        case searchButtonTapped
        case joinedCommunitiesButtonTapped
        case notificationsButtonTapped
        case createPostButtonTapped
        case feed(CommunityFeedFeature.Action)
        case search(PresentationAction<SearchFeature.Action>)
        case path(StackAction<Path.State, Path.Action>)
    }
    
    public init() {}
    
    public var body: some ReducerOf<Self> {
        Scope(state: \.feed, action: \.feed) {
            CommunityFeedFeature()
        }
        .ifLet(\.$search, action: \.search) {
            SearchFeature()
        }
        
        Reduce { state, action in
            switch action {
            case .profileButtonTapped:
                print("DEBUG: Profile button tapped")
                return .none
                
            case .searchButtonTapped:
                // Use location_prefix if available, otherwise fallback to "W12" for mock
                state.search = SearchFeature.State(currentAreaPrefix: state.user.lastSearchArea ?? "W12")
                return .send(.search(.presented(.loadSuggestions)))
                
            case .search:
                return .none
                
            case .joinedCommunitiesButtonTapped:
                state.path.append(.joinedCommunities(.init(user: state.user)))
                return .none
                
            case .notificationsButtonTapped:
                print("DEBUG: Notifications button tapped")
                return .none
                
            case .createPostButtonTapped:
                print("DEBUG: Create Post button tapped")
                return .none
                
            case .feed:
                return .none
                
            case .path(.element(id: _, action: .joinedCommunities(.exploreButtonTapped))):
                state.path.removeAll()
                return .send(.searchButtonTapped)
                
            case .path:
                return .none
            }
        }
        .forEach(\.path, action: \.path)
    }
}

extension LandingPageFeature {
    @Reducer
    public enum Path {
        case joinedCommunities(JoinedCommunitiesFeature)
    }
}

extension LandingPageFeature.Path.State: Equatable, Sendable {}
extension LandingPageFeature.Path.Action: Equatable, Sendable {}
