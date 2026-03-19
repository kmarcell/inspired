import Foundation

public enum SearchResult: Equatable, Identifiable, Codable, Sendable {
    case community(Community)
    case studio(Studio)
    
    public var id: String {
        switch self {
        case let .community(c): return c.id
        case let .studio(s): return s.id
        }
    }
    
    private enum CodingKeys: String, CodingKey {
        case type, data
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        
        switch type {
        case "community":
            let community = try container.decode(Community.self, forKey: .data)
            self = .community(community)
        case "studio":
            let studio = try container.decode(Studio.self, forKey: .data)
            self = .studio(studio)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown search result type: \(type)"
            )
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .community(community):
            try container.encode("community", forKey: .type)
            try container.encode(community, forKey: .data)
        case let .studio(studio):
            try container.encode("studio", forKey: .type)
            try container.encode(studio, forKey: .data)
        }
    }
}
