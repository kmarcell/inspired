import ComposableArchitecture
import Foundation
import UIKit

@DependencyClient
public struct MediaClient: Sendable {
    public var loadImage: @Sendable (URL) async throws -> UIImage
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
