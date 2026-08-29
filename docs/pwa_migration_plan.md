# PWA Migration & Automated CI/CD Pipeline Plan

**Date:** 2026-08-07  
**Status:** Planned / Pending Approval  
**Target:** React + Vite + TypeScript + Tailwind CSS PWA with Firebase Hosting & GitHub Actions

---

## Executive Summary
This document defines the architecture and execution plan to migrate the Inspired Yoga Platform workflow to a modern, lightweight Progressive Web App (PWA) built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. 

The implementation preserves the native iOS codebase in `Apps/iOS/` completely untouched, while setting up automated, free-tier CI/CD pipelines via GitHub Actions with a seamless failover path to a self-hosted DigitalOcean Droplet runner.

---

## 🛠 Required Tooling & Installation Guide

Before starting implementation, the following local development tools are required:

### 1. Node.js & Package Manager (`pnpm`)
- Ensure Node.js (v20 LTS or higher) and `pnpm` are installed:
  ```bash
  node -v # Should be >= v20.0.0
  pnpm -v # Or install via: npm install -g pnpm
  ```

### 2. Firebase CLI (`firebase-tools`)
`pnpm` will manage all `Apps/PWA` project dependencies cleanly. For `firebase-tools`, you can safely use any of the following options without affecting `pnpm` local stores:
- **Option A (npm global):** `npm install -g firebase-tools`
- **Option B (pnpm global):** `pnpm add -g firebase-tools`
- **Option C (Standalone Binary - standalone & isolated):** `curl -sL https://firebase.tools | bash`
- **Option D (On-demand execution):** `pnpm dlx firebase-tools`

Verify installation:
```bash
firebase --version
```

### 3. PWA Tooling & Dependencies (Managed via `pnpm` in `Apps/PWA`)
Inside the `Apps/PWA` project folder, `pnpm` will manage:
- `vite` & `@vitejs/plugin-react`
- `typescript`
- `tailwindcss` & `@tailwindcss/vite`
- `vite-plugin-pwa` (Service Worker & Manifest generation)
- `firebase` (Firebase JS SDK v10+)

---

## Phase 0: Repository Isolation & Safety (CRITICAL)

### 0.1 Native iOS App Preservation
- All PWA source code, Vite configuration, asset files, and web-specific scripts reside in `Apps/PWA` alongside `Apps/iOS`.
- The native iOS Xcode project structure inside `Apps/iOS/` will remain completely untouched.
- Root configuration files (`firebase.json`, `.gitignore`) will be extended additively.

### 0.2 Fork Security Gating
To protect against malicious actions from external forks in public repositories:
- Workflows use strict condition gating on pull requests and branch pushes:
  ```yaml
  if: github.repository == 'kmarcell/inspired' && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository)
  ```
- Workflow default permissions are limited to read-only (`permissions: { contents: read }`).
- Deployment secrets (`FIREBASE_SERVICE_ACCOUNT_STAGING`, `FIREBASE_SERVICE_ACCOUNT_PROD`) are only accessible to runs originating from the primary repository.

---

## Phase 1: Architecture Blueprint (PWA Configuration)

### 1.1 Vite Configuration (`pwa/vite.config.ts`)
Configured with `vite-plugin-pwa` for full PWA offline support and manifest injection:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Inspired Yoga Platform',
        short_name: 'Inspired',
        description: 'Connect with yoga teachers and students near you.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
```

### 1.2 Service Worker Registration (`pwa/src/main.tsx`)
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update capability
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Phase 2: Dual-Environment Firebase Strategy

### 2.1 Firebase Initialization (`pwa/src/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2.2 Environment Configurations
- `.env.staging` template:
  ```env
  VITE_FIREBASE_API_KEY=AIzaSy...
  VITE_FIREBASE_AUTH_DOMAIN=inspired-staging.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=inspired-staging
  VITE_FIREBASE_STORAGE_BUCKET=inspired-staging.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
  VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
  ```
- `.env.production` template:
  ```env
  VITE_FIREBASE_API_KEY=AIzaSy...
  VITE_FIREBASE_AUTH_DOMAIN=inspired-prod.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=inspired-prod
  VITE_FIREBASE_STORAGE_BUCKET=inspired-prod.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
  VITE_FIREBASE_APP_ID=1:987654321:web:fedcba
  ```

### 2.3 `pwa/package.json` Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build:staging": "tsc && vite build --mode staging",
    "build:production": "tsc && vite build --mode production",
    "preview": "vite preview"
  }
}
```

---

## Phase 3: Free-Tier GitHub Actions Workflows ($0/mo)

### 3.1 Staging Deployment Workflow (`.github/workflows/deploy-staging.yml`)
```yaml
name: Deploy PWA Staging

on:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  deploy-staging:
    name: Build & Deploy Staging
    runs-on: ubuntu-latest
    if: github.repository == 'kmarcell/inspired'
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: pwa/pnpm-lock.yaml

      - name: Install PWA Dependencies
        run: pnpm install --frozen-lockfile
        working-directory: ./pwa

      - name: Lint & Type Check
        run: pnpm run build:staging
        working-directory: ./pwa

      - name: Deploy to Firebase Staging
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}'
          channelId: live
          target: staging
```

### 3.2 Production Deployment Workflow (`.github/workflows/deploy-production.yml`)
```yaml
name: Deploy PWA Production

on:
  workflow_dispatch:
    inputs:
      confirm_deploy:
        description: 'Type "DEPLOY" to confirm production deployment'
        required: true
        default: 'NO'

permissions:
  contents: read

jobs:
  deploy-production:
    name: Build & Deploy Production
    runs-on: ubuntu-latest
    if: github.repository == 'kmarcell/inspired' && github.event.inputs.confirm_deploy == 'DEPLOY'
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: pwa/pnpm-lock.yaml

      - name: Install PWA Dependencies
        run: pnpm install --frozen-lockfile
        working-directory: ./pwa

      - name: Build Production Bundle
        run: pnpm run build:production
        working-directory: ./pwa

      - name: Deploy to Firebase Production
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}'
          channelId: live
          target: production
```

---

## Phase 4: Custom Domain Mapping & Multi-Site Routing

### 4.1 Root `firebase.json` Hosting Config
```json
{
  "hosting": [
    {
      "target": "staging",
      "public": "pwa/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "production",
      "public": "pwa/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

### 4.2 Firebase CLI Target Mapping
- Configure site targets in `.firebaserc`:
  ```json
  {
    "projects": {
      "staging": "inspired-staging",
      "production": "inspired-prod"
    },
    "targets": {
      "inspired-staging": {
        "hosting": {
          "staging": ["inspired-staging-web"]
        }
      },
      "inspired-prod": {
        "hosting": {
          "production": ["inspired-prod-web"]
        }
      }
    }
  }
  ```

---

## Phase 5: DigitalOcean Escape Hatch (Self-Hosted Runner)

If GitHub Actions monthly free tier (2,000 minutes) is exhausted, switch execution to a self-hosted runner on a $4-$6/mo DigitalOcean Linux Droplet.

### 5.1 Droplet Provisioning Script (`scripts/setup-droplet-runner.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create runner user & folder
sudo useradd -m -s /bin/bash runner || true
sudo mkdir -p /actions-runner && cd /actions-runner

# Download runner package (adjust version as needed)
RUNNER_VERSION="2.317.0"
sudo curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
  https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
sudo tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# Note: Registration token must be generated via GitHub Repository Settings > Actions > Runners
echo "To complete configuration, run as runner user:"
echo "./config.sh --url https://github.com/kmarcell/inspired --token YOUR_REGISTRATION_TOKEN"
echo "sudo ./svc.sh install runner && sudo ./svc.sh start"
```

### 5.2 Workflow Migration
To switch to the self-hosted runner, change `runs-on: ubuntu-latest` to:
```yaml
runs-on: self-hosted
```

---

## Phase 6: PWA Feature Parity Implementation Roadmap (7 Steps)

| Step | Component / Layer | Key Responsibility / Feature Parity Target | Status |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Domain Types** (`Apps/PWA/src/types/index.ts`) | TypeScript models matching Swift `User`, `Post`, `Community`, `Studio` | **Completed** |
| **Step 2** | **Services Layer** (`Apps/PWA/src/services/`) | `authService.ts` & `firestoreService.ts` with 3-tier feed query & 30-item `in` batching | **Completed** |
| **Step 3** | **Auth Context** (`Apps/PWA/src/context/AuthContext.tsx`) | Session restoration state machine (`launching`, `login`, `onboarding`, `authenticated`) | **Completed** |
| **Step 4** | **Login View** (`Apps/PWA/src/components/LoginView.tsx`) | Google Auth & Magic Link email login with 60s cooldown timer | **Completed** |
| **Step 5** | **Onboarding View** (`Apps/PWA/src/components/OnboardingView.tsx`) | Display name validation ($\ge 2$ chars) & username handle prefill (`name#1234`) | **Completed** |
| **Step 6** | **Community Feed** (`Apps/PWA/src/components/CommunityFeedView.tsx`) | Post cards, 30d $\rightarrow$ 180d $\rightarrow$ Discovery Mode fallback & pull-to-refresh | **Completed** |
| **Step 7** | **Joined Communities** (`Apps/PWA/src/components/JoinedCommunitiesView.tsx`) | Summary tiles, unread indicators, and swipe-to-unjoin list | **Completed** |
