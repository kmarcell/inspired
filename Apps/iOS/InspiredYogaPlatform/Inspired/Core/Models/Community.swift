import Foundation

public struct Community: Equatable, Identifiable, Codable, Sendable {
    public let id: String
    public let name: String
    public let description: String
    public let location_prefix: String
    public let engagementScore: Int
    public let linkedStudioId: String?
    public let privacySettings: PrivacySettings
    public let links: Links?

    public struct PrivacySettings: Equatable, Codable, Sendable {
        public var isPublic: Bool
        public var membersCanPost: Bool
        
        public init(isPublic: Bool, membersCanPost: Bool) {
            self.isPublic = isPublic
            self.membersCanPost = membersCanPost
        }
    }

    public struct Links: Equatable, Codable, Sendable {
        public var whatsapp: String?
        public var linkedin: String?
        
        public init(whatsapp: String? = nil, linkedin: String? = nil) {
            self.whatsapp = whatsapp
            self.linkedin = linkedin
        }
    }
    
    public init(
        id: String,
        name: String,
        description: String,
        location_prefix: String,
        engagementScore: Int,
        linkedStudioId: String? = nil,
        privacySettings: PrivacySettings = .init(isPublic: true, membersCanPost: true),
        links: Links? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.location_prefix = location_prefix
        self.engagementScore = engagementScore
        self.linkedStudioId = linkedStudioId
        self.privacySettings = privacySettings
        self.links = links
    }
}
