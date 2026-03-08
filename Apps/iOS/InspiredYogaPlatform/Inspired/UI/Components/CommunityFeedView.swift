import SwiftUI

public struct CommunityFeedView: View {
    public init() {}
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                ForEach(0..<5) { _ in
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.primarySurface)
                        .frame(height: 200)
                        .overlay(
                            Text("Feed Post Placeholder")
                                .foregroundStyle(Color.secondaryText.opacity(0.3))
                        )
                        .padding(.horizontal, 16)
                }
            }
            .padding(.vertical, 16)
        }
        .background(Color.primaryBackground.opacity(0.5))
    }
}

#Preview {
    CommunityFeedView()
}
