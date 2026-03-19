import ComposableArchitecture
import Foundation
import FirebaseFunctions

public enum SearchError: Error, Equatable, Sendable {
    case unauthenticated
    case unknown(String)
}

@DependencyClient
public struct SearchClient: Sendable {
    public var search: @Sendable (_ query: String, _ areaPrefix: String?) async throws -> [SearchResult]
}

extension SearchClient: DependencyKey {
    public static let liveValue: SearchClient = Self(
        search: { query, areaPrefix in
            let functions = Functions.functions()
            let result = try await functions.httpsCallable("search").call([
                "query": query,
                "currentAreaPrefix": areaPrefix ?? "W12"
            ])
            
            guard let data = result.data as? [String: Any],
                  let resultsArray = data["results"] as? [[String: Any]] else {
                throw SearchError.unknown("Invalid response format")
            }
            
            // Reuse decoding logic (simplified for now)
            let jsonData = try JSONSerialization.data(withJSONObject: resultsArray)
            let decoder = JSONDecoder()
            return try decoder.decode([SearchResult].self, from: jsonData)
        }
    )
}

extension SearchClient: TestDependencyKey {
    public static let previewValue = Self(
        search: { query, _ in
            if query.isEmpty {
                return [.community(.mock), .community(.mock2)]
            } else if query.contains("Askew") {
                return [.studio(.mock), .community(.mock)]
            } else {
                return [.community(.mock3)]
            }
        }
    )
    
    public static let testValue = Self()
}

extension DependencyValues {
    public var searchClient: SearchClient {
        get { self[SearchClient.self] }
        set { self[SearchClient.self] = newValue }
    }
}
