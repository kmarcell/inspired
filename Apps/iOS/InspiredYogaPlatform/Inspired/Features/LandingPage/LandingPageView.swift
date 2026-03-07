import ComposableArchitecture
import SwiftUI

public struct LandingPageView: View {
    let store: StoreOf<LandingPageFeature>
    
    public init(store: StoreOf<LandingPageFeature>) {
        self.store = store
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // Top Navigation Bar
            HStack(spacing: 16) {
                // Profile Avatar Placeholder
                Button {
                    store.send(.profileButtonTapped)
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.primarySurface)
                            .frame(width: 40, height: 40)
                            .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
                        
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 32, height: 32)
                            .foregroundStyle(Color.secondaryText.opacity(0.6))
                    }
                }
                .accessibilityIdentifier("landing.profileButton")
                .accessibilityLabel(Text("landing.navigation.profile"))
                
                // Search-styled Button
                Button {
                    store.send(.searchButtonTapped)
                } label: {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(Color.secondaryText)
                        Text("landing.searchPlaceholder")
                            .foregroundStyle(Color.secondaryText.opacity(0.7))
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .frame(height: 40)
                    .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.primaryText.opacity(0.1), lineWidth: 1)
                    )
                }
                .accessibilityIdentifier("landing.searchButton")
                
                // Right Actions
                HStack(spacing: 12) {
                    Button {
                        store.send(.joinedCommunitiesButtonTapped)
                    } label: {
                        Image(systemName: "person.2")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(Color.primaryText)
                    }
                    .accessibilityIdentifier("landing.communitiesButton")
                    .accessibilityLabel(Text("landing.navigation.communities"))
                    
                    Button {
                        store.send(.notificationsButtonTapped)
                    } label: {
                        Image(systemName: "bell")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(Color.primaryText)
                    }
                    .accessibilityIdentifier("landing.notificationsButton")
                    .accessibilityLabel(Text("landing.navigation.notifications"))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.primaryBackground)
            
            Divider()
                .background(Color.primaryText.opacity(0.05))
            
            // Area Label & Post Entry
            VStack(alignment: .leading, spacing: 16) {
                // Adaptive Area Label
                HStack(spacing: 4) {
                    Text("landing.areaPrefix")
                        .foregroundStyle(Color.secondaryText)
                    Text(store.currentArea)
                        .fontWeight(.bold)
                        .foregroundStyle(Color.primaryText)
                }
                .font(.caption)
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .accessibilityElement(children: .combine)
                
                // Post Entry Bar
                Button {
                    store.send(.createPostButtonTapped)
                } label: {
                    HStack {
                        Text("landing.postPlaceholder")
                            .foregroundStyle(Color.primaryText.opacity(0.8)) // Darker for contrast
                        Spacer()
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundStyle(Color.accentColor)
                    }
                    .padding(.horizontal, 16)
                    .frame(height: 50)
                    .background(Color.primarySurface, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.primaryText.opacity(0.2), lineWidth: 1) // Slightly darker stroke
                    )
                }
                .padding(.horizontal, 16)
                .accessibilityIdentifier("landing.createPostButton")
                .accessibilityElement(children: .combine)
            }
            .padding(.bottom, 16)
            .background(Color.primaryBackground)
            
            // Feed Content Area (Placeholder)
            ScrollView {
                VStack(spacing: 20) {
                    ForEach(0..<5) { _ in
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.primarySurface)
                            .frame(height: 200)
                            .overlay(
                                Text("Feed Post Placeholder")
                                    .foregroundStyle(Color.secondaryText.opacity(0.3))
                            )
                            .padding(.horizontal, 16)
                    }
                }
                .padding(.vertical, 16)
            }
            .background(Color.primaryBackground.opacity(0.5))
        }
        .navigationBarHidden(true)
    }
}

#Preview {
    LandingPageView(
        store: Store(initialState: LandingPageFeature.State(user: .mock)) {
            LandingPageFeature()
        }
    )
}
