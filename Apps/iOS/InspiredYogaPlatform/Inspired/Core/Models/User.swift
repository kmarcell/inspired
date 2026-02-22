import Foundation

public struct User: Equatable, Identifiable, Codable {
    public let id: String
    public let username: String
    public let displayName: String?
    public let bio: String?
    public let lastSearchArea: String?
    public let isTeacher: Bool
    public let joinedCommunities: [String]
    public let profilePictureUrl: URL?
    public let privacySettings: PrivacySettings
    public let createdAt: Date
    public let updatedAt: Date

    public struct PrivacySettings: Equatable, Codable {
        public var isProfilePublic: Bool
        public var avatarPrivacy: VisibilityLevel
        public var showJoinedGroups: VisibilityLevel

        public enum VisibilityLevel: String, Codable {
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
    }

    public init(
        id: String,
        username: String,
        displayName: String? = nil,
        bio: String? = nil,
        lastSearchArea: String? = nil,
        isTeacher: Bool = false,
        joinedCommunities: [String] = [],
        profilePictureUrl: URL? = nil,
        privacySettings: PrivacySettings = .init(),
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.bio = bio
        self.lastSearchArea = lastSearchArea
        self.isTeacher = isTeacher
        self.joinedCommunities = joinedCommunities
        self.profilePictureUrl = profilePictureUrl
        self.privacySettings = privacySettings
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
