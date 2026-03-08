import SwiftUI

public struct LegalFooterView: View {
    let supportAction: () -> Void
    
    public init(supportAction: @escaping () -> Void) {
        self.supportAction = supportAction
    }
    
    public var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("login.footer.legalPrefix")
                    .font(.caption2)
                    .foregroundStyle(Color.secondaryText)
                
                HStack(spacing: 4) {
                    Text("login.footer.privacyPolicy")
                        .fontWeight(.bold)
                    Text("login.footer.and")
                    Text("login.footer.terms")
                        .fontWeight(.bold)
                }
                .font(.caption2)
                .foregroundStyle(Color.accentColor)
            }
            .multilineTextAlignment(.center)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text("login.footer.legal.accessibilityLabel"))

            Button(action: supportAction) {
                Text("login.footer.support")
                    .font(.footnote)
                    .foregroundColor(.secondaryText)
            }
            .accessibilityIdentifier("login.supportButton")
        }
    }
}

#Preview {
    LegalFooterView {}
        .padding()
        .background(Color.primaryBackground)
}
