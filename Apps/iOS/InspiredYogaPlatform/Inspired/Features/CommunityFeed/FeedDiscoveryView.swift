import ComposableArchitecture
import SwiftUI

struct FeedDiscoveryView: View {
    let store: StoreOf<CommunityFeedFeature>
    
    var body: some View {
        // We return a ForEach so it can be integrated directly into the LandingPage List
        // This allows the discovery items to scroll vertically along with the rest of the list.
        Section {
            ForEach(store.suggestedCommunities) { community in
                CommunityTile(community: community)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.primaryBackground)
                    .accessibilityIdentifier("feed.discovery.\(community.id)")
                    .onTapGesture {
                        // Action handled by parent or via TCA if needed
                    }
            }
        } header: {
            VStack(alignment: .leading, spacing: 4) {
                Text("landing.discovery.title")
                    .font(.headline)
                    .foregroundColor(.primaryText)
                    .accessibilityIdentifier("landing.discovery.title")
                Text("landing.discovery.subtitle")
                    .font(.subheadline)
                    .foregroundColor(.secondaryText)
                    .accessibilityIdentifier("landing.discovery.subtitle")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .textCase(nil) // Disable default uppercase header
    }
}

#Preview {
    List {
        FeedDiscoveryView(
            store: Store(initialState: {
                var state = CommunityFeedFeature.State(user: .mock)
                state.suggestedCommunities = .mocks
                return state
            }()) {
                CommunityFeedFeature()
            }
        )
    }
    .listStyle(.plain)
}
