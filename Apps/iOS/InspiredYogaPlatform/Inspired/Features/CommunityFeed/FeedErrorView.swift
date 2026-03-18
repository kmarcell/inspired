import SwiftUI

struct FeedErrorView: View {
    let error: String
    
    var body: some View {
        Section {
            ContentUnavailableView(
                "landing.feed.error.title",
                systemImage: "exclamationmark.triangle",
                description: Text(error)
            )
            .listRowSeparator(.hidden)
            .listRowBackground(Color.primaryBackground)
        }
    }
}

#Preview {
    List {
        FeedErrorView(error: "Something went wrong")
    }
}
