#!/bin/bash

# Script to generate type-safe Swift extensions for Assets.xcassets
# Target: Inspired/UI/DesignSystem+Assets.swift

ASSETS_DIR="Apps/iOS/InspiredYogaPlatform/Inspired/Resources/Assets.xcassets"
OUTPUT_FILE="Apps/iOS/InspiredYogaPlatform/Inspired/UI/DesignSystem+Assets.swift"

echo "🎨 Generating type-safe assets..."

cat <<EOF > "$OUTPUT_FILE"
// Generated file. Do not edit.
import SwiftUI

extension Color {
EOF

# Find all .colorset directories and extract names
# Sort alphabetically for consistency
find "$ASSETS_DIR" -name "*.colorset" | sort | while read -r color_path; do
    name=$(basename "$color_path" .colorset)
    # Filter out AccentColor if it exists to avoid conflicts with system AccentColor
    if [ "$name" != "AccentColor" ]; then
        echo "    static let $name = Color(\"$name\")" >> "$OUTPUT_FILE"
    fi
done

echo "}" >> "$OUTPUT_FILE"

echo "✅ Generated $OUTPUT_FILE"
