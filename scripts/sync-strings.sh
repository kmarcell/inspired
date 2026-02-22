#!/bin/bash

# Simple script to convert strings.json to iOS Localizable.strings
# Target: Inspired/Resources/Localization/{lang}/Localizable.strings

BASE_DIR="Apps/iOS/InspiredYogaPlatform/Inspired/Resources/Localization"

for lang_dir in "$BASE_DIR"/*; do
    if [ -d "$lang_dir" ]; then
        lang=$(basename "$lang_dir")
        json_file="$lang_dir/strings.json"
        strings_file="$lang_dir/Localizable.strings"
        
        if [ -f "$json_file" ]; then
            echo "🔄 Syncing $lang localization..."
            python3 -c "
import json
import os
with open('$json_file', 'r', encoding='utf-8') as f:
    data = json.load(f)
with open('$strings_file', 'w', encoding='utf-8') as f:
    for key, value in data.items():
        # Escape double quotes in value
        safe_value = value.replace('\"', '\\\"')
        f.write(f'\"{key}\" = \"{safe_value}\";\n')
"
            echo "✅ Generated $strings_file"
        fi
    fi
done
