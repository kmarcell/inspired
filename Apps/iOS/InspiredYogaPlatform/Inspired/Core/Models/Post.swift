import Foundation

public struct Post: Equatable, Identifiable, Codable {
    public let id: String
    public let author: Author
    public let content: String
    public let source: PostSource
    public let stats: Stats
    public let createdAt: Date

    public struct Author: Equatable, Codable {
        public let id: String
        public let username: String
        public let thumbnailUrl: URL?
        public let avatarPrivacy: User.PrivacySettings.VisibilityLevel
    }

    public struct PostSource: Equatable, Codable {
        public let type: SourceType
        public let name: String

        public enum SourceType: String, Codable {
            case area
            case community
        }
    }

    public struct Stats: Equatable, Codable {
        public var likeCount: Int
        public var commentCount: Int
    }
}
