import Foundation

public class ConcernedKeychainAccessor: KeychainAccessor {
    override public func storeData<T: Codable>(_ object: T, forKey key: String) -> OSStatus {
        let status = super.storeData(object, forKey: key)
        if status != errSecSuccess {
            NotificationCenter.default.post(name: NSNotification.Name("KeychainAccessorError"), object: nil)
        }
        return status
    }
    
    override public func deleteData(forKey key: String) -> OSStatus {
        let status = super.deleteData(forKey: key)
        if status != errSecSuccess {
            NotificationCenter.default.post(name: NSNotification.Name("KeychainAccessorError"), object: nil)
        }
        return status
    }
}
