#!/bin/bash

# bootstrap.sh - Initialize the Inspired development environment
# This script prepares the project for local development and testing.

set -e # Exit on error

echo "🚀 Bootstrapping Inspired Yoga Platform..."

# 1. Root Dependencies
echo "📦 Installing root dependencies..."
npm install --silent

# 2. Backend Scaffolding
if [ -d "infrastructure/backend/functions" ]; then
    echo "📦 Installing Cloud Functions dependencies..."
    cd infrastructure/backend/functions && npm install --silent && cd ../../../
fi

# 3. Synchronization & Generation
echo "🔄 Synchronizing localization..."
./scripts/sync-strings.sh

echo "🎨 Generating design system assets..."
./scripts/generate-assets.sh

# 4. Xcode Project Generation
if command -v xcodegen &> /dev/null; then
    echo "⚙️  Generating Xcode project..."
    cd Apps/iOS/InspiredYogaPlatform && xcodegen generate && cd ../../../
else
    echo "⚠️  xcodegen not found. Please install it (brew install xcodegen) and run 'xcodegen generate' in Apps/iOS/InspiredYogaPlatform."
fi

echo "✅ Bootstrap complete! You are ready to develop."
echo "💡 To connect to the cloud, run: ./scripts/fetch-config.sh [staging|prod]"
