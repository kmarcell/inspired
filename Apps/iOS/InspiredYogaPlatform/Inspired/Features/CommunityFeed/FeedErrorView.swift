import SwiftUI

struct FeedErrorView: View {
    let error: String
    
    var body: some View {
        ContentUnavailableView(
            "landing.feed.error.title",
            systemImage: "exclamationmark.triangle",
            description: Text(error)
        )
        .listRowSeparator(.hidden)
    }
}

#Preview {
    List {
        FeedErrorView(error: "Something went wrong")
    }
}
