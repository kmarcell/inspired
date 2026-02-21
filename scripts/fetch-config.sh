#!/bin/bash

# fetch-config.sh
# Usage: ./scripts/fetch-config.sh [staging|prod]

ENVIRONMENT=$1
TARGET_DIR="Apps/iOS/InspiredYogaPlatform/Inspired"
PLIST_NAME="GoogleService-Info.plist"

# Map environment to Firebase Project IDs
if [ "$ENVIRONMENT" == "staging" ]; then
    PROJECT_ID="inspired-yoga-app-staging"
elif [ "$ENVIRONMENT" == "prod" ]; then
    PROJECT_ID="inspired-yoga-app"
else
    echo "Usage: ./scripts/fetch-config.sh [staging|prod]"
    echo "Note: Local development uses the 'staging' configuration."
    exit 1
fi

echo "Fetching Firebase configuration for $ENVIRONMENT ($PROJECT_ID)..."

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

# Fetch the configuration using Firebase CLI
firebase apps:sdkconfig ios --project "$PROJECT_ID" > "$TARGET_DIR/$PLIST_NAME"

if [ $? -eq 0 ]; then
    echo "Successfully fetched $PLIST_NAME for $ENVIRONMENT."
else
    echo "Error: Failed to fetch config. Make sure you are logged in via 'firebase login'."
    exit 1
fi
