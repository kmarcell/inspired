import ComposableArchitecture
import SwiftUI

struct LandingHeaderView: View {
    let store: StoreOf<LandingPageFeature>
    
    var body: some View {
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
    }
}

#Preview {
    LandingHeaderView(
        store: Store(initialState: LandingPageFeature.State(user: .mock)) {
            LandingPageFeature()
        }
    )
}
