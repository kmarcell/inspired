import SwiftUI

public struct SocialSignInButton: View {
    public enum Provider {
        case google
        
        var iconName: String {
            switch self {
            case .google: return "g.square.fill"
            }
        }
        
        var iconColor: Color {
            switch self {
            case .google: return .brandGoogle
            }
        }
        
        var titleKey: String {
            switch self {
            case .google: return "login.googleButton"
            }
        }
        
        var accessibilityHintKey: String {
            switch self {
            case .google: return "login.googleButton.accessibilityHint"
            }
        }
    }
    
    let provider: Provider
    let action: () -> Void
    
    public init(provider: Provider, action: @escaping () -> Void) {
        self.provider = provider
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: provider.iconName)
                    .font(.system(size: 24))
                    .foregroundStyle(provider.iconColor)
                Text(LocalizedStringKey(provider.titleKey))
            }
            .fontWeight(.medium)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
            .foregroundStyle(Color.primaryText)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
            )
        }
        .accessibilityIdentifier("login.googleButton")
        .accessibilityHint(Text(LocalizedStringKey(provider.accessibilityHintKey)))
    }
}

#Preview {
    VStack {
        SocialSignInButton(provider: .google) {}
            .padding()
    }
    .background(Color.primaryBackground)
}
