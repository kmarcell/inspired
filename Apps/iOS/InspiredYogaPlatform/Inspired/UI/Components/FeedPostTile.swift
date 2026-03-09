import SwiftUI

public struct FeedPostTile: View {
    let post: Post
    
    public init(post: Post) {
        self.post = post
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .center, spacing: 12) {
                AvatarView(thumbnailUrl: post.author.thumbnailUrl, size: 36)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(post.author.username)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.primaryText)
                    
                    Text("2h ago") // Placeholder for actual time formatting logic
                        .font(.system(size: 12))
                        .foregroundStyle(Color.secondaryText)
                }
                
                Spacer()
                
                // Source Tag
                Text(post.source.name)
                    .font(.system(size: 10, weight: .medium))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.secondary.opacity(0.1), in: Capsule())
                    .foregroundStyle(Color.secondaryText)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            
            // Content
            Text(post.content)
                .font(.system(size: 15))
                .foregroundStyle(Color.primaryText)
                .lineSpacing(4)
                .padding(.horizontal, 16)
            
            Divider()
                .padding(.horizontal, 16)
                .padding(.top, 4)
            
            // Footer
            HStack(spacing: 24) {
                // Like Button
                Button {} label: {
                    HStack(spacing: 6) {
                        Image(systemName: "heart")
                            .font(.system(size: 16))
                        Text("\(post.stats.likeCount)")
                            .font(.system(size: 14))
                    }
                    .foregroundStyle(Color.secondaryText)
                }
                
                // Comment Button
                Button {} label: {
                    HStack(spacing: 6) {
                        Image(systemName: "bubble.right")
                            .font(.system(size: 16))
                        Text("\(post.stats.commentCount)")
                            .font(.system(size: 14))
                    }
                    .foregroundStyle(Color.secondaryText)
                }
                
                Spacer()
                
                // Share Button
                Button {} label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.secondaryText)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(Color.primarySurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.primaryText.opacity(0.05), lineWidth: 1)
        )
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
