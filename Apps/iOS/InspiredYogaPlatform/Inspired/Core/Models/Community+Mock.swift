import Foundation

extension Community {
    public static let mock = Community(
        id: "comm_1",
        name: "Zen Garden Yoga",
        description: "A community for lovers of peaceful morning yoga in the park.",
        location_prefix: "W1",
        engagementScore: 1250
    )
    
    public static let mock2 = Community(
        id: "comm_2",
        name: "Dynamic Flow Collective",
        description: "High energy vinyasa flow enthusiasts.",
        location_prefix: "W1",
        engagementScore: 850
    )
    
    public static let mock3 = Community(
        id: "comm_3",
        name: "Yoga for Beginners",
        description: "Start your journey here with supportive peers.",
        location_prefix: "W1",
        engagementScore: 2100
    )
    
    public static let mock4 = Community(
        id: "comm_4",
        name: "London Yogis",
        description: "The largest yoga community in London.",
        location_prefix: "W1",
        engagementScore: 5000
    )
}

extension Array where Element == Community {
    public static let mocks: [Community] = [.mock, .mock2, .mock3, .mock4]
}
