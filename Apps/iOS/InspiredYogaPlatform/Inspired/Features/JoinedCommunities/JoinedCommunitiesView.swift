import ComposableArchitecture
import SwiftUI

public struct JoinedCommunitiesView: View {
    let store: StoreOf<JoinedCommunitiesFeature>
    
    public init(store: StoreOf<JoinedCommunitiesFeature>) {
        self.store = store
    }
    
    public var body: some View {
        List {
            if store.isLoading {
                loadingSection
            } else if store.joinedCommunities.isEmpty {
                emptyStateSection
                FeedDiscoveryView(
                    communities: store.suggestedCommunities,
                    title: "landing.discovery.nearYou.title",
                    onCommunityTapped: { store.send(.communityTapped($0)) }
                )
            } else {
                joinedCommunitiesSection
            }
        }
        .navigationTitle("joinedCommunities.title")
        .navigationBarTitleDisplayMode(.inline)
        .listStyle(.plain)
        .background(Color.primaryBackground)
        .onAppear {
            store.send(.onAppear)
        }
    }
    
    @ViewBuilder
    private var loadingSection: some View {
        Section {
            HStack {
                Spacer()
                CircularLoaderView(
                    configuration: .init(
                        radius: 60,
                        strokeWidth: 4,
                        strokeColor: .accentColor,
                        animationDuration: 1.0,
                        rotationDuration: 2.0
                    ))
                Spacer()
            }
            .listRowBackground(Color.primaryBackground)
            .listRowSeparator(.hidden)
            .padding(.top, 40)
        }
    }
    
    @ViewBuilder
    private var emptyStateSection: some View {
        Section {
            VStack(spacing: 20) {
                Text("joinedCommunities.empty.message")
                    .font(.body)
                    .foregroundColor(.secondaryText)
                    .multilineTextAlignment(.center)
                
                Button {
                    store.send(.exploreButtonTapped)
                } label: {
                    Text("joinedCommunities.empty.button")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 12)
                        .background(Color.accentColor)
                        .clipShape(Capsule())
                }
                .accessibilityIdentifier("joinedCommunities.exploreButton")
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
            .listRowBackground(Color.primaryBackground)
            .listRowSeparator(.hidden)
        }
    }
    
    @ViewBuilder
    private var joinedCommunitiesSection: some View {
        ForEach(store.joinedCommunities) { community in
            CommunityTile(community: community)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.primaryBackground)
                .onTapGesture {
                    store.send(.communityTapped(community))
                }
                .swipeActions(edge: .trailing) {
                    Button(role: .destructive) {
                        store.send(.unjoinTapped(community))
                    } label: {
                        Label("Leave", systemImage: "person.badge.minus")
                    }
                }
        }
    }
}

#Preview("Empty State") {
    NavigationStack {
        JoinedCommunitiesView(
            store: Store(initialState: {
                var state = JoinedCommunitiesFeature.State(user: .mock)
                state.suggestedCommunities = .mocks
                return state
            }()) {
                JoinedCommunitiesFeature()
            }
        )
    }
}

#Preview("Full State") {
    NavigationStack {
        JoinedCommunitiesView(
            store: Store(initialState: {
                var state = JoinedCommunitiesFeature.State(user: .mock)
                state.joinedCommunities = .mocks
                return state
            }()) {
                JoinedCommunitiesFeature()
            }
        )
    }
}
