import SnapshotTesting
import UIKit

extension ViewImageConfig {
    public static let iPhone16Pro = ViewImageConfig(
        safeArea: UIEdgeInsets(top: 59, left: 0, bottom: 34, right: 0),
        size: CGSize(width: 393, height: 852),
        traits: UITraitCollection(mutations: { mutableTraits in
            mutableTraits.displayScale = 3
        })
    )
}
