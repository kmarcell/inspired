import SwiftUI

public struct PostEntryBar: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack {
                Text("landing.postPlaceholder")
                    .foregroundStyle(Color.primaryText.opacity(0.8))
                Spacer()
                Image(systemName: "square.and.pencil")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(Color.accentColor)
            }
            .padding(.horizontal, 16)
            .frame(height: 50)
            .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.primaryText.opacity(0.2), lineWidth: 1)
            )
        }
        .accessibilityIdentifier("landing.createPostButton")
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    PostEntryBar {}
        .padding()
        .background(Color.primaryBackground)
}
