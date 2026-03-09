import SwiftUI

public struct AvatarView: View {
    let thumbnailUrl: URL?
    let size: CGFloat
    
    public init(thumbnailUrl: URL? = nil, size: CGFloat = 40) {
        self.thumbnailUrl = thumbnailUrl
        self.size = size
    }
    
    public var body: some View {
        ZStack {
            Circle()
                .fill(Color.primarySurface)
                .frame(width: size, height: size)
                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
            
            if let _ = thumbnailUrl {
                // Future image loading logic
                placeholderImage
            } else {
                placeholderImage
            }
        }
    }
    
    private var placeholderImage: some View {
        Image(systemName: "person.crop.circle.fill")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: size * 0.8, height: size * 0.8)
            .foregroundStyle(Color.secondaryText.opacity(0.6))
    }
}

#Preview {
    HStack(spacing: 20) {
        AvatarView(size: 32)
        AvatarView(size: 40)
        AvatarView(size: 60)
    }
    .padding()
    .background(Color.primaryBackground)
}
