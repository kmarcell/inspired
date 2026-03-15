import SwiftUI

struct FeedLoadingView: View {
    var body: some View {
        ForEach(0..<3, id: \.self) { index in
            FeedPostTile(post: .mock)
                .redacted(reason: .placeholder)
                .accessibilityIdentifier("feed.skeleton.\(index)")
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets())
                .padding(.horizontal)
                .padding(.bottom, 16)
        }
    }
}

#Preview {
    List {
        FeedLoadingView()
    }
    .listStyle(.plain)
}
