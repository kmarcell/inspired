import ComposableArchitecture
import Foundation
import UIKit

public enum MediaError: Error, Equatable {
    case permissionDenied
    case networkError
}

@DependencyClient
public struct MediaClient: Sendable {
    public var loadImage: @Sendable (URL) async throws -> UIImage
    
    // Fallback UI helper
    public var permissionDeniedImage: UIImage {
        UIImage(systemName: "person.crop.circle.badge.exclamationmark") ?? UIImage(systemName: "person.circle")!
    }
}

extension MediaClient: DependencyKey {
    public static let liveValue = Self(
        loadImage: { url in
            let (data, response) = try await URLSession.shared.data(from: url)
            
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 403 {
                throw MediaError.permissionDenied
            }
            
            guard let image = UIImage(data: data) else {
                throw MediaError.networkError
            }
            
            return image
        }
    )
}

extension MediaClient: TestDependencyKey {
    public static let previewValue = Self(
        loadImage: { _ in UIImage(systemName: "photo")! }
    )

    public static let testValue = Self()
}

extension DependencyValues {
    public var mediaClient: MediaClient {
        get { self[MediaClient.self] }
        set { self[MediaClient.self] = newValue }
    }
}
