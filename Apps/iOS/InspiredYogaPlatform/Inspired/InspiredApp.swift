import SwiftUI
import FirebaseCore
import FirebaseFirestore
import FirebaseAuth
import FirebaseStorage
import FirebaseFunctions
import FirebaseAppCheck
import ComposableArchitecture
import OSLog
import GoogleSignIn

@main
struct InspiredApp: App {
    let logger = Logger(subsystem: "com.inspired", category: "App")

    enum StoreContainer {
        case live(StoreOf<AppFeature>)
        case onboarding(StoreOf<AppFeature>)
        case login(StoreOf<LoginFeature>)
        case landing(StoreOf<LandingPageFeature>)
    }

    private let container: StoreContainer

    init() {
        #if DEBUG
        // Setup App Check Debug Provider for emulator testing
        let providerFactory = AppCheckDebugProviderFactory()
        AppCheck.setAppCheckProviderFactory(providerFactory)
        #endif

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
            case "Landing":
                self.container = .landing(Store(initialState: LandingPageFeature.State(user: .mock)) {
                    LandingPageFeature()
                })
            default:
                self.container = .live(Store(initialState: AppFeature.State()) {
                    AppFeature()
                })
            }
        } else {
            self.container = .live(Store(initialState: AppFeature.State()) {
                AppFeature()
            })
        }
        #else
        self.container = .live(Store(initialState: AppFeature.State()) {
            AppFeature()
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
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
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
        case .landing(let store):
            LandingPageView(store: store)
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
        case .login, .landing:
            break
        }
    }

    #if FIREBASE_EMULATOR
    private func setupEmulator() {
        print("🚀 Connecting to Firebase Emulators at 127.0.0.1...")
        
        let host = "127.0.0.1"
        
        let settings = Firestore.firestore().settings
        settings.host = "\(host):8081"
        settings.isSSLEnabled = false
        settings.cacheSettings = MemoryCacheSettings()
        Firestore.firestore().settings = settings
        
        Auth.auth().useEmulator(withHost: host, port: 9099)
        Storage.storage().useEmulator(withHost: host, port: 9199)
        Functions.functions().useEmulator(withHost: host, port: 5001)
    }
    #endif
}
