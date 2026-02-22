# Inspired Yoga Platform

"Inspired" is a free-to-use platform connecting yoga teachers and students. This repository contains the iOS application built with SwiftUI and The Composable Architecture (TCA).

## Prerequisites
- Xcode 16.0+
- iOS 18.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)
- [Java Runtime](https://www.java.com/) (`brew install openjdk`) - *Required for Firebase Emulator*
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

### Step 2: Automated Environment Configuration
To keep the repository open-source friendly, `GoogleService-Info.plist` is **not** checked into Git. Fetch it automatically for your own backend:
1.  **Register your iOS App** in the Firebase Console:
    - Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > General.
    - Click the **iOS+** icon to add an app.
    - **Bundle ID:** `com.inspired-developers.Inspired.staging` (Staging) / `com.inspired-developers.Inspired` (Prod).
    - **App Nickname:** "Inspired Yoga Platform".
    - **Register app:** Click the button, then click **Next** through the manual download steps (do not download it manually).
2.  **Fetch the configuration:**
```bash
# Fetch the staging plist (used for both Local and Staging tiers)
./scripts/fetch-config.sh staging
```
3.  The plist will be placed in the correct location for Xcode to use during the build phase.

---

## 4. 3-Tier Environment Strategy

We use a 3-tier environment structure to ensure safe development, thorough testing, and stable production releases.

| Environment | Xcode Scheme | Target Backend | Configuration | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `Inspired (Local)` | **Firebase Emulator** | `Debug (Local)` | Day-to-day TDD and UI coding. Zero cost. |
| **Staging** | `Inspired (Staging)` | **Firebase Staging (GCP)**| `Debug/Release (Staging)` | Integration testing with real cloud services. |
| **Production** | `Inspired (Production)` | **Firebase Production (GCP)** | `Debug/Release (Production)`| Real users, TestFlight, and App Store. |

### 4.1 Working with the Local Emulator
The Local environment uses the **Firebase Emulator Suite** to run a complete backend on your Mac.

1.  **Start the Emulator:**
```bash
# Run this from a DEDICATED system terminal (not via the Gemini CLI shell)
firebase emulators:start
```
2.  **Stop the Emulator:** Press **`Ctrl + C`** in your terminal window.
3.  **Deploy Rules & Indexes:** 
    Before running tests, ensure your local emulator has the latest security rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes --export-on-exit ./emulator_data
```
3.  **View Emulator UI:** Open [http://localhost:4000](http://localhost:4000) to manage your local database and auth users.
4.  **Xcode Setup:** Select the **`Inspired (Local)`** scheme. The app will automatically connect to your local machine.

---

## 5. Testing & Deployment (Fastlane)

We use **Fastlane** to ensure consistent, automated test runs and builds across all tiers.

### 5.1 Running Automated Tests
The `test` lane runs all unit and snapshot tests against the **Local Emulator**.
```bash
# Ensure the emulator is running (Step 4.1) then:
fastlane test
```

### 5.2 Deploying to Staging (Firebase)
1.  **Deploy Infrastructure:** `./scripts/deploy.sh staging` (Deploys Cloud Functions/Rules to GCP).
2.  **Distribute App:** `fastlane deploy_staging` (Builds and uploads IPA to testers).
3.  **Manage Testers:** Go to **Authentication > Users** in the Firebase Console to manage staging identities.

### 5.3 Deploying to Production (TestFlight)
```bash
# Build and upload the IPA to TestFlight
fastlane deploy_prod
```

---

## 6. Firebase App Distribution (Staging)

For internal staging tests, we use Firebase App Distribution.

### 6.1 Admin Setup
1.  **Tester Group:** Go to the [Firebase Console](https://console.firebase.google.com/) > **Release & Monitor** > **App Distribution**.
2.  **Testers & Groups:** Ensure you have a group named **Staging Testers** (ID: `staging-testers`).
3.  Add the email addresses of your testers to this group.
4.  **Register Device UDIDs:** For ad-hoc distribution, you must register your testers' device UDIDs in the [Apple Developer Portal](https://developer.apple.com/account/resources/devices/list) and update your provisioning profile via `fastlane match`.
5.  **Distribute:** Run `fastlane deploy_staging` to build and upload the IPA to your testers automatically.

### 6.2 Tester Installation Guide (Step-by-Step)
1.  **Provide your UDID:** Visit [showmyudid.com](https://showmyudid.com) on your device and send it to the admin.
2.  **Accept the Invitation:** Open the email from Firebase and tap **Get Started**.
3.  **Install the Profile:** Tap **Allow** and then follow prompts in **Settings > Profile Downloaded**. 
4.  **Download the App:** Open the App Distribution web app and tap **Download/Install**.
5.  **Trust the Developer:** Go to **Settings > General > VPN & Device Management** and select **Trust** for the developer profile.

---

## 7. Data Management & Seeding

We use deterministic JSON files in `infrastructure/seeds/` to manage our test data.

### 7.1 Seeding the Local Emulator
This populates the local database running on your Mac.
1.  Ensure the emulator is running (`firebase emulators:start`).
2.  Run the seeder targeting localhost:
```bash
npm run seed:local
```

### 7.2 Seeding the Staging Environment (Cloud)
This populates the real Google Cloud database for shared testing.
1.  Switch to staging: `firebase use staging`
2.  Run the cloud seeder:
```bash
npm run seed:staging
```

### 7.3 Wipe & Reset (Clean State)
To delete all data and start over:
*   **Local:** Simply stop the emulator and restart it (if not using `--import`).
*   **Staging:** `firebase firestore:delete --all-collections`

## 8. Support & Issue Reporting Setup

We use an external Google Form to manage bug reports and support requests.

### 8.1 Create the Form
1.  Go to [Google Forms](https://forms.google.com).
2.  Create a new form with the following fields:
    - **Issue Category** (Dropdown: Bug, Content, Account, Other).
    - **Description** (Paragraph).
    - **User ID** (Short Answer - *This will be automated*).
3.  **Get Pre-filled Link:**
    - Click the vertical three-dot menu (top right) > **Get pre-filled link**.
    - Type a placeholder `USER_ID_GOES_HERE` in the User ID field and click **Get link**.
    - The app will use this URL format to inject the actual `userId` (or `nil`) when the user taps "Report an Issue".

---

## 9. Developer Setup Checklist

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

---

## Documentation
- **[GEMINI.md](./GEMINI.md):** Architectural, security, and engineering mandates.
- **[ARCHITECTURE.md](./ARCHITECTURE.md):** High-level technical specification, service interactions, and usage estimates (intended for architect review).
- **[FEATURES.md](./FEATURES.md):** UI components, screen behaviors, and precise NoSQL data schemas.
- **[ROADMAP.md](./ROADMAP.md):** Strategic plan and task tracking.
