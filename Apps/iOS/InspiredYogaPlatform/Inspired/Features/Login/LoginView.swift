import ComposableArchitecture
import SwiftUI

public struct LoginView: View {
    let store: StoreOf<LoginReducer>

    public init(store: StoreOf<LoginReducer>) {
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

                VStack(spacing: 16) {
                    Button {
                        store.send(.googleLoginButtonTapped)
                    } label: {
                        HStack {
                            Image(systemName: "g.circle.fill")
                            Text("login.googleButton")
                        }
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.primarySurfaceInverted, in: RoundedRectangle(cornerRadius: 12))
                        .foregroundColor(.primaryTextInverted)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.primaryTextInverted.opacity(0.2), lineWidth: 1)
                        )
                    }
                    .accessibilityIdentifier("login.googleButton")
                    .accessibilityHint("Sign in with your Google account")

                    Button {
                    } label: {
                        Text("login.emailButton")
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                            .foregroundColor(Color.primaryText)
                    }
                    .accessibilityIdentifier("login.emailButton")
                    .accessibilityHint("Sign in with your email address")

                    HStack {
                        VStack { Divider().background(Color.secondaryText.opacity(0.3)) }
                        Text("login.orDivider")
                            .font(.footnote)
                            .foregroundColor(Color.secondaryText)
                            .accessibilityHidden(true)
                        VStack { Divider().background(Color.secondaryText.opacity(0.3)) }
                    }
                    .padding(.vertical, 8)
                    .accessibilityHidden(true)

                    Button {
                    } label: {
                        Text("login.createAccountButton")
                            .fontWeight(.medium)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.clear)
                            .foregroundColor(Color.primaryText)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.primaryText, lineWidth: 1)
                            )
                    }
                    .accessibilityIdentifier("login.createAccountButton")
                    .accessibilityHint("Create a new account")
                }
                .padding(.horizontal, 40)

                VStack(spacing: 4) {
                    Text("login.footer.legalPrefix")
                        .font(.caption2)
                        .foregroundColor(Color.secondaryText)
                    
                    HStack(spacing: 4) {
                        Text("login.footer.privacyPolicy")
                            .fontWeight(.bold)
                        Text("login.footer.and")
                        Text("login.footer.terms")
                            .fontWeight(.bold)
                    }
                    .font(.caption2)
                    .foregroundColor(Color.primaryText)
                }
                .padding(.top, 40)
                .multilineTextAlignment(.center)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("By logging in or creating an account, you accept our Privacy Policy and Terms and Conditions.")

                Spacer()

                HStack(spacing: 16) {
                    Button { } label: { Text("login.footer.privacyPolicy") }
                    Circle().frame(width: 4, height: 4).foregroundColor(Color.secondaryText)
                    Button { } label: { Text("login.footer.terms") }
                    Circle().frame(width: 4, height: 4).foregroundColor(Color.secondaryText)
                    Button { } label: { Text("login.footer.support") }
                        .accessibilityIdentifier("login.supportButton")
                }
                .font(.footnote)
                .foregroundColor(Color.secondaryText)
                .padding(.bottom, 20)
            }
        }
    }
}

#Preview {
    LoginView(
        store: Store(initialState: LoginReducer.State()) {
            LoginReducer()
        }
    )
}
