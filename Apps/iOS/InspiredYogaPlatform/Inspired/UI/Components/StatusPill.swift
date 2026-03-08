import SwiftUI

public struct StatusPill: View {
    public enum Style {
        case success(title: LocalizedStringKey, subtitle: LocalizedStringKey? = nil)
        case error(message: LocalizedStringKey)
        
        var iconName: String {
            switch self {
            case .success: return "checkmark.circle.fill"
            case .error: return "exclamationmark.triangle.fill"
            }
        }
        
        var color: Color {
            switch self {
            case .success: return .statusConfirmation
            case .error: return .statusFailure
            }
        }
    }
    
    let style: Style
    
    public init(style: Style) {
        self.style = style
    }
    
    public var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: style.iconName)
                .font(.system(size: 16))

            VStack(alignment: .leading, spacing: 2) {
                switch style {
                case let .success(title, subtitle):
                    Text(title)
                        .font(.footnote)
                        .fontWeight(.bold)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.caption2)
                            .fontWeight(.medium)
                    }
                case let .error(message):
                    Text(message)
                        .font(.footnote)
                        .fontWeight(.medium)
                }
            }
        }
        .foregroundStyle(style.color)
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(style.color.opacity(0.1))
        .clipShape(.rect(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(style.color.opacity(0.2), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    VStack(spacing: 20) {
        StatusPill(style: .success(title: "login.magicLinkSent"))
        StatusPill(style: .success(title: "login.magicLinkSent", subtitle: "login.cooldown.resend 45"))
        StatusPill(style: .error(message: "login.error.tooManyRequests"))
    }
    .padding()
    .background(Color.primaryBackground)
}
