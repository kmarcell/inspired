#!/usr/bin/env bash
# ==============================================================================
# DigitalOcean Droplet Self-Hosted GitHub Actions Runner Setup Script
#
# PURPOSE:
# This script provisions a fresh Ubuntu 22.04/24.04 LTS DigitalOcean Droplet
# to act as a self-hosted GitHub Actions runner for the Inspired Yoga Platform.
#
# USAGE OPTIONS:
# Option A (Cloud-Init / User Data - Recommended):
#   Paste the contents of this script into the "User Data" field when creating
#   the Droplet in the DigitalOcean Console. It will execute automatically on first boot.
#
# Option B (SSH Execution):
#   1. SSH into your newly created Droplet: ssh root@<DROPLET_IP>
#   2. Run: bash setup-droplet-runner.sh
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo " DigitalOcean Droplet Self-Hosted GitHub Runner Setup"
echo "========================================================"

# 1. Non-interactive frontend setup
export DEBIAN_FRONTEND=noninteractive

# 2. Update system packages
echo "--> Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git build-essential jq unzip tar

# 3. Install Node.js 20 LTS & pnpm globally on the Droplet
echo "--> Installing Node.js LTS and pnpm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# 4. Create dedicated 'runner' system user
echo "--> Creating dedicated 'runner' user..."
if ! id -u runner >/dev/null 2>&1; then
    useradd -m -s /bin/bash runner
    echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/runner
fi

# 5. Prepare Actions Runner installation directory
RUNNER_DIR="/actions-runner"
echo "--> Setting up runner directory at ${RUNNER_DIR}..."
mkdir -p "${RUNNER_DIR}"
chown -R runner:runner "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

# 6. Download latest official GitHub Actions runner package
RUNNER_VERSION="2.317.0"
echo "--> Downloading GitHub Runner package v${RUNNER_VERSION}..."
su - runner -c "cd ${RUNNER_DIR} && curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
su - runner -c "cd ${RUNNER_DIR} && tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

echo "========================================================"
echo " DigitalOcean Droplet Environment Ready!"
echo ""
echo " FINAL REGISTRATION STEP (Manual Tapped via GitHub UI):"
echo " 1. Go to your GitHub repository Settings > Actions > Runners > New runner"
echo " 2. Copy the registration token"
echo " 3. SSH into this Droplet as 'runner' user and run:"
echo "      cd /actions-runner"
echo "      ./config.sh --url https://github.com/kmarcell/inspired --token <TOKEN>"
echo "      sudo ./svc.sh install runner"
echo "      sudo ./svc.sh start"
echo "========================================================"
