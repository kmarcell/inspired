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

            VStack(spacing: 40) {
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
                    Button {
                        store.send(.googleLoginButtonTapped)
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "g.square.fill")
                                .font(.system(size: 24))
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
                        // Integrated Email Input & Send Action
                        ZStack(alignment: .trailing) {
                            TextField("login.emailPlaceholder", text: Binding(
                                get: { store.email },
                                set: { store.send(.emailChanged($0)) }
                            ))
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .padding()
                            .padding(.trailing, 48) // Make room for the integrated button
                            .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
                            )
                            .accessibilityIdentifier("login.emailTextField")

                            Button {
                                store.send(.sendMagicLinkTapped)
                            } label: {
                                ZStack {
                                    if store.isLoading {
                                        ProgressView()
                                            .controlSize(.small)
                                    } else {
                                        Image(systemName: "paperplane.fill")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundStyle(store.isEmailValid && !store.isCooldownActive ? Color.accentColor : Color.secondaryText.opacity(0.3))
                                    }
                                }
                                .frame(width: 32, height: 32)
                                .background(store.isEmailValid && !store.isCooldownActive ? Color.accentColor.opacity(0.1) : Color.clear)
                                .clipShape(Circle())
                                .contentShape(Rectangle())
                            }
                            .padding(.trailing, 8)
                            .disabled(store.isLoading || !store.isEmailValid || store.isCooldownActive)
                            .accessibilityIdentifier("login.magicLinkButton")
                            .accessibilityLabel(Text("login.magicLinkButton"))
                            .accessibilityHint(Text("login.magicLinkButton.accessibilityHint"))
                        }

                        if store.magicLinkSent || store.isCooldownActive {
                            HStack(alignment: .center, spacing: 12) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 16))

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("login.magicLinkSent")
                                        .font(.footnote)
                                        .fontWeight(.bold)
                                    
                                    if store.isCooldownActive {
                                        Text("login.cooldown.resend \(store.cooldownRemaining)")
                                            .font(.caption2)
                                            .fontWeight(.medium)
                                    }
                                }
                            }
                            .foregroundStyle(Color.statusConfirmation)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity, alignment: .leading)
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
                            HStack(alignment: .center, spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                Text(LocalizedStringKey(error))
                            }
                            .font(.footnote)
                            .fontWeight(.medium)
                            .foregroundStyle(Color.statusFailure)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity, alignment: .leading)
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

                Spacer()

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
                        .foregroundColor(.secondaryText)
                }
                .accessibilityIdentifier("login.supportButton")
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
