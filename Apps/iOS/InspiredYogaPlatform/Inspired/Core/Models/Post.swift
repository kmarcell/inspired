import Foundation

public struct Post: Equatable, Identifiable, Codable, Sendable {
    public let id: String
    public let author: Author
    public let content: String
    public let source: PostSource
    public let stats: Stats
    public let createdAt: Date

    public init(id: String, author: Author, content: String, source: PostSource, stats: Stats, createdAt: Date) {
        self.id = id
        self.author = author
        self.content = content
        self.source = source
        self.stats = stats
        self.createdAt = createdAt
    }

    public struct Author: Equatable, Codable, Sendable {
        public let id: String
        public let username: String
        public let thumbnailUrl: String?
        public let avatarPrivacy: User.PrivacySettings.VisibilityLevel

        public init(id: String, username: String, thumbnailUrl: String?, avatarPrivacy: User.PrivacySettings.VisibilityLevel) {
            self.id = id
            self.username = username
            self.thumbnailUrl = thumbnailUrl
            self.avatarPrivacy = avatarPrivacy
        }
    }

    public struct PostSource: Equatable, Codable, Sendable {
        public let type: SourceType
        public let id: String?
        public let name: String

        public init(type: SourceType, id: String? = nil, name: String) {
            self.type = type
            self.id = id
            self.name = name
        }

        public enum SourceType: String, Codable, Sendable {
            case area
            case community
        }
    }

    public struct Stats: Equatable, Codable, Sendable {
        public var likeCount: Int
        public var commentCount: Int
        
        public init(likeCount: Int, commentCount: Int) {
            self.likeCount = likeCount
            self.commentCount = commentCount
        }
    }
}
