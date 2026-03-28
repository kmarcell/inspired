import SwiftUI

public struct SearchEntryBar: View {
    @Binding var query: String
    let onCancel: () -> Void
    
    public init(query: Binding<String>, onCancel: @escaping () -> Void) {
        self._query = query
        self.onCancel = onCancel
    }
    
    public var body: some View {
        HStack(spacing: R.Spacing.standardHorizontal) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondaryText)
                TextField("search.placeholder", text: $query)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .submitLabel(.search)
                    .accessibilityIdentifier("search.textField")
            }
            .padding(R.Spacing.minimum)
            .background(Color.primarySurface)
            .cornerRadius(R.Radius.standardCorner)

            Button("search.cancel") {
                onCancel()
            }
            .foregroundColor(.accentColor)
            .accessibilityIdentifier("search.cancelButton")
        }
        .padding([.horizontal, .top])
        .background(Color.primaryBackground)
    }
}

#Preview {
    SearchEntryBar(query: .constant(""), onCancel: {})
}
