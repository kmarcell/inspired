import Foundation

extension Studio {
    public static let mock = Studio(
        id: "studio_askew_001",
        name: "Askew Road Zen Den",
        address: "123 Askew Rd, London W12 9AU",
        about: "A cozy, community-focused space for all levels.",
        rating: 4.9,
        isClaimed: true,
        ownerId: "user_teacher_001",
        reviewCount: 42,
        location_prefix: "W12",
        engagementScore: 85,
        moderationSettings: .init(autoApproveMemberComments: true, guestCommentsEnabled: false),
        location: .init(lat: 51.5033, lng: -0.2445)
    )
}

extension Array where Element == Studio {
    public static let mock: [Studio] = [.mock]
}
