import ComposableArchitecture
import SwiftUI

public struct LandingPageView: View {
    let store: StoreOf<LandingPageFeature>
    
    public init(store: StoreOf<LandingPageFeature>) {
        self.store = store
    }
    
    public var body: some View {
        @Bindable var store = store
        List {
            // Section 1: Consolidated Header
            Section {
                VStack(spacing: 0) {
                    LandingHeaderView(store: store)
                    
                    Divider()
                        .background(Color.primaryText.opacity(0.05))
                    
                    // Area Label & Post Entry
                    VStack(alignment: .leading, spacing: 16) {
                        // Adaptive Area Label
                        HStack(spacing: 4) {
                            Text("landing.areaPrefix")
                                .foregroundStyle(Color.secondaryText)
                            Text(store.feed.currentArea ?? store.currentArea)
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
                }
                .listRowInsets(EdgeInsets())
                .listRowSeparator(.hidden)
            }
            
            // Section 2: Feed Content
            if store.feed.isLoading {
                FeedLoadingView()
            } else if let error = store.feed.error {
                FeedErrorView(error: error)
            } else if store.feed.posts.isEmpty && store.feed.isDiscoveryMode {
                FeedDiscoveryView(store: store.scope(state: \.feed, action: \.feed))
            } else {
                CommunityFeedView(store: store.scope(state: \.feed, action: \.feed))
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Color.primaryBackground.ignoresSafeArea())
        .navigationBarHidden(true)
        .refreshable {
            await store.send(.feed(.refresh)).finish()
        }
        .fullScreenCover(
            item: $store.scope(state: \.search, action: \.search)
        ) { searchStore in
            SearchView(store: searchStore)
        }
    }
}

#Preview {
    LandingPageView(
        store: Store(initialState: LandingPageFeature.State(user: .mock)) {
            LandingPageFeature()
        }
    )
}
