import Foundation

public struct User: Equatable, Identifiable, Codable, Sendable {
    public let id: String
    public let username: String
    public let displayName: String?
    public let bio: String?
    public let lastSearchArea: String?
    public let joinedCommunities: [String]
    public let profilePictureUrl: URL?
    public let thumbnailUrl: URL?
    public let privacySettings: PrivacySettings
    public let createdAt: Date
    public let updatedAt: Date

    public struct PrivacySettings: Equatable, Codable, Sendable {
        public var isProfilePublic: Bool
        public var avatarPrivacy: VisibilityLevel
        public var showJoinedGroups: VisibilityLevel

        public enum VisibilityLevel: String, Codable, Sendable {
            case `public`
            case groupsOnly = "groups-only"
            case membersOnly = "members-only"
        }
        
        public init(
            isProfilePublic: Bool = false,
            avatarPrivacy: VisibilityLevel = .groupsOnly,
            showJoinedGroups: VisibilityLevel = .membersOnly
        ) {
            self.isProfilePublic = isProfilePublic
            self.avatarPrivacy = avatarPrivacy
            self.showJoinedGroups = showJoinedGroups
        }

        public init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            self.isProfilePublic = try container.decodeIfPresent(Bool.self, forKey: .isProfilePublic) ?? false
            self.avatarPrivacy = try container.decodeIfPresent(VisibilityLevel.self, forKey: .avatarPrivacy) ?? .groupsOnly
            self.showJoinedGroups = try container.decodeIfPresent(VisibilityLevel.self, forKey: .showJoinedGroups) ?? .membersOnly
        }
    }

    public init(
        id: String,
        username: String,
        displayName: String? = nil,
        bio: String? = nil,
        lastSearchArea: String? = nil,
        joinedCommunities: [String] = [],
        profilePictureUrl: URL? = nil,
        thumbnailUrl: URL? = nil,
        privacySettings: PrivacySettings = .init(),
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.bio = bio
        self.lastSearchArea = lastSearchArea
        self.joinedCommunities = joinedCommunities
        self.profilePictureUrl = profilePictureUrl
        self.thumbnailUrl = thumbnailUrl
        self.privacySettings = privacySettings
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        self.id = try container.decode(String.self, forKey: .id)
        self.username = try container.decodeIfPresent(String.self, forKey: .username) ?? "unknown"
        self.displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        self.bio = try container.decodeIfPresent(String.self, forKey: .bio)
        self.lastSearchArea = try container.decodeIfPresent(String.self, forKey: .lastSearchArea)
        self.joinedCommunities = try container.decodeIfPresent([String].self, forKey: .joinedCommunities) ?? []
        self.profilePictureUrl = try container.decodeIfPresent(URL.self, forKey: .profilePictureUrl)
        self.thumbnailUrl = try container.decodeIfPresent(URL.self, forKey: .thumbnailUrl)
        
        // Robust privacy settings decoding
        if let settings = try container.decodeIfPresent(PrivacySettings.self, forKey: .privacySettings) {
            self.privacySettings = settings
        } else {
            self.privacySettings = .init()
        }
        
        self.createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt) ?? .now
        self.updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt) ?? .now
    }
}
