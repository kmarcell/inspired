import ComposableArchitecture
import SwiftUI

public struct LoginView: View {
    let store: StoreOf<LoginFeature>

    public init(store: StoreOf<LoginFeature>) {
        self.store = store
    }

    public var body: some View {
        ZStack {
            Color.primaryBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.secondary.opacity(0.2))
                        .frame(width: 100, height: 100)
                        .overlay(
                            Text("LOGO")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        )
                        .accessibilityHidden(true)
                    
                    VStack(spacing: 4) {
                        Text("login.title")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primaryText)
                        
                        Text("login.subtitle")
                            .font(.headline)
                            .foregroundColor(.secondaryText)
                    }
                }
                .padding(.bottom, 60)

                VStack(spacing: 20) {
                    Button {
                        store.send(.googleLoginButtonTapped)
                    } label: {
                        HStack(spacing: 12) {
                            Text("G")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(Color.brandGoogle)
                            Text("login.googleButton")
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
                    .accessibilityHint(Text("login.googleButton.accessibilityHint"))

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
                        TextField("login.emailPlaceholder", text: Binding(
                            get: { store.email },
                            set: { store.send(.emailChanged($0)) }
                        ))
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding()
                        .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
                        )
                        .accessibilityIdentifier("login.emailTextField")

                        Button {
                            store.send(.sendMagicLinkTapped)
                        } label: {
                            HStack(spacing: 12) {
                                Text("📧")
                                    .font(.system(size: 20))
                                Text("login.magicLinkButton")
                            }
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
                            .foregroundStyle(.white)
                        }
                        .disabled(store.isLoading)
                        .accessibilityIdentifier("login.magicLinkButton")
                        .accessibilityHint(Text("login.magicLinkButton.accessibilityHint"))

                        if store.magicLinkSent {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                Text("login.magicLinkSent")
                            }
                            .font(.footnote)
                            .fontWeight(.medium)
                            .foregroundStyle(Color.statusConfirmation)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity)
                            .background(Color.statusConfirmation.opacity(0.1))
                            .clipShape(.rect(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.statusConfirmation.opacity(0.2), lineWidth: 1)
                            )
                            .accessibilityElement(children: .combine)
                            .accessibilityIdentifier("login.magicLinkSent")
                            .transition(.move(edge: .top).combined(with: .opacity))
                        }

                        if let error = store.error {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                Text(error)
                            }
                            .font(.footnote)
                            .fontWeight(.medium)
                            .foregroundStyle(Color.statusFailure)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity)
                            .background(Color.statusFailure.opacity(0.1))
                            .clipShape(.rect(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.statusFailure.opacity(0.2), lineWidth: 1)
                            )
                            .accessibilityElement(children: .combine)
                            .transition(.opacity)
                        }
                    }
                }
                .padding(.horizontal, 40)

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
                .padding(.top, 40)
                .multilineTextAlignment(.center)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(Text("login.footer.legal.accessibilityLabel"))

                Spacer()

                Button {
                    // Action for Support/Report
                } label: {
                    Text("login.footer.support")
                        .font(.footnote)
                        .foregroundStyle(Color.secondaryText)
                }
                .accessibilityIdentifier("login.supportButton")
                .padding(.bottom, 20)
            }
        }
    }
}

#Preview {
    LoginView(
        store: Store(initialState: LoginFeature.State()) {
            LoginFeature()
        }
    )
}
