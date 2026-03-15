import SnapshotTesting
import SwiftUI
import UIKit
@testable import Inspired

extension ViewImageConfig {
    public static let iPhone16Pro = ViewImageConfig(
        safeArea: UIEdgeInsets(top: 59, left: 0, bottom: 34, right: 0),
        size: CGSize(width: 393, height: 852),
        traits: UITraitCollection(mutations: { mutableTraits in
            mutableTraits.displayScale = 3
        })
    )
}

public enum SnapshotTheme: String, CaseIterable {
    case light, dark
    
    public var colorScheme: ColorScheme {
        self == .light ? .light : .dark
    }
    
    public var userInterfaceStyle: UIUserInterfaceStyle {
        self == .light ? .light : .dark
    }
}

@MainActor
public func assertSnapshot<V: View>(
    of view: V,
    theme: SnapshotTheme,
    testName: String,
    record: Bool = false,
    file: StaticString = #file,
    line: UInt = #line
) {
    let view = view
        .environment(\.colorScheme, theme.colorScheme)
        .background(Color.primaryBackground)
        .frame(width: ViewImageConfig.iPhone16Pro.size?.width)

    let vc = UIHostingController(rootView: view)
    vc.view.frame = CGRect(origin: .zero, size: ViewImageConfig.iPhone16Pro.size ?? .zero)
    vc.overrideUserInterfaceStyle = theme.userInterfaceStyle
    
    // Set explicit background colors to ensure consistency across environments
    vc.view.backgroundColor = theme == .dark ? UIColor.black : UIColor.white

    assertSnapshot(
        of: vc,
        as: .image(on: .iPhone16Pro),
        named: theme.rawValue,
        record: record,
        file: file,
        testName: testName,
        line: line
    )
}
