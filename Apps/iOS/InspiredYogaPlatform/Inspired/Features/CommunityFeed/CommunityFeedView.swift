import ComposableArchitecture
import SwiftUI

public struct CommunityFeedView: View {
    let store: StoreOf<CommunityFeedFeature>
    
    public init(store: StoreOf<CommunityFeedFeature>) {
        self.store = store
    }
    
    public var body: some View {
        Section {
            ForEach(store.posts) { post in
                FeedPostTile(post: post)
                    .accessibilityIdentifier("feed.post.\(post.id)")
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.primaryBackground)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    .onTapGesture {
                        store.send(.postTapped(id: post.id))
                    }
            }
        }
    }
}

#Preview {
    List {
        CommunityFeedView(
            store: Store(initialState: CommunityFeedFeature.State(user: .mock)) {
                CommunityFeedFeature()
            }
        )
    }
    .listStyle(.plain)
}
