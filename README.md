# Inspired Yoga Platform

"Inspired" is a free-to-use platform connecting yoga teachers and students. This repository contains the iOS application built with SwiftUI and The Composable Architecture (TCA).

## Prerequisites
- Xcode 16.0+
- iOS 18.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)
- Bundle ID: `com.inspired-developers.Inspired`
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Git LFS](https://git-lfs.com/)

---

## 1. Install CLI Tools

### Method A: Using Homebrew (Recommended for macOS)
```bash
brew install firebase-cli xcodegen fastlane
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

## 2. Generate the iOS Project
We use **XcodeGen** to manage the Xcode project file. 
```bash
cd Apps/iOS/InspiredYogaPlatform
xcodegen generate
```
*Note: The `.xcodeproj` is generated from `project.yml` and should not be edited manually.*

---

## 3. Set Up Your Backend (GCP / Firebase)

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

#### Remote State Management (Terraform)
We store our Terraform state in a **private Google Cloud Storage (GCS) bucket** instead of Git. This ensures that sensitive infrastructure data is never committed to version control and supports state locking.

**How to create the bucket:**

*   **Option A: CLI (Requires [Google Cloud SDK](https://cloud.google.com/sdk/docs/install))**
    ```bash
    # Replace 'your-project-id' with your actual staging project ID
    gsutil mb -p your-project-id -l europe-west1 gs://your-project-id-tfstate/
    ```
*   **Option B: Manual (GCP Console)**
    1.  Go to the [GCP Storage Browser](https://console.cloud.google.com/storage/browser).
    2.  Click **Create** and name it `your-project-id-tfstate`.
    3.  Select Location Type: **Region** and Location: **`europe-west1` (Belgium)**.
    4.  Keep other defaults (Standard, Uniform access) and click **Create**.

2.  The `backend "gcs"` block in your Terraform configuration will automatically point to this bucket.

### Step 3: Automated Environment Configuration
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

## 4. Testing the Application

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

## 5. Firebase App Distribution (Staging)

For internal staging tests, we use Firebase App Distribution.

### 5.1 Admin Setup
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

## 5. Data Management & Seeding

We use automated scripts to ensure our environments have consistent data for testing and discovery.

### 5.1 Staging Environment (Mock Data)
To populate the staging environment with deterministic "Test Studios" and "Test Teachers" for UI verification:
1.  **Switch to Staging:** `firebase use staging`
2.  **Run Seeder:** `npm run seed:staging`
*Note: This script generates mock shadow profiles based on the schemas in [FEATURES.md](./FEATURES.md).*

### 5.2 Production Environment (Discovery Seeding)
To "seed" the production database with real yoga studios discovered via the Google Places API:
1.  **Switch to Production:** `firebase use prod`
2.  **Run Discovery:** `npm run seed:prod`
*Note: This script triggers a Cloud Function that searches for yoga studios in specific area codes and creates "Shadow Profiles" in Firestore.*

---

## 6. Developer Setup Checklist (Action Required)

To complete your local environment setup, please perform the following tasks:

### 🛠 immediate Setup
- [ ] **Firebase Login:** Run `firebase login` to authenticate the CLI.
- [ ] **Fetch Staging Config:** Run `./scripts/fetch-config.sh staging` to download the initial staging plist.
- [ ] **Generate Project:** Run `xcodegen generate` inside `Apps/iOS/InspiredYogaPlatform`.

### 🚀 Future Setup (Paid Apple Developer Account)
- [ ] **App Store Connect API Key:** Generate a `.p8` key in the Apple Developer Portal.
- [ ] **Fastlane Environment:** Create `Apps/iOS/InspiredYogaPlatform/fastlane/.env` based on `.env.template` and add your API Key credentials.
- [ ] **Code Signing:** Initialize `fastlane match` to manage certificates and profiles.

---

## Maintenance & Teardown

### Teardown & Rollback (Wiping the Environment)
If you need to start from a clean state or zero out all costs, you can tear down the entire infrastructure. This will delete all Firestore data, Storage blobs, and Cloud Functions.
```bash
# Use the teardown script (requires confirmation)
./scripts/teardown.sh [staging|prod]
```
**Under the hood:** This script runs `terraform destroy`, which uses the remote state in GCS to identify and remove all managed resources. After a teardown, you can run `./scripts/deploy.sh` to redeploy the entire stack from scratch.

## Documentation
- **[GEMINI.md](./GEMINI.md):** Architectural, security, and engineering mandates.
- **[ARCHITECTURE.md](./ARCHITECTURE.md):** High-level technical specification, service interactions, and usage estimates (intended for architect review).
- **[FEATURES.md](./FEATURES.md):** UI components, screen behaviors, and precise NoSQL data schemas.
