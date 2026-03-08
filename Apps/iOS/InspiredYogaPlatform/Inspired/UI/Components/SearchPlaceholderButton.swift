import SwiftUI

public struct SearchPlaceholderButton: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(Color.secondaryText)
                Text("landing.searchPlaceholder")
                    .foregroundStyle(Color.secondaryText.opacity(0.7))
                Spacer()
            }
            .padding(.horizontal, 12)
            .frame(height: 40)
            .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
            )
        }
        .accessibilityIdentifier("landing.searchButton")
    }
}

#Preview {
    SearchPlaceholderButton {}
        .padding()
        .background(Color.primaryBackground)
}
