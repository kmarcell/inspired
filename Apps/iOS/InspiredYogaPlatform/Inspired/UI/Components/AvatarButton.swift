import SwiftUI

public struct AvatarButton: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            AvatarView(size: 40)
        }
        .accessibilityIdentifier("landing.profileButton")
        .accessibilityLabel(Text("landing.navigation.profile"))
    }
}

#Preview {
    AvatarButton {}
        .padding()
        .background(Color.primaryBackground)
}
