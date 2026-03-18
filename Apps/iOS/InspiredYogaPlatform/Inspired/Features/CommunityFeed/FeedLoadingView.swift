import SwiftUI

struct FeedLoadingView: View {
    var body: some View {
        Section {
            ForEach(0..<3, id: \.self) { index in
                FeedPostTile(post: .mock)
                    .redacted(reason: .placeholder)
                    .accessibilityIdentifier("feed.skeleton.\(index)")
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.primaryBackground)
                    .padding(.horizontal)
                    .padding(.bottom, 16)
            }
        }
    }
}

#Preview {
    List {
        FeedLoadingView()
    }
    .listStyle(.plain)
}
