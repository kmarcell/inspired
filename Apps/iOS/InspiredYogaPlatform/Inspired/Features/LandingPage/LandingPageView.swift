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
                AvatarButton {
                    store.send(.profileButtonTapped)
                }
                
                SearchPlaceholderButton {
                    store.send(.searchButtonTapped)
                }
                
                LandingNavBarActions(
                    communitiesAction: { store.send(.joinedCommunitiesButtonTapped) },
                    notificationsAction: { store.send(.notificationsButtonTapped) }
                )
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
                
                PostEntryBar {
                    store.send(.createPostButtonTapped)
                }
                .padding(.horizontal, 16)
            }
            .padding(.bottom, 16)
            .background(Color.primaryBackground)
            
            CommunityFeedView()
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
