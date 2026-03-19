import ComposableArchitecture
import Foundation
import FirebaseFirestore
import FirebaseFunctions
import OSLog

public enum ProfileError: Error, Equatable {
    case permissionDenied
    case notFound
    case invalidName(String)
    case rateLimited
    case unknown
}

@DependencyClient
public struct FirestoreClient: Sendable {
    public var fetchUserProfile: @Sendable (_ userId: String) async throws -> User
    public var createUserProfile: @Sendable (_ user: User) async throws -> Void
    public var validateDisplayName: @Sendable (_ name: String) async throws -> Bool
    public var fetchFeed: @Sendable (_ area: String, _ communityIds: [String], _ daysBack: Int) async throws -> [Post]
    public var fetchSuggestedCommunities: @Sendable (_ area: String) async throws -> [Community]
    public var detectNearestArea: @Sendable () async throws -> String
    public var fetchUserLikes: @Sendable (_ postIds: [String]) async throws -> [String: Bool]
}

extension FirestoreClient: DependencyKey {
    public static let liveValue: FirestoreClient = Self(
        fetchUserProfile: { (userId: String) async throws -> User in
            let snapshot = try await Firestore.firestore().collection("users").document(userId).getDocument()
            if !snapshot.exists {
                throw ProfileError.notFound
            }
            return try snapshot.decodedModel(as: User.self, withId: true)
        },
        createUserProfile: { (user: User) async throws -> Void in
            try Firestore.firestore().collection("users").document(user.id).setData(from: user)
        },
        validateDisplayName: { (name: String) async throws -> Bool in
            let functions = Functions.functions()
            let result = try await functions.httpsCallable("validateDisplayName").call(["displayName": name])
            
            guard let data = result.data as? [String: Any],
                  let isValid = data["isValid"] as? Bool else {
                throw ProfileError.unknown
            }
            
            if !isValid {
                let reason = data["reason"] as? String ?? "Invalid name."
                throw ProfileError.invalidName(reason)
            }
            
            return true
        },
        fetchFeed: { (area: String, communityIds: [String], daysBack: Int) async throws -> [Post] in
            let db = Firestore.firestore()
            let cutoffDate = Calendar.current.date(byAdding: .day, value: -daysBack, to: Date()) ?? Date()
            
            let areaQuery = db.collection("posts")
                .whereField("source.type", isEqualTo: "area")
                .whereField("source.name", isEqualTo: area)
                .whereField("createdAt", isGreaterThan: cutoffDate)
                .order(by: "createdAt", descending: true)
                .limit(to: 25)
            
            let areaSnapshot = try await areaQuery.getDocuments()
            var allPosts = try areaSnapshot.documents.compactMap { try $0.decodedModel(as: Post.self, withId: true) }
            
            let chunks = communityIds.chunked(into: 30)
            for chunk in chunks {
                let commQuery = db.collection("posts")
                    .whereField("source.id", in: chunk)
                    .whereField("createdAt", isGreaterThan: cutoffDate)
                    .order(by: "createdAt", descending: true)
                    .limit(to: 25)
                
                let commSnapshot = try await commQuery.getDocuments()
                let commPosts = try commSnapshot.documents.compactMap { try $0.decodedModel(as: Post.self, withId: true) }
                allPosts.append(contentsOf: commPosts)
            }
            
            return Array(allPosts
                .sorted(by: { $0.createdAt > $1.createdAt })
                .prefix(25))
        },
        fetchSuggestedCommunities: { (area: String) async throws -> [Community] in
            let db = Firestore.firestore()
            let snapshot = try await db.collection("communities")
                .order(by: "engagementScore", descending: true)
                .limit(to: 10)
                .getDocuments()
            
            return try snapshot.documents.compactMap { try $0.decodedModel(as: Community.self, withId: true) }
        },
        detectNearestArea: { () async throws -> String in
            return "Askew"
        },
        fetchUserLikes: { (postIds: [String]) async throws -> [String: Bool] in
            return [:]
        }
    )
}

// --- Helpers ---

protocol FirestoreDocumentSnapshot {
    var documentID: String { get }
    func data() -> [String: Any]?
}

extension DocumentSnapshot: FirestoreDocumentSnapshot {}

