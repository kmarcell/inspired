import XCTest
import Foundation
import Inspired

final class SecurelyStoredTests: XCTestCase {
    
    /// In order to check if the Apple Keychain is accessible
    /// and we have read and write permissions on the platform where we run these tests,
    /// this test creates a String which is stored securely in the Keychain
    /// than the data is retrieved and asserted.
    func testKeychainIsAccessible() {
        
        let accessor = KeychainAccessor(service: "TestService")
        let exampleKey = "MyTestKey"
        let exampleData = "Some test data"
        let storeResult = accessor.storeData(exampleData, forKey: exampleKey)
        XCTAssertEqual(storeResult, errSecSuccess, "Failed to store data in Keychain")
        
        let value: String? = accessor.retrieveData(forKey: exampleKey)
        XCTAssertEqual(exampleData, value)
        
        let deleteResult = accessor.deleteData(forKey: exampleKey)
        XCTAssertEqual(deleteResult, errSecSuccess, "Failed to delete data from Keychain")
    }
    
    func testKeychainAccessorCanStoreElsewhere() {
        
        var values = [String: Any]()
        
        let accessor = KeychainAccessor(
            service: "TestService",
            add: { query, _ in
                let service = (query as Dictionary)[kSecAttrService] as! String
                let key = (query as Dictionary)[kSecAttrAccount] as! String
                let data = (query as Dictionary)[kSecValueData]
                values[service+key] = data
                return errSecSuccess
            },
            delete: { query in
                let service = (query as Dictionary)[kSecAttrService] as! String
                let key = (query as Dictionary)[kSecAttrAccount] as! String
                values[service+key] = nil
                return errSecSuccess
            },
            copy: { query, dataTypeRef in
                let service = (query as Dictionary)[kSecAttrService] as! String
                let key = (query as Dictionary)[kSecAttrAccount] as! String
                if let value = values[service+key] as? AnyObject {
                    dataTypeRef?.pointee = value
                    return errSecSuccess
                } else {
                    return errSecItemNotFound
                }
            })
        
        let exampleKey = "MyTestKey"
        let exampleData = "Some test data"
        let storeResult = accessor.storeData(exampleData, forKey: exampleKey)
        XCTAssertEqual(storeResult, errSecSuccess, "Failed to store data in Keychain")
        
        let value: String? = accessor.retrieveData(forKey: exampleKey)
        XCTAssertEqual(exampleData, value)
        
        let deleteResult = accessor.deleteData(forKey: exampleKey)
        XCTAssertEqual(deleteResult, errSecSuccess, "Failed to delete data from Keychain")
    }
    
    func testSecurelyStoredAPIToken() {

        class MyViewModel {
            static let keychainService = "MyViewModelService"

            @SecurelyStored(key: "ApiToken", service: MyViewModel.keychainService)
            var apiToken: String?
        }

        let testee = MyViewModel()
        let exampleData = "Some test data"

        testee.apiToken = exampleData
        XCTAssertEqual(testee.apiToken, exampleData, "Failed to store data in Keychain")

        let accessor = KeychainAccessor(service: MyViewModel.keychainService)
        XCTAssertEqual(accessor.retrieveData(forKey: "ApiToken"), exampleData)

        testee.apiToken = nil
        XCTAssertEqual(testee.apiToken, nil, "Failed to delete data from Keychain")
    }

    func testSecurelyStoredAPITokenWithErrorHandling() {

        class MyViewModel {
            static let keychainService = "MyViewModelService"

            @SecurelyStored(key: "ApiToken", accessor: ConcernedKeychainAccessor(service: MyViewModel.keychainService))
            var apiToken: String?
        }

        let expectation = XCTNSNotificationExpectation(name: Notification.Name("KeychainAccessorError"))
        let testee = MyViewModel()

        // Whoops, we're trying to delete something that doesn't exist,
        // we should get `errSecItemNotFound`
        testee.apiToken = nil

        wait(for: [expectation], timeout: 1.0)
    }
}
