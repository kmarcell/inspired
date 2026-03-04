# ACCESSIBILITY_IMPROVEMENTS.md

This file tracks accessibility issues identified by AI analysis of VoiceOver hierarchies and screenshots.
Format: `[Platform] -> [Screen Name] -> [Issue] -> [Action] -> [Status]`

---

## Login Screen
- **[iOS]** -> **LoginScreen** -> **Redundant Legal Links** -> **Action:** The "Privacy Policy" and "Terms and Conditions" appear as both static text (in the footer prefix) and separate buttons. Consolidate these into a single, clear interactive element or ensure the static text is not focusable if it's just a label for the buttons. -> **[Addressed]** Grouped with `.accessibilityElement(children: .ignore)` and custom label.
- **[iOS]** -> **LoginScreen** -> **Fragmented Footer Text** -> **Action:** The text "By logging in or creating an account, you accept our Privacy Policy & Terms and Conditions" is split into multiple static text elements. Group these into a single accessibility element with a custom action or use `accessibilityLabel` to read the full sentence seamlessly. -> **[Addressed]** Applied custom label to footer stack.
- **[iOS]** -> **LoginScreen** -> **Missing Button Hints** -> **Action:** "Sign in with Google", "Log in with Email", and "Create Account" buttons lack `accessibilityHint`s explaining what happens when tapped (e.g., "Signs you in using your Google account"). -> **[Addressed]** Added specific hints.
- **[iOS]** -> **LoginScreen** -> **"LOGO" Placeholder** -> **Action:** The text "LOGO" is read aloud. If this is a decorative image, use `.accessibilityHidden(true)`. If it's the app logo, use `.accessibilityLabel("Inspired App Logo")`. -> **[Addressed]** Applied `.accessibilityHidden(true)` to the logo container.
- **[iOS]** -> **LoginScreen** -> **"or" Divider** -> **Action:** The "or" text between buttons is focusable. It should likely be decorative and ignored by VoiceOver (`.accessibilityHidden(true)`). -> **[Addressed]** Applied `.accessibilityHidden(true)` to the divider stack.
- **[iOS]** -> **LoginScreen** -> **Low Contrast Status Colors** -> **Action:** Success/Error text used pure neon green (#00FF00) and red (#FF0000) which fail WCAG 2.1 AA contrast requirements against white backgrounds. -> **[Addressed]** Implemented appearance-aware `statusConfirmation` and `statusFailure` colors with deeper tones for light mode and vibrant tones for dark mode.
- **[iOS]** -> **LoginScreen** -> **Hardcoded Accessibility Hints** -> **Action:** Button `accessibilityHint`s were hardcoded strings, preventing translation for non-English users. -> **[Addressed]** Localized all hints via `strings.json`.
- **[iOS]** -> **LoginScreen** -> **Success State Visual Hierarchy** -> **Action:** The "Magic Link Sent" message was floating text with low visual weight. -> **[Addressed]** Implemented "Status Pill" design with icons and themed background fills to improve visual focus and contrast.
