import Foundation

@propertyWrapper
public struct SecurelyStored<T: Codable> {
    private let key: String
    private let keychainAccessor: KeychainAccessor
    
    public init(key: String, service: String) {
        self.init(key: key, accessor: KeychainAccessor(service: service))
    }
    
    public init(key: String, accessor: KeychainAccessor) {
        self.key = key
        self.keychainAccessor = accessor
    }
    
    public var wrappedValue: T? {
        get {
            keychainAccessor.retrieveData(forKey: key)
        }
        set {
            guard let value = newValue else {
                _ = keychainAccessor.deleteData(forKey: key)
                return
            }
            
            _ = keychainAccessor.storeData(value, forKey: key)
        }
    }
}
