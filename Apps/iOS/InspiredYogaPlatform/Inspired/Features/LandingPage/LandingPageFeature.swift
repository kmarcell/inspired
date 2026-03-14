import ComposableArchitecture
import Foundation

@Reducer
public struct LandingPageFeature {
    @ObservableState
    public struct State: Equatable {
        public var user: User
        public var currentArea: String = "London"
        public var feed: CommunityFeedFeature.State
        
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
    }
    
    public init() {}
    
    public var body: some ReducerOf<Self> {
        Scope(state: \.feed, action: \.feed) {
            CommunityFeedFeature()
        }
        
        Reduce { state, action in
            switch action {
            case .profileButtonTapped:
                print("DEBUG: Profile button tapped")
                return .none
                
            case .searchButtonTapped:
                print("DEBUG: Search button tapped")
                return .none
                
            case .joinedCommunitiesButtonTapped:
                print("DEBUG: Joined Communities button tapped")
                return .none
                
            case .notificationsButtonTapped:
                print("DEBUG: Notifications button tapped")
                return .none
                
            case .createPostButtonTapped:
                print("DEBUG: Create Post button tapped")
                return .none
                
            case .feed:
                return .none
            }
        }
    }
}
