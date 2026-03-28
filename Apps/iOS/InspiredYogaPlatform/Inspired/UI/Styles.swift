import Foundation
import SwiftUI

extension Text {

    func headlineStyle() -> some View {
        self
            .font(.headline)
            .foregroundStyle(Color.secondaryText)
            .padding(.horizontal, R.Spacing.standardHorizontal)
    }
}
