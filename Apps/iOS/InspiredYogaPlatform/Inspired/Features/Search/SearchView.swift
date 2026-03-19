import ComposableArchitecture
import SwiftUI

public struct SearchView: View {
    let store: StoreOf<SearchFeature>
    @Environment(\.dismiss) var dismiss
    
    public init(store: StoreOf<SearchFeature>) {
        self.store = store
    }
    
    public var body: some View {
        @Bindable var store = store
        VStack(spacing: 0) {
            // Search Bar
            HStack(spacing: 12) {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondaryText)
                    TextField("search.placeholder", text: $store.query)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .submitLabel(.search)
                        .accessibilityIdentifier("search.textField")
                    }
                    .padding(8)
                    .background(Color.primarySurface)
                    .cornerRadius(10)

                    Button("search.cancel") {
                    dismiss()
                    }
                    .foregroundColor(.accentColor)
                    .accessibilityIdentifier("search.cancelButton")
                    }
                    .padding()
                    .background(Color.primaryBackground)

                    // Content
                    List {
                    if store.isLoading {
                    Section {
                        HStack {
                            Spacer()
                            CircularLoaderView(configuration: .init(
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
                        .accessibilityIdentifier("search.loading")
                    }
                    } else if store.query.isEmpty {
                    // Discovery Mode
                    Section {
                        ForEach(store.suggestedCommunities) { community in
                            CommunityTile(community: community)
                                .listRowSeparator(.hidden)
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                .listRowBackground(Color.primaryBackground)
                                .onTapGesture {
                                    store.send(.suggestionTapped(community))
                                }
                                .accessibilityIdentifier("search.suggestion.\(community.id)")
                        }
                    } header: {
                        Text("search.discovery.title")
                            .font(.headline)
                            .foregroundColor(.primaryText)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .accessibilityIdentifier("search.discovery.header")
                    }

                    .textCase(nil)
                } else if let error = store.error {
                    Section {
                        ContentUnavailableView(
                            "search.error.title",
                            systemImage: "exclamationmark.triangle",
                            description: Text(error)
                        )
                        .listRowBackground(Color.primaryBackground)
                        .listRowSeparator(.hidden)
                    }
                } else if store.results.isEmpty {
                    Section {
                        ContentUnavailableView.search(text: store.query)
                            .listRowBackground(Color.primaryBackground)
                            .listRowSeparator(.hidden)
                    }
                } else {
                    // Results
                    Section {
                        ForEach(store.results) { result in
                            Group {
                                switch result {
                                case let .community(community):
                                    CommunityTile(community: community)
                                case let .studio(studio):
                                    StudioTile(studio: studio)
                                }
                            }
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowBackground(Color.primaryBackground)
                            .onTapGesture {
                                store.send(.resultTapped(result))
                            }
                        }
                    }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color.primaryBackground)
        }
        .onAppear {
            store.send(.onAppear)
        }
    }
}

#Preview {
    SearchView(
        store: Store(initialState: SearchFeature.State(currentAreaPrefix: "W12")) {
            SearchFeature()
        }
    )
}
