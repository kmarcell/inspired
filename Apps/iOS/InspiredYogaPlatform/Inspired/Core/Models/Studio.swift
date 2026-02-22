import Foundation
import CoreLocation

public struct Studio: Equatable, Identifiable, Codable {
    public let id: String
    public let name: String
    public let address: String
    public let about: String
    public let rating: Double
    public let isClaimed: Bool
    public let ownerId: String?
    public let reviewCount: Int
    public let moderationSettings: ModerationSettings
    public let location: Coordinates

    public struct ModerationSettings: Equatable, Codable {
        public var autoApproveMemberComments: Bool
        public var guestCommentsEnabled: Bool
    }

    public struct Coordinates: Equatable, Codable {
        public let lat: Double
        public let lng: Double
    }
}
