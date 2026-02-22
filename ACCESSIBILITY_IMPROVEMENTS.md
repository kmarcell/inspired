# ACCESSIBILITY_IMPROVEMENTS.md

This file tracks accessibility issues identified by AI analysis of VoiceOver hierarchies and screenshots.
Format: `[Screen Name] -> [Issue] -> [Action] -> [Status]`

---

## Login Screen
- **LoginScreen** -> **Redundant Legal Links** -> **Action:** The "Privacy Policy" and "Terms and Conditions" appear as both static text (in the footer prefix) and separate buttons. Consolidate these into a single, clear interactive element or ensure the static text is not focusable if it's just a label for the buttons. -> **[Addressed]** Grouped with `.accessibilityElement(children: .ignore)` and custom label.
- **LoginScreen** -> **Fragmented Footer Text** -> **Action:** The text "By logging in or creating an account, you accept our Privacy Policy & Terms and Conditions" is split into multiple static text elements. Group these into a single accessibility element with a custom action or use `accessibilityLabel` to read the full sentence seamlessly. -> **[Addressed]** Applied custom label to footer stack.
- **LoginScreen** -> **Missing Button Hints** -> **Action:** "Sign in with Google", "Log in with Email", and "Create Account" buttons lack `accessibilityHint`s explaining what happens when tapped (e.g., "Signs you in using your Google account"). -> **[Addressed]** Added specific hints.
- **LoginScreen** -> **"LOGO" Placeholder** -> **Action:** The text "LOGO" is read aloud. If this is a decorative image, use `.accessibilityHidden(true)`. If it's the app logo, use `.accessibilityLabel("Inspired App Logo")`. -> **[Addressed]** Applied `.accessibilityHidden(true)` to the logo container.
- **LoginScreen** -> **"or" Divider** -> **Action:** The "or" text between buttons is focusable. It should likely be decorative and ignored by VoiceOver (`.accessibilityHidden(true)`). -> **[Addressed]** Applied `.accessibilityHidden(true)` to the divider stack.
