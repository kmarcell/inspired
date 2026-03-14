import ComposableArchitecture
import SwiftUI

public struct CommunityFeedView: View {
    let store: StoreOf<CommunityFeedFeature>
    
    public init(store: StoreOf<CommunityFeedFeature>) {
        self.store = store
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if store.isLoading && store.posts.isEmpty {
                // Loading Skeleton
                VStack(spacing: 16) {
                    ForEach(0..<3, id: \.self) { index in
                        FeedPostTile(post: .mock)
                            .redacted(reason: .placeholder)
                            .accessibilityIdentifier("feed.skeleton.\(index)")
                    }
                }
                .padding(.horizontal)
            } else if let error = store.error {
                ContentUnavailableView(
                    "landing.feed.error.title",
                    systemImage: "exclamationmark.triangle",
                    description: Text(error)
                )
            } else if store.isDiscoveryMode {
                discoveryView
            } else {
                feedList
            }
        }
        .onAppear {
            store.send(.onAppear)
        }
    }
    
    private var feedList: some View {
        VStack(spacing: 16) {
            ForEach(store.posts) { post in
                FeedPostTile(post: post)
                    .accessibilityIdentifier("feed.post.\(post.id)")
                    .onTapGesture {
                        store.send(.postTapped(id: post.id))
                    }
            }
        }
        .padding(.horizontal)
    }
    
    private var discoveryView: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("landing.discovery.title")
                    .font(.headline)
                    .accessibilityIdentifier("landing.discovery.title")
                Text("landing.discovery.subtitle")
                    .font(.subheadline)
                    .foregroundColor(.secondaryText)
                    .accessibilityIdentifier("landing.discovery.subtitle")
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(store.suggestedCommunities) { community in
                        VStack(alignment: .leading) {
                            Text(community.name)
                                .font(.body)
                                .fontWeight(.medium)
                            Text("\(community.engagementScore) members")
                                .font(.caption)
                                .foregroundColor(.secondaryText)
                        }
                        .padding()
                        .frame(width: 160, height: 100)
                        .background(Color.primarySurface)
                        .cornerRadius(12)
                        .accessibilityIdentifier("feed.discovery.\(community.id)")
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

#Preview {
    CommunityFeedView(
        store: Store(initialState: CommunityFeedFeature.State(user: .mock)) {
            CommunityFeedFeature()
        }
    )
}
