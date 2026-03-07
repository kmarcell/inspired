import ComposableArchitecture
import Foundation

@Reducer
public struct OnboardingFeature: Sendable {
    @ObservableState
    public struct State: Equatable {
        public var userId: String
        public var displayName: String = ""
        public var proposedUsername: String = ""
        public var isLoading: Bool = false
        public var isRateLimited: Bool = false
        public var error: String? = nil
        
        public init(userId: String, displayName: String = "") {
            self.userId = userId
            self.displayName = displayName
            self.proposedUsername = "\(displayName.isEmpty ? "username" : displayName.lowercased().replacingOccurrences(of: " ", with: "_"))#1234"
        }
    }

    public enum Action: Sendable {
        case displayNameChanged(String)
        case confirmButtonTapped
        case validationResponse(Result<Bool, Error>)
        case createProfileResponse(Result<User, Error>)
        case rateLimitReset
        case delegate(Delegate)
        
        public enum Delegate: Sendable {
            case profileCreated(User)
        }
    }

    @Dependency(\.firestoreClient) var firestoreClient
    @Dependency(\.continuousClock) var clock

    public init() {}

    public var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case let .displayNameChanged(name):
                state.displayName = name
                state.proposedUsername = "\(name.isEmpty ? "username" : name.lowercased().replacingOccurrences(of: " ", with: "_"))#1234"
                state.error = nil
                return .none

            case .confirmButtonTapped:
                guard state.displayName.count >= 2 else {
                    state.error = "Display name must be at least 2 characters."
                    return .none
                }
                state.isLoading = true
                state.error = nil
                return .run { [name = state.displayName] send in
                    await send(.validationResponse(Result { try await firestoreClient.validateDisplayName(name) }))
                }

            case let .validationResponse(.success(isValid)):
                if isValid {
                    @Dependency(\.date.now) var now
                    let newUser = User(
                        id: state.userId,
                        username: state.proposedUsername,
                        displayName: state.displayName,
                        joinedCommunities: [],
                        privacySettings: .init(isProfilePublic: false, avatarPrivacy: .groupsOnly),
                        createdAt: now,
                        updatedAt: now
                    )
                    return .run { send in
                        await send(.createProfileResponse(Result {
                            try await firestoreClient.createUserProfile(newUser)
                            return newUser
                        }))
                    }
                }
                return .none

            case let .validationResponse(.failure(error)):
                state.isLoading = false
                if let profileError = error as? ProfileError {
                    switch profileError {
                    case let .invalidName(reason):
                        state.error = reason
                    case .rateLimited:
                        state.error = "onboarding.error.rateLimited"
                        state.isRateLimited = true
                        return .run { send in
                            try await self.clock.sleep(for: .seconds(2))
                            await send(.rateLimitReset)
                        }
                    case .permissionDenied:
                        state.error = "onboarding.error.permissionDenied"
                    default:
                        state.error = error.localizedDescription
                    }
                } else {
                    state.error = error.localizedDescription
                }
                return .none

            case .rateLimitReset:
                state.isRateLimited = false
                return .none

            case let .createProfileResponse(.success(user)):
                state.isLoading = false
                return .send(.delegate(.profileCreated(user)))

            case let .createProfileResponse(.failure(error)):
                state.isLoading = false
                state.error = error.localizedDescription
                return .none
                
            case .delegate:
                return .none
            }
        }
    }
}
