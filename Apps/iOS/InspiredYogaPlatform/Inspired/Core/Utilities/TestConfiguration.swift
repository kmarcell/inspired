import Foundation

#if DEBUG
struct TestConfiguration {
    static var forcedUserId: String? {
        UserDefaults.standard.string(forKey: "TEST_UID")
    }
    
    static var forcedPassword: String? {
        UserDefaults.standard.string(forKey: "TEST_PWD")
    }
}
#endif
