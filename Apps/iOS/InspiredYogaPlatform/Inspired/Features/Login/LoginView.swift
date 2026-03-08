import ComposableArchitecture
import SwiftUI

public struct LoginView: View {
    let store: StoreOf<LoginFeature>

    public init(store: StoreOf<LoginFeature>) {
        self.store = store
    }

    public var body: some View {
        ZStack {
            Color.primaryBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.secondary.opacity(0.2))
                        .frame(width: 120, height: 120)
                        .overlay(
                            Text("LOGO")
                                .font(.headline)
                                .foregroundColor(.secondary)
                        )
                        .accessibilityHidden(true)

                    Text("login.title")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primaryText)

                    Text("login.subtitle")
                        .font(.subheadline)
                        .foregroundColor(.secondaryText)
                }

                VStack(spacing: 20) {
                    SocialSignInButton(provider: .google) {
                        store.send(.googleLoginButtonTapped)
                    }

                    HStack {
                        VStack { Divider().background(Color.secondaryText.opacity(0.3)) }
                        Text("login.orDivider")
                            .font(.footnote)
                            .foregroundStyle(Color.secondaryText)
                            .accessibilityHidden(true)
                        VStack { Divider().background(Color.secondaryText.opacity(0.3)) }
                    }
                    .padding(.vertical, 8)
                    .accessibilityHidden(true)

                    VStack(spacing: 12) {
                        EmailInputField(
                            text: Binding(
                                get: { store.email },
                                set: { store.send(.emailChanged($0)) }
                            ),
                            isLoading: store.isLoading,
                            isButtonEnabled: store.isEmailValid && !store.isCooldownActive
                        ) {
                            store.send(.sendMagicLinkTapped)
                        }

                        if store.magicLinkSent || store.isCooldownActive {
                            StatusPill(
                                style: .success(
                                    title: "login.magicLinkSent",
                                    subtitle: store.isCooldownActive ? "login.cooldown.resend \(store.cooldownRemaining)" : nil
                                )
                            )
                            .accessibilityIdentifier("login.magicLinkSent")
                            .transition(.move(edge: .top).combined(with: .opacity))
                        }

                        if let error = store.error {
                            StatusPill(style: .error(message: LocalizedStringKey(error)))
                                .transition(.opacity)
                        }
                    }
                }
                .padding(.top, 40)
                .padding(.horizontal, 40)

                Spacer()

                LegalFooterView {
                    // Action for Support/Report
                }
                .padding(.bottom, 20)
            }
        }
        .animation(.default, value: store.magicLinkSent)
        .animation(.default, value: store.error)
    }
}

#Preview {
    LoginView(
        store: Store(initialState: LoginFeature.State()) {
            LoginFeature()
        }
    )
}
