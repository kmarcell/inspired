import ComposableArchitecture
import SwiftUI
import FirebaseAuth

@Reducer
public struct AppFeature: Sendable {
    @ObservableState
    public enum State: Equatable {
        case launching
        case login(LoginReducer.State)
        case authenticated(User)

        public init() {
            self = .launching
        }
    }

    public enum Action: Sendable {
        case appLaunched
        case login(LoginReducer.Action)
        case currentUserResponse(Result<User?, Error>)
        case userProfileResponse(Result<User, Error>)
    }

    @Dependency(\.authenticationClient) var authClient
    @Dependency(\.firestoreClient) var firestoreClient

    public init() {}

    public var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .appLaunched:
                #if DEBUG
                if let forcedUserId = TestConfiguration.forcedUserId {
                    return .run { send in
                        do {
                            // Sign in to Auth Emulator first to satisfy Firestore Rules
                            try await Auth.auth().signIn(withEmail: "\(forcedUserId)@inspired.test", password: "password123")
                            let profile = try await firestoreClient.fetchUserProfile(forcedUserId)
                            await send(.userProfileResponse(.success(profile)))
                        } catch {
                            print("❌ Forced auth/profile failed: \(error)")
                            await send(.userProfileResponse(.failure(error)))
                        }
                    }
                }
                #endif
                
                return .run { send in
                    await send(.currentUserResponse(Result { try await authClient.currentUser() }))
                }

            case let .currentUserResponse(.success(.some(user))):
                // Identity exists, fetch full profile
                return .run { send in
                    await send(.userProfileResponse(Result { try await firestoreClient.fetchUserProfile(user.id) }))
                }

            case .currentUserResponse(.success(.none)):
                state = .login(LoginReducer.State())
                return .none

            case let .currentUserResponse(.failure(error)):
                print("❌ Auth check failed: \(error)")
                state = .login(LoginReducer.State())
                return .none

            case let .userProfileResponse(.success(user)):
                state = .authenticated(user)
                return .none

            case let .userProfileResponse(.failure(error)):
                print("❌ Profile fetch failed: \(error)")
                state = .login(LoginReducer.State())
                return .none

            case .login(.loginResponse(.success(let user))):
                state = .authenticated(user)
                return .none

            case .login:
                return .none
            }
        }
        .ifCaseLet(\.login, action: \.login) {
            LoginReducer()
        }
    }
}

public struct AppView: View {
    let store: StoreOf<AppFeature>

    public init(store: StoreOf<AppFeature>) {
        self.store = store
    }

    public var body: some View {
        Group {
            switch store.state {
            case .launching:
                LaunchView()
            case .login:
                if let loginStore = store.scope(state: \.login, action: \.login) {
                    LoginView(store: loginStore)
                }
            case .authenticated(let user):
                AuthenticatedPlaceholderView(user: user)
            }
        }
        .task {
            store.send(.appLaunched)
        }
    }
}

// --- Supporting Views ---

struct LaunchView: View {
    var body: some View {
        ZStack {
            Color.primaryBackground.ignoresSafeArea()
            
            VStack(spacing: 24) {
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color.secondary.opacity(0.2))
                    .frame(width: 120, height: 120)
                    .overlay(
                        Text("LOGO")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    )
                
                CircularLoaderView(configuration: .init(
                    radius: 40,
                    strokeWidth: 4,
                    strokeColor: .primaryText,
                    animationDuration: 1.0,
                    rotationDuration: 2.0
                ))
            }
        }
    }
}

struct AuthenticatedPlaceholderView: View {
    let user: User
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Welcome, \(user.displayName ?? user.username)!")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("This is the Community Feed (Placeholder)")
                    .foregroundColor(.secondaryText)
                
                Image(systemName: "person.3.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.accentColor)
            }
            .navigationTitle("Inspired Feed")
        }
    }
}

#Preview("Launching") {
    AppView(store: Store(initialState: .launching) {
        AppFeature()
    })
}

#Preview("Authenticated") {
    AppView(store: Store(initialState: .authenticated(.mock)) {
        AppFeature()
    })
}
