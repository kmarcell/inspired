import Foundation
import Security

public class KeychainAccessor {
    private let service: String
    private let add: (CFDictionary, UnsafeMutablePointer<CFTypeRef?>?) -> OSStatus
    private let delete: (CFDictionary) -> OSStatus
    private let copy: (CFDictionary, UnsafeMutablePointer<AnyObject?>?) -> OSStatus

    public convenience init(service: String) {
        self.init(service: service,
                  add: SecItemAdd,
                  delete: SecItemDelete,
                  copy: SecItemCopyMatching)
    }

    public init(service: String, 
                add: @escaping (CFDictionary, UnsafeMutablePointer<CFTypeRef?>?) -> OSStatus,
                delete: @escaping (CFDictionary) -> OSStatus,
                copy: @escaping (CFDictionary, UnsafeMutablePointer<AnyObject?>?) -> OSStatus) {
        self.service = service
        self.add = add
        self.delete = delete
        self.copy = copy
    }

    public func storeData<T: Codable>(_ object: T, forKey key: String) -> OSStatus {
        let encoder = JSONEncoder()
        guard let encoded = try? encoder.encode(object) else {
            return errSecParam
        }

        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: key,
                                    kSecValueData as String: encoded]

        _ = delete(query as CFDictionary)
        return add(query as CFDictionary, nil)
    }

    public func deleteData(forKey key: String) -> OSStatus {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: key]

        return delete(query as CFDictionary)
    }

    public func retrieveData<T: Codable>(forKey key: String) -> T? {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: key,
                                    kSecReturnData as String: kCFBooleanTrue!,
                                    kSecMatchLimit as String: kSecMatchLimitOne]

        var dataTypeRef: AnyObject?
        let status: OSStatus = copy(query as CFDictionary, &dataTypeRef)

        if status == noErr {
            let data = dataTypeRef as! Data
            let decoder = JSONDecoder()
            return try? decoder.decode(T.self, from: data)
        } else {
            return nil
        }
    }
}
