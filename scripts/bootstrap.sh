#!/bin/bash

# bootstrap.sh - Initialize the Inspired development environment
# This script prepares the project for local development and testing.

set -e # Exit on error

echo "🚀 Bootstrapping Inspired Yoga Platform..."

# 1. Root Dependencies
echo "📦 Installing root dependencies..."
npm install --silent

# 2. Local Secret Initialization
if [ ! -f ".env" ]; then
    echo "🔑 Creating local .env file..."
    echo "TEST_USER_PASSWORD=local_$(openssl rand -hex 8)" > .env
    echo "✅ Created .env with a generated password."
else
    if grep -q "TEST_USER_PASSWORD=" .env; then
        echo "ℹ️  TEST_USER_PASSWORD already exists in .env. Skipping."
    else
        echo "🔑 Adding TEST_USER_PASSWORD to existing .env..."
        echo "TEST_USER_PASSWORD=local_$(openssl rand -hex 8)" >> .env
        echo "✅ Added password to .env."
    fi
fi

# 3. Backend Scaffolding
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
