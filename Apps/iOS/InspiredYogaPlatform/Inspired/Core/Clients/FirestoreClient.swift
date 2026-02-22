import ComposableArchitecture
import Foundation

@DependencyClient
public struct FirestoreClient: Sendable {
    public var fetchPosts: @Sendable (_ area: String) async throws -> [Post]
    public var fetchStudios: @Sendable (_ area: String) async throws -> [Studio]
    public var fetchUserLikes: @Sendable (_ postIds: [String]) async throws -> [String: Bool]
}

extension FirestoreClient: TestDependencyKey {
    public static let previewValue = Self(
        fetchPosts: { _ in .mock },
        fetchStudios: { _ in .mock },
        fetchUserLikes: { ids in Dictionary(uniqueKeysWithValues: ids.map { ($0, false) }) }
    )

    public static let testValue = Self()
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
            author: .init(id: "user_teacher_001", username: "yoga_maya#1001", thumbnailUrl: nil),
            content: "Looking forward to seeing everyone at the Askew Zen Den tomorrow morning! 🧘‍♀️",
            source: .init(type: .area, name: "Askew"),
            stats: .init(likeCount: 15, commentCount: 2),
            createdAt: Date(timeIntervalSince1970: 1739865600)
        ),
        Post(
            id: "post_hammersmith_001",
            author: .init(id: "user_student_001", username: "zen_explorer#2002", thumbnailUrl: nil),
            content: "Anyone know a good studio in Hammersmith for complete beginners?",
            source: .init(type: .area, name: "Hammersmith"),
            stats: .init(likeCount: 3, commentCount: 8),
            createdAt: Date(timeIntervalSince1970: 1739874600)
        )
    ]
}

extension Array where Element == Studio {
    public static let mock: [Studio] = [
        Studio(
            id: "studio_askew_001",
            name: "Askew Road Zen Den",
            address: "123 Askew Rd, London W12 9AU",
            about: "A cozy, community-focused space for all levels.",
            rating: 4.9,
            isClaimed: true,
            ownerId: "user_teacher_001",
            reviewCount: 42,
            moderationSettings: .init(autoApproveMemberComments: true, guestCommentsEnabled: false),
            location: .init(lat: 51.5033, lng: -0.2445)
        )
    ]
}
