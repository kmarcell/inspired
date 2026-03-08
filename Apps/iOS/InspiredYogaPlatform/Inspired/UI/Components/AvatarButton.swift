import SwiftUI

public struct AvatarButton: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(Color.primarySurface)
                    .frame(width: 40, height: 40)
                    .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
                
                Image(systemName: "person.crop.circle.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
                    .foregroundStyle(Color.secondaryText.opacity(0.6))
            }
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
