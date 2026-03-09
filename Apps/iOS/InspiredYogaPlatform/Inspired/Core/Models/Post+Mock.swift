import Foundation

extension Post {
    public static let mock = Post(
        id: "post_001",
        author: .init(
            id: "user_teacher_001",
            username: "yoga_teacher#8821",
            thumbnailUrl: nil,
            avatarPrivacy: .public
        ),
        content: "Just finished a great morning flow! #yoga #zen\nExcited to see everyone in class today.",
        source: .init(type: .area, name: "Askew"),
        stats: .init(likeCount: 12, commentCount: 3),
        createdAt: Date().addingTimeInterval(-7200) // 2h ago
    )
    
    public static let mockLong = Post(
        id: "post_002",
        author: .init(
            id: "user_maya_99",
            username: "maya_sharma#1234",
            thumbnailUrl: nil,
            avatarPrivacy: .public
        ),
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        source: .init(type: .community, name: "Sunset Yoga Collective"),
        stats: .init(likeCount: 156, commentCount: 42),
        createdAt: Date().addingTimeInterval(-86400) // 1d ago
    )
    
    public static let mockShort = Post(
        id: "post_003",
        author: .init(
            id: "user_zen_master",
            username: "zen_master#0001",
            thumbnailUrl: nil,
            avatarPrivacy: .public
        ),
        content: "Breathe in. Breathe out. 🧘‍♂️",
        source: .init(type: .area, name: "Global"),
        stats: .init(likeCount: 5, commentCount: 0),
        createdAt: Date().addingTimeInterval(-300) // 5m ago
    )
}
