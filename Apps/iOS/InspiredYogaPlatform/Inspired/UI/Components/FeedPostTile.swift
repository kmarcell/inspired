import SwiftUI

public struct FeedPostTile: View {
    let post: Post
    
    public init(post: Post) {
        self.post = post
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Avatar, Username, Time, Area
            HStack(alignment: .top, spacing: 12) {
                AvatarView(size: 32)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(post.author.username)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primaryText)
                    
                    Text("2h ago") // TODO: Use actual relative time
                        .font(.caption2)
                        .foregroundColor(.secondaryText)
                }
                
                Spacer()
                
                Text(post.source.name)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.secondaryText)
                    .padding(.vertical, 4)
                    .padding(.horizontal, 8)
                    .background(Color.primaryText.opacity(0.05))
                    .cornerRadius(8)
            }
            
            // Content
            Text(post.content)
                .font(.body)
                .foregroundColor(.primaryText)
                .lineLimit(4)
                .multilineTextAlignment(.leading)
            
            // Stats Footer
            HStack(spacing: 20) {
                Label("\(post.stats.likeCount)", systemImage: "heart")
                Label("\(post.stats.commentCount)", systemImage: "bubble.right")
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Share")
            }
            .font(.caption)
            .foregroundColor(.secondaryText)
        }
        .padding(16)
        .background(Color.primarySurface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.primaryText.opacity(0.05), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(post.author.username), \(post.content), \(post.stats.likeCount) likes, \(post.stats.commentCount) comments")
    }
}

#Preview {
    VStack(spacing: 20) {
        FeedPostTile(post: .mock)
        FeedPostTile(post: .mockShort)
    }
    .padding()
    .background(Color.primaryBackground)
}
