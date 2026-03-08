import SwiftUI

public struct MagicLinkButton: View {
    let isLoading: Bool
    let isEnabled: Bool
    let action: () -> Void
    
    public init(isLoading: Bool, isEnabled: Bool, action: @escaping () -> Void) {
        self.isLoading = isLoading
        self.isEnabled = isEnabled
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            ZStack {
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(isEnabled ? Color.accentColor : Color.secondaryText.opacity(0.3))
                }
            }
            .frame(width: 32, height: 32)
            .background(isEnabled ? Color.accentColor.opacity(0.1) : Color.clear)
            .clipShape(Circle())
            .contentShape(Rectangle())
        }
        .disabled(!isEnabled || isLoading)
        .accessibilityIdentifier("login.magicLinkButton")
        .accessibilityLabel(Text("login.magicLinkButton"))
        .accessibilityHint(Text("login.magicLinkButton.accessibilityHint"))
    }
}

#Preview {
    HStack(spacing: 20) {
        MagicLinkButton(isLoading: false, isEnabled: true) {}
        MagicLinkButton(isLoading: true, isEnabled: true) {}
        MagicLinkButton(isLoading: false, isEnabled: false) {}
    }
    .padding()
    .background(Color.primaryBackground)
}
