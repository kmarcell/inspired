import SwiftUI

public struct StudioTile: View {
    let studio: Studio
    
    public init(studio: Studio) {
        self.studio = studio
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(studio.name)
                        .font(.headline)
                        .foregroundColor(.primaryText)
                    Text(studio.address)
                        .font(.subheadline)
                        .foregroundColor(.secondaryText)
                        .lineLimit(1)
                }
                Spacer()
                if studio.isClaimed {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.accentColor)
                }
            }
            
            HStack {
                Label(String(format: "%.1f", studio.rating), systemImage: "star.fill")
                    .foregroundColor(.orange)
                Text("(\(studio.reviewCount))")
                Spacer()
                Text(studio.location_prefix)
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
    StudioTile(studio: .mock)
        .padding()
        .background(Color.primaryBackground)
}
