# Inspired Yoga Platform

"Inspired" is a free-to-use platform connecting yoga teachers and students. This repository contains the iOS application built with SwiftUI and The Composable Architecture (TCA).

## Prerequisites
- Xcode 16.0+
- iOS 18.0+
- Bundle ID: `com.inspired-developers.Inspired`
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Git LFS](https://git-lfs.com/)

---

## 1. Install Firebase CLI

Choose one of the following methods:

### Method A: Using Homebrew (Recommended for macOS)
```bash
# Install Homebrew if you haven't already: https://brew.sh
brew install firebase-cli
```

### Method B: Standalone Binary (Alternative)
```bash
# Download and install via curl
curl -sL https://firebase.tools | bash

# Verify installation
firebase --version
```

### Method C: Fastlane (iOS Automation)
Fastlane is used for building, testing, and deploying the iOS app.
```bash
# Install Fastlane via Homebrew (recommended)
brew install fastlane

# Or via RubyGems (if Homebrew is not available)
# Note: You may need 'sudo' depending on your Ruby setup
sudo gem install fastlane -NV
```

---

## 2. Set Up Your Backend (GCP / Firebase)

Follow these steps to set up a new backend environment for the project.

### Step 0: Manual Project Creation (Human Action Required)
Before using any automated scripts, you must create the "containers" in the Google Cloud Console.
1.  **Create Staging:** Go to [GCP Console](https://console.cloud.google.com/) > **New Project**. Name it `inspired-staging`.
2.  **Create Production:** Repeat and name it `inspired-prod`.
3.  **Link Billing:** For each project, ensure it is linked to an active **Billing Account** (Required for Firebase "Blaze" plan and automated provisioning).
4.  **Note Project IDs:** Copy the unique **Project IDs** (e.g., `inspired-staging-123456`) as these will be needed for the Terraform and Firebase configuration.

### Step 1: Initialize Infrastructure (IaC)
Login and initialize the project components using the CLI:
```bash
# Login to your Google account
firebase login

# Initialize the project in this directory
firebase init
```
*Note: During initialization, select Firestore, Storage, and Cloud Functions. Use the IaC mandates in [GEMINI.md](./GEMINI.md) as a guide for your configuration.*

### Step 2: Automated Environment Configuration
To keep the repository open-source friendly, `GoogleService-Info.plist` is **not** checked into Git. Fetch it automatically for your own backend:
1.  **Register your iOS App** in the Firebase Console:
    - Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > General.
    - Click the **iOS+** icon to add an app.
    - **Bundle ID:** `com.inspired-developers.Inspired`.
    - **App Nickname:** "Inspired Yoga Platform".
    - **Register app:** Click the button, then click **Next** through the manual download steps (do not download it manually).
2.  **Fetch the configuration:**
```bash
# Use the fetch script to download the plist directly from your Firebase project
# This script uses 'firebase apps:sdkconfig ios' under the hood.
./scripts/fetch-config.sh [staging|prod]
```
3.  The plist will be placed in the correct location for Xcode to use during the build phase.

---

## 3. Testing the Application

### 1. Deploy to Staging
```bash
firebase use staging
./scripts/deploy.sh staging
```

### 2. Manage Test Users
1.  Go to **Authentication > Users** in the Firebase Console.
2.  Add a dedicated Google test account.
3.  Log in to the app on your simulator or device using this account.

### 3. Running Automated Tests & Builds
We use **Fastlane** to ensure consistent, automated test runs and builds.
```bash
# Run all unit and snapshot tests
fastlane test

# Build and upload the IPA to Firebase App Distribution (Staging)
fastlane deploy_staging

# Build and upload the IPA to TestFlight (Production)
fastlane deploy_prod
```

---

## 4. Firebase App Distribution (Staging)

For internal staging tests, we use Firebase App Distribution.

### 4.1 Admin Setup
1.  **Tester Group:** Go to the [Firebase Console](https://console.firebase.google.com/) > **Release & Monitor** > **App Distribution**.
2.  **Testers & Groups:** Ensure you have a group named **Staging Testers** (ID: `staging-testers`).
3.  Add the email addresses of your testers to this group.
4.  **Register Device UDIDs:** For ad-hoc distribution, you must register your testers' device UDIDs in the [Apple Developer Portal](https://developer.apple.com/account/resources/devices/list) and update your provisioning profile via `fastlane match`.
5.  **Distribute:** Run `fastlane deploy_staging` to build and upload the IPA to your testers automatically.

### 4.2 Tester Installation Guide (Step-by-Step)
If you are a tester, follow these steps to install the "Inspired" staging app on your iPhone:

1.  **Provide your UDID:** 
    - Connect your iPhone to a Mac and find the UDID in Finder.
    - Or, visit [showmyudid.com](https://showmyudid.com) on your device.
    - Send this ID to the project admin for registration.
2.  **Accept the Invitation:** 
    - You will receive an email from **Firebase App Distribution**. 
    - Open it on your iPhone and tap **Get Started**.
3.  **Install the Profile:** 
    - Firebase will ask to install a configuration profile. Tap **Allow** and then follow the prompts in **Settings > Profile Downloaded**. 
    - *Note: This profile allows Firebase to securely identify your device for ad-hoc distribution.*
4.  **Download the App:** 
    - Once the profile is installed, open the **App Distribution** web app (or the App Tester app if prompted).
    - Find "Inspired Yoga Platform" and tap **Download/Install**.
5.  **Trust the Developer (if required):**
    - Go to **Settings > General > VPN & Device Management**.
    - Under "Enterprise App" or "Developer App", tap the profile and select **Trust**.
6.  **Launch the App:** You can now open the "Inspired" app from your home screen!

---

## Maintenance & Teardown
To wipe the environment for a clean re-test:
```bash
./scripts/teardown.sh staging
```

## Documentation
- **[GEMINI.md](./GEMINI.md):** Architectural, security, and engineering mandates.
- **[ARCHITECTURE.md](./ARCHITECTURE.md):** High-level technical specification, service interactions, and usage estimates (intended for architect review).
- **[FEATURES.md](./FEATURES.md):** UI components, screen behaviors, and precise NoSQL data schemas.
