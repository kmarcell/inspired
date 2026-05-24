import ComposableArchitecture
import SwiftUI

struct FeedDiscoveryView<Header: View>: View {
    let communities: [Community]
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey
    let headerContent: Header
    let onCommunityTapped: (Community) -> Void
    
    init(
        communities: [Community],
        title: LocalizedStringKey = "landing.discovery.title",
        subtitle: LocalizedStringKey = "landing.discovery.subtitle",
        @ViewBuilder headerContent: () -> Header = { EmptyView() },
        onCommunityTapped: @escaping (Community) -> Void = { _ in }
    ) {
        self.communities = communities
        self.title = title
        self.subtitle = subtitle
        self.headerContent = headerContent()
        self.onCommunityTapped = onCommunityTapped
    }
    
    var body: some View {
        Section {
            headerContent
            
            ForEach(communities) { community in
                CommunityTile(community: community)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.primaryBackground)
                    .accessibilityIdentifier("feed.discovery.\(community.id)")
                    .onTapGesture {
                        onCommunityTapped(community)
                    }
            }
        } header: {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primaryText)
                    .accessibilityIdentifier("landing.discovery.title")
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.secondaryText)
                    .accessibilityIdentifier("landing.discovery.subtitle")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .textCase(nil)
    }
}

#Preview {
    List {
        FeedDiscoveryView(
            communities: .mocks
        )
    }
    .listStyle(.plain)
}
