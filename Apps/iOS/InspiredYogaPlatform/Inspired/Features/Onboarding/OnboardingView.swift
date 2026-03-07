import ComposableArchitecture
import SwiftUI

public struct OnboardingView: View {
    let store: StoreOf<OnboardingFeature>

    public init(store: StoreOf<OnboardingFeature>) {
        self.store = store
    }

    public var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                VStack(spacing: 8) {
                    Text("onboarding.title")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .accessibilityIdentifier("onboarding.title")
                    
                    Text("onboarding.subtitle")
                        .font(.body)
                        .foregroundStyle(Color.secondaryText)
                }
                .multilineTextAlignment(.center)
                .padding(.top, 40)

                VStack(alignment: .leading, spacing: 20) {
                    // Display Name
                    VStack(alignment: .leading, spacing: 8) {
                        Text("onboarding.displayName.label")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(Color.secondaryText)
                        
                        TextField("onboarding.displayName.placeholder", text: Binding(
                            get: { store.displayName },
                            set: { store.send(.displayNameChanged($0)) }
                        ))
                        .padding()
                        .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
                        )
                        .accessibilityIdentifier("onboarding.displayNameTextField")

                        Text("onboarding.displayName.hint")
                            .font(.caption2)
                            .foregroundStyle(Color.secondaryText)
                            .accessibilityIdentifier("onboarding.displayNameHint")
                    }

                    // Username Preview (Uneditable)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("onboarding.username.label")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(Color.secondaryText)
                        
                        HStack {
                            Text(store.proposedUsername)
                                .foregroundStyle(Color.secondaryText)
                            Spacer()
                            Image(systemName: "lock.fill")
                                .font(.caption)
                                .foregroundStyle(Color.secondaryText.opacity(0.5))
                        }
                        .padding()
                        .background(Color.primarySurface.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.primaryText.opacity(0.05), lineWidth: 1)
                        )
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Proposed username: \(store.proposedUsername)")
                        .accessibilityHint(Text("onboarding.username.hint"))

                        Text("onboarding.username.hint")
                            .font(.caption2)
                            .foregroundStyle(Color.secondaryText)
                            .accessibilityIdentifier("onboarding.usernameHint")
                    }
                }
                .padding(.horizontal, 24)

                Spacer()

                VStack(spacing: 16) {
                    if let error = store.error {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                            Text(LocalizedStringKey(error))
                        }
                        .font(.footnote)
                        .foregroundStyle(Color.statusFailure)
                        .padding()
                        .background(Color.statusFailure.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        store.send(.confirmButtonTapped)
                    } label: {
                        if store.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("onboarding.confirmButton")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(.white)
                    .disabled(store.isLoading || store.isRateLimited || store.displayName.count < 2)
                    .accessibilityIdentifier("onboarding.confirmButton")

                    Text("onboarding.footer.info")
                        .font(.caption2)
                        .foregroundStyle(Color.secondaryText)
                        .multilineTextAlignment(.center)
                        .accessibilityIdentifier("onboarding.footerInfo")
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
            .background(Color.primaryBackground.ignoresSafeArea())
        }
    }
}

#Preview {
    OnboardingView(store: Store(initialState: OnboardingFeature.State(userId: "123")) {
        OnboardingFeature()
    })
}
