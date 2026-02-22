import SwiftUI
import FirebaseCore
import FirebaseFirestore
import FirebaseAuth
import FirebaseStorage
import ComposableArchitecture

@main
struct InspiredApp: App {
    init() {
        FirebaseApp.configure()
        
        #if FIREBASE_EMULATOR
        print("🚀 Connecting to Firebase Emulator...")
        setupEmulator()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            LoginView(
                store: Store(initialState: LoginReducer.State()) {
                    LoginReducer()
                }
            )
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
