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
    let store = Store(initialState: AppFeature.State()) {
        AppFeature()
            .dependency(\.authenticationClient, .liveValue)
            .dependency(\.firestoreClient, .liveValue)
    }

    init() {
        logger.debug("🛠️ App Environment: \(ProcessInfo.processInfo.environment)")
        FirebaseApp.configure()
        
        #if FIREBASE_EMULATOR
        print("🚀 Connecting to Firebase Emulator...")
        setupEmulator()
        #endif

        #if DEBUG
        if ProcessInfo.processInfo.environment["TEST_RESET_SESSION"] == "YES" {
            print("🧹 Clearing session for test run...")
            try? Auth.auth().signOut()
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            if let testScreen = testScreenName {
                switch testScreen {
                case "Login": 
                    LoginView(store: Store(initialState: LoginFeature.State()) { LoginFeature() })
                case "Landing":
                    ContentView()
                default: 
                    Text("Unknown test screen: \(testScreen)")
                }
            } else {
                AppView(store: store)
            }
        }
    }

    private var testScreenName: String? {
        #if DEBUG
        return ProcessInfo.processInfo.environment["TEST_SCREEN"]
        #else
        return nil
        #endif
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
