# UserFlows.md - Inspired UI Testing & VoiceOver Verification

This file defines the critical user paths for UI testing and the screen-by-screen requirements for VoiceOver/Accessibility verification.

---

## 1. Critical User Flows (UI Tests)
*These tests validate functional paths and system integration.*

### 1.1 App Launch & Session Restoration
- **Goal:** Verify that the app correctly routes the user based on their session state.
- **Scenario A: Fresh Install / No Session**
    1. Launch app with `TEST_RESET_SESSION=YES`.
    2. Verify Splash Screen/Loader appears briefly.
    3. Verify app routes to **Login Screen**.
- **Scenario B: Persistent Session**
    1. Authenticate a user (e.g., via Google).
    2. Terminate and Relaunch the app.
    3. Verify app routes directly to the **Community Feed** (Mock for now).
- **Test ID:** `app.launch_routing`

### 1.2 Login Screen Arrival
- **Goal:** Verify the app launches and displays the Login screen correctly.
- **Steps:**
    1. Launch the app.
    2. Wait for the Logo to appear.
    3. Verify "login.title" and "login.googleButton" are visible.
- **Test ID:** `login.initial_load`

---

## 2. VoiceOver & Accessibility Screen Capture
*These tests focus on the accessibility hierarchy and screen-specific UI states.*

### 2.1 Login Screen (VoiceOver)
- **Goal:** Capture the accessibility layer of the Login screen for AI analysis.
- **Components to Verify:**
    - Logo (Image/Placeholder)
    - Title & Subtitle (Headers)
    - Google & Email Buttons (Trait: Button)
    - Legal Links (Trait: Link)
- **Status:** [ ] Pending Analysis
- **Artifacts:** `Accessibility/LoginScreen.txt`, `Accessibility/LoginScreen.png`
