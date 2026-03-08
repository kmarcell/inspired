import SwiftUI

public struct LandingNavBarActions: View {
    let communitiesAction: () -> Void
    let notificationsAction: () -> Void
    
    public init(
        communitiesAction: @escaping () -> Void,
        notificationsAction: @escaping () -> Void
    ) {
        self.communitiesAction = communitiesAction
        self.notificationsAction = notificationsAction
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            Button(action: communitiesAction) {
                Image(systemName: "person.2")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(Color.primaryText)
            }
            .accessibilityIdentifier("landing.communitiesButton")
            .accessibilityLabel(Text("landing.navigation.communities"))
            
            Button(action: notificationsAction) {
                Image(systemName: "bell")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(Color.primaryText)
            }
            .accessibilityIdentifier("landing.notificationsButton")
            .accessibilityLabel(Text("landing.navigation.notifications"))
        }
    }
}

#Preview {
    LandingNavBarActions(communitiesAction: {}, notificationsAction: {})
        .padding()
        .background(Color.primaryBackground)
}
