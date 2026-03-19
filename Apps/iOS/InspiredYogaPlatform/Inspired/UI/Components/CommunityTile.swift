import SwiftUI

public struct CommunityTile: View {
    let community: Community
    
    public init(community: Community) {
        self.community = community
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(community.name)
                        .font(.headline)
                        .foregroundColor(.primaryText)
                    Text(community.description)
                        .font(.subheadline)
                        .foregroundColor(.secondaryText)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondaryText)
            }
            
            HStack {
                Label("\(community.engagementScore)", systemImage: "person.2")
                Spacer()
                Text(community.location_prefix)
            }
            .font(.caption)
            .foregroundColor(.secondaryText)
        }
        .padding()
        .background(Color.primarySurface)
        .cornerRadius(12)
    }
}

#Preview {
    CommunityTile(community: .mock)
        .padding()
        .background(Color.primaryBackground)
}
