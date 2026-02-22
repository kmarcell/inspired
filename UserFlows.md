# UserFlows.md - Inspired UI Testing & VoiceOver Verification

This file defines the critical user paths for UI testing and the screen-by-screen requirements for VoiceOver/Accessibility verification.

---

## 1. Critical User Flows (UI Tests)
*These tests validate functional paths and system integration.*

### 1.1 Login Screen Arrival
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
