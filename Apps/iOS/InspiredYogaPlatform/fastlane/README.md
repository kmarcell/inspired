fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios seed_emulator

```sh
[bundle exec] fastlane ios seed_emulator
```

Seed the local emulator with initial data

### ios test

```sh
[bundle exec] fastlane ios test
```

Run all unit and snapshot tests (Local Emulator)

### ios deploy_staging

```sh
[bundle exec] fastlane ios deploy_staging
```

Deploy a new version to Firebase App Distribution (Staging)

### ios analyze_accessibility

```sh
[bundle exec] fastlane ios analyze_accessibility
```

Analyze Accessibility (Generate Hierarchy & Screenshots)

### ios deploy_prod

```sh
[bundle exec] fastlane ios deploy_prod
```

Deploy a new version to TestFlight (Production)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
