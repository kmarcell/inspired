import ComposableArchitecture
import Foundation

@Reducer
public struct LandingPageFeature {
    @ObservableState
    public struct State: Equatable {
        public var user: User
        public var currentArea: String = "London"
        
        public init(user: User) {
            self.user = user
        }
    }
    
    public enum Action: Equatable {
        case profileButtonTapped
        case searchButtonTapped
        case joinedCommunitiesButtonTapped
        case notificationsButtonTapped
        case createPostButtonTapped
    }
    
    public init() {}
    
    public var body: some ReducerOf<Self> {
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
            }
        }
    }
}