extension FirestoreDocumentSnapshot {
    func decodedModel<T: Decodable>(as type: T.Type, withId: Bool = false) throws -> T {
        guard var data = self.data() else {
            throw NSError(domain: "FirestoreClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data in snapshot"])
        }
        if withId || data["id"] == nil {
            data["id"] = documentID
        }
        return try FirestoreClient.decode(data, as: T.self)
    }
}

extension FirestoreClient {
    private static let logger = Logger(subsystem: "com.inspired.app", category: "FirestoreClient")

    static func decode<T: Decodable>(_ data: [String: Any], as type: T.Type) throws -> T {
        do {
            let sanitizedData = sanitize(data)
            let jsonData = try JSONSerialization.data(withJSONObject: sanitizedData)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                if let timestamp = try? container.decode(Timestamp.self) {
                    return timestamp.dateValue()
                }
                if let string = try? container.decode(String.self) {
                    let formatter = ISO8601DateFormatter()
                    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                    if let date = formatter.date(from: string) {
                        return date
                    }
                    formatter.formatOptions = [.withInternetDateTime]
                    if let date = formatter.date(from: string) {
                        return date
                    }
                }
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date format")
            }
            return try decoder.decode(T.self, from: jsonData)
        } catch {
            logger.error("❌ Decoding failed for \(String(describing: type)): \(error)")
            if let decodingError = error as? DecodingError {
                switch decodingError {
                case .keyNotFound(let key, let context):
                    logger.error("   - Key not found: \(key.stringValue) (Path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")))")
                case .typeMismatch(let type, let context):
                    logger.error("   - Type mismatch: expected \(String(describing: type)) (Path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")))")
                case .valueNotFound(let type, let context):
                    logger.error("   - Value not found for \(String(describing: type)) (Path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")))")
                case .dataCorrupted(let context):
                    logger.error("   - Data corrupted: \(context.debugDescription) (Path: \(context.codingPath.map { $0.stringValue }.joined(separator: ".")))")
                @unknown default:
                    logger.error("   - Unknown decoding error")
                }
            }
            throw error
        }
    }
    
    private static func sanitize(_ object: Any) -> Any {
        if let timestamp = object as? Timestamp {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return formatter.string(from: timestamp.dateValue())
        } else if let dictionary = object as? [String: Any] {
            return dictionary.mapValues { sanitize($0) }
        } else if let array = object as? [Any] {
            return array.map { sanitize($0) }
        }
        return object
    }
}

extension FirestoreClient: TestDependencyKey {
    public static let previewValue = Self(
        fetchUserProfile: { _ in .mock },
        createUserProfile: { _ in },
        validateDisplayName: { _ in true },
        fetchFeed: { _, _, _ in .mock },
        fetchSuggestedCommunities: { _ in .mock },
        detectNearestArea: { "Askew" },
        fetchUserLikes: { ids in Dictionary(uniqueKeysWithValues: ids.map { ($0, false) }) }
    )

    public static let testValue = previewValue
}

extension DependencyValues {
    public var firestoreClient: FirestoreClient {
        get { self[FirestoreClient.self] }
        set { self[FirestoreClient.self] = newValue }
    }
}

// --- Mocks (Based on seeds) ---
extension Array where Element == Post {
    public static let mock: [Post] = [
        Post(
            id: "post_askew_001",
            author: .init(
                id: "user_teacher_001",
                username: "yoga_maya#1001",
                thumbnailUrl: nil,
                avatarPrivacy: .public
            ),
            content: "Looking forward to seeing everyone at the Askew Zen Den tomorrow morning! 🧘‍♀️",
            source: .init(type: .area, name: "Askew"),
            stats: .init(likeCount: 15, commentCount: 2),
            createdAt: Date(timeIntervalSince1970: 1739865600)
        ),
        Post(
            id: "post_ravenscourt_001",
            author: .init(
                id: "user_teacher_001",
                username: "yoga_maya#1001",
                thumbnailUrl: nil,
                avatarPrivacy: .public
            ),
            content: "Outdoor session in Ravenscourt Park was beautiful today! 🌳",
            source: .init(type: .community, name: "Ravenscourt Park Yoga"),
            stats: .init(likeCount: 42, commentCount: 8),
            createdAt: Date(timeIntervalSince1970: 1739874600)
        )
    ]
}

// --- Helpers ---
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0 ..< Swift.min($0 + size, count)])
        }
    }
}
