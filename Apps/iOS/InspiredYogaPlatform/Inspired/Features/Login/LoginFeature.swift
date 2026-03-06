import ComposableArchitecture
import Foundation

@Reducer
public struct LoginFeature: Sendable {
    @ObservableState
    public struct State: Equatable {
        public var isLoading: Bool = false
        public var error: String? = nil
        public var user: User? = nil
        public var email: String = ""
        public var magicLinkSent: Bool = false
        public var cooldownRemaining: Int = 0
        
        public var isCooldownActive: Bool {
            cooldownRemaining > 0
        }

        public var isEmailValid: Bool {
            email.contains("@") && email.contains(".")
        }

        public init() {}
    }

    @CasePathable
    public enum Action: Sendable {
        case googleLoginButtonTapped
        case emailChanged(String)
        case sendMagicLinkTapped
        case sendMagicLinkResponse(Result<Void, Error>)
        case loginResponse(Result<User, Error>)
        case logoutButtonTapped
        case logoutResponse(Result<Void, Error>)
        case cooldownTick
    }

    @Dependency(\.authenticationClient) var authClient
    @Dependency(\.continuousClock) var clock

    public init() {}

    private enum CancelID: Hashable {
        case cooldown_timer
    }

    public var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .googleLoginButtonTapped:
                state.isLoading = true
                state.error = nil
                return .run { send in
                    await send(.loginResponse(Result { try await authClient.loginWithGoogle() }))
                }

            case let .emailChanged(email):
                state.email = email
                state.error = nil
                return .none

            case .sendMagicLinkTapped:
                guard state.isEmailValid else {
                    state.error = "login.error.invalidEmail"
                    return .none
                }
                guard !state.isCooldownActive else { return .none }
                
                state.isLoading = true
                state.error = nil
                return .run { [email = state.email] send in
                    await send(.sendMagicLinkResponse(Result { try await authClient.sendSignInLink(email) }))
                }

            case .sendMagicLinkResponse(.success):
                state.isLoading = false
                state.magicLinkSent = true
                state.cooldownRemaining = 60
                return .run { send in
                    for await _ in self.clock.timer(interval: .seconds(1)) {
                        await send(.cooldownTick)
                    }
                }
                .cancellable(id: CancelID.cooldown_timer)

            case .cooldownTick:
                state.cooldownRemaining -= 1
                if state.cooldownRemaining <= 0 {
                    state.cooldownRemaining = 0
                    return .cancel(id: CancelID.cooldown_timer)
                }
                return .none

            case let .sendMagicLinkResponse(.failure(error)):
                state.isLoading = false
                state.error = error.localizedDescription
                return .none

            case let .loginResponse(.success(user)):
                state.isLoading = false
                state.user = user
                return .none

            case let .loginResponse(.failure(error)):
                state.isLoading = false
                state.error = error.localizedDescription
                return .none

            case .logoutButtonTapped:
                state.isLoading = true
                return .run { send in
                    await send(.logoutResponse(Result { try await authClient.logout() }))
                }

            case .logoutResponse(.success):
                state.isLoading = false
                state.user = nil
                return .none

            case let .logoutResponse(.failure(error)):
                state.isLoading = false
                state.error = error.localizedDescription
                return .none
            }
        }
    }
}
