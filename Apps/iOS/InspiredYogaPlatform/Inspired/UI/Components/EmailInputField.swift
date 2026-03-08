import SwiftUI

public struct EmailInputField: View {
    @Binding var text: String
    let isLoading: Bool
    let isButtonEnabled: Bool
    let action: () -> Void
    
    public init(
        text: Binding<String>,
        isLoading: Bool,
        isButtonEnabled: Bool,
        action: @escaping () -> Void
    ) {
        self._text = text
        self.isLoading = isLoading
        self.isButtonEnabled = isButtonEnabled
        self.action = action
    }
    
    public var body: some View {
        ZStack(alignment: .trailing) {
            TextField("login.emailPlaceholder", text: $text)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .padding()
                .padding(.trailing, 48)
                .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
                )
                .accessibilityIdentifier("login.emailTextField")

            MagicLinkButton(
                isLoading: isLoading,
                isEnabled: isButtonEnabled,
                action: action
            )
            .padding(.trailing, 8)
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        EmailInputField(text: .constant(""), isLoading: false, isButtonEnabled: false) {}
        EmailInputField(text: .constant("maya@inspired.yoga"), isLoading: false, isButtonEnabled: true) {}
        EmailInputField(text: .constant("maya@inspired.yoga"), isLoading: true, isButtonEnabled: true) {}
    }
    .padding()
    .background(Color.primaryBackground)
}
