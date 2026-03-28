import SwiftUI

public enum R {

    public enum Spacing {

        /// Standard horizontal padding used across the app (16pt)
        public static let standardHorizontal: CGFloat = 16

        /// Standard vertical spacing between elements (8pt)
        public static let standardVertical: CGFloat = 8

            /// Miminum padding used across the app (8pt)
        public static let minimum: CGFloat = 8
    }

    public enum Radius {

        /// Standard corner radius for cards and fields (10pt)
        public static let standardCorner: CGFloat = 10
    }
}

extension EdgeInsets {
    /// Standard insets for list rows containing card-like tiles
    public static let standardListRow = EdgeInsets(
        top: R.Spacing.standardVertical,
        leading: R.Spacing.standardHorizontal,
        bottom: R.Spacing.standardVertical,
        trailing: R.Spacing.standardHorizontal
    )
}

extension View {
    /// Applies standard list row insets for tiles
    public func standardListRowInsets() -> some View {
        self.listRowInsets(.standardListRow)
    }
}
