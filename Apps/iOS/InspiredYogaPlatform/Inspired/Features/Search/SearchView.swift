import ComposableArchitecture
import SwiftUI

public struct SearchView: View {
    @Bindable var store: StoreOf<SearchFeature>
    @Environment(\.dismiss) var dismiss

    public init(store: StoreOf<SearchFeature>) {
        self.store = store
    }

    public var body: some View {
        VStack(spacing: 0) {
            SearchEntryBar(
                query: $store.query,
                onCancel: { dismiss() }
            )

            List {
                if store.isLoading {
                    loadingSection
                } else if store.query.isEmpty {
                    discoverySection
                } else if let error = store.error {
                    errorSection(error)
                } else if store.results.isEmpty {
                    noResultsSection
                    if !store.suggestedCommunities.isEmpty {
                        discoverySection
                    }
                } else {
                    resultsSection
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color.primaryBackground)
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
            .padding(.top, R.Spacing.standardVertical)
            .listRowBackground(Color.primaryBackground)
            .listRowSeparator(.hidden)
            .accessibilityIdentifier("search.loading")
        }
    }

    @ViewBuilder
    private var discoverySection: some View {
        Section {
            ForEach(store.suggestedCommunities) { community in
                CommunityTile(community: community)
                    .listRowSeparator(.hidden)
                    .standardListRowInsets()
                    .listRowBackground(Color.primaryBackground)
                    .onTapGesture {
                        store.send(.suggestionTapped(community))
                    }
                    .accessibilityIdentifier("search.suggestion.\(community.id)")
            }
        } header: {
            Text("search.discovery.title")
                .headlineStyle()
                .accessibilityIdentifier("search.discovery.header")
        }
        .textCase(nil)
    }

    @ViewBuilder
    private func errorSection(_ error: String) -> some View {
        Section {
            ContentUnavailableView(
                "search.error.title",
                systemImage: "exclamationmark.triangle",
                description: Text(error)
            )
            .padding(.top, R.Spacing.standardVertical)
            .listRowBackground(Color.primaryBackground)
            .listRowSeparator(.hidden)
        }
    }

    @ViewBuilder
    private var noResultsSection: some View {
        Section {
            ContentUnavailableView.search(text: store.query)
                .padding(.top, R.Spacing.standardVertical)
                .listRowBackground(Color.primaryBackground)
                .listRowSeparator(.hidden)
        }
    }

    @ViewBuilder
    private var resultsSection: some View {
        Section {
            ForEach(store.results) { result in
                Group {
                    switch result {
                    case .community(let community):
                        CommunityTile(community: community)
                    case .studio(let studio):
                        StudioTile(studio: studio)
                    }
                }
                .listRowSeparator(.hidden)
                .standardListRowInsets()
                .listRowBackground(Color.primaryBackground)
                .onTapGesture {
                    store.send(.resultTapped(result))
                }
            }
        } header: {
            Text("search.results.title \(store.query)")
                .headlineStyle()
                .accessibilityIdentifier("search.results.header")
        }
    }
}

#Preview("Discovery Mode") {
    SearchView(
        store: Store(
            initialState: {
                var state = SearchFeature.State(currentAreaPrefix: "W12")
                state.suggestedCommunities = [.mock, .mock2, .mock3]
                return state
            }()
        ) {
            SearchFeature()
        }
    )
}

#Preview("Results Mode") {
    SearchView(
        store: Store(
            initialState: {
                var state = SearchFeature.State(currentAreaPrefix: "W12")
                state.query = "Zen"
                state.results = [.community(.mock), .studio(.mock)]
                return state
            }()
        ) {
            SearchFeature()
        }
    )
}
