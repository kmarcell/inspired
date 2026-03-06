import SwiftUI
import FirebaseCore
import FirebaseFirestore
import FirebaseAuth
import FirebaseStorage
import ComposableArchitecture
import OSLog

@main
struct InspiredApp: App {
    let logger = Logger(subsystem: "com.inspired", category: "App")

    enum StoreContainer {
        case live(StoreOf<AppFeature>)
        case onboarding(StoreOf<AppFeature>)
        case login(StoreOf<LoginFeature>)
    }

    private let container: StoreContainer

    init() {
        FirebaseApp.configure()
        
        // 1. Initialize the correct store container first
        #if DEBUG
        if let testScreen = ProcessInfo.processInfo.environment["TEST_SCREEN"] {
            switch testScreen {
            case "Onboarding":
                self.container = .onboarding(Store(initialState: .onboarding(.init(userId: "mock_user_123", displayName: "Jane Doe"))) {
                    AppFeature()
                })
            case "Login":
                self.container = .login(Store(initialState: LoginFeature.State()) { LoginFeature() })
            default:
                self.container = .live(Store(initialState: AppFeature.State()) {
                    AppFeature()
                        .dependency(\.authenticationClient, .liveValue)
                        .dependency(\.firestoreClient, .liveValue)
                })
            }
        } else {
            self.container = .live(Store(initialState: AppFeature.State()) {
                AppFeature()
                    .dependency(\.authenticationClient, .liveValue)
                    .dependency(\.firestoreClient, .liveValue)
            })
        }
        #else
        self.container = .live(Store(initialState: AppFeature.State()) {
            AppFeature()
                .dependency(\.authenticationClient, .liveValue)
                .dependency(\.firestoreClient, .liveValue)
        })
        #endif

        // 2. Setup Emulator after container is ready
        #if FIREBASE_EMULATOR
        setupEmulator()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            rootView
                .task {
                    await prepareEnvironment()
                }
        }
    }

    @ViewBuilder
    private var rootView: some View {
        switch container {
        case .live(let store), .onboarding(let store):
            AppView(store: store)
        case .login(let store):
            LoginView(store: store)
        }
    }

    private func prepareEnvironment() async {
        #if DEBUG
        if ProcessInfo.processInfo.environment["TEST_RESET_SESSION"] == "YES" {
            print("🧹 Clearing session for test run...")
            try? Auth.auth().signOut()
        }

        if let forcedUserId = TestConfiguration.forcedUserId {
            let password = TestConfiguration.forcedPassword ?? "missing_password"
            do {
                try await Auth.auth().signIn(withEmail: "\(forcedUserId)@inspired.test", password: password)
                print("✅ Testing: Forced Auth login SUCCESS for \(forcedUserId)")
            } catch {
                print("❌ Testing: Forced Auth login FAILED: \(error)")
            }
        }
        #endif
        
        // Signal launch to the appropriate store once environment is primed
        switch container {
        case .live(let store), .onboarding(let store):
            store.send(.appLaunched)
        case .login:
            break
        }
    }

    #if FIREBASE_EMULATOR
    private func setupEmulator() {
        let settings = Firestore.firestore().settings
        settings.host = "localhost:8081"
        settings.isSSLEnabled = false
        Firestore.firestore().settings = settings
        
        Auth.auth().useEmulator(withHost: "localhost", port: 9099)
        Storage.storage().useEmulator(withHost: "localhost", port: 9199)
    }
    #endif
}
