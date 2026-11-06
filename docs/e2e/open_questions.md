# Open Questions, Technical Boundaries & Architecture Considerations

**Date:** 2026-10-25  
**Parent Document:** [docs/e2e/drafts/_merged.md](file:///home/marcellkresz/developer/inspired/docs/e2e/drafts/_merged.md)  
**Document Reference:** `docs/e2e/open_questions.md`

During Phase 1 independent scenario discovery and Phase 2/3 deduplication and merging, several critical boundary conditions, feature gaps, and specifications were surfaced by the 9 subagents and prioritized user feedback. These must be reviewed before final scenario catalog sign-off.

---

## 1. User-Surfaced Constraints & Feature Gaps

### 1.1 Magic Link Authentication Testing Boundary (Email Service Dependency)
- **Problem:** Full end-to-end testing of the Magic Link login flow requires generating an out-of-band email, delivering it to an SMTP mailbox, extracting the tokenized URL, and clicking it in the browser. Without a dedicated email-capture daemon or mail testing API, this cannot be automated in browser UI regression suites without extreme flakiness.
- **Architectural Boundary Decision:**
  - **In Browser Automation (Playwright):** We automate the *in-app initiation* of the Magic Link flow:
    1. Input validation (email format, `@` and `.` checks).
    2. Request submission.
    3. Activation and countdown of the **60-second cooldown timer** (`visitor-magic-link-cooldown-throttled`).
    4. Confirmation banner rendering.
  - **For Authentication in Automation:** All automated E2E tests will use the dedicated **Dev Credentials Login** tool (`data-testid="dev-email-input"` / `data-testid="dev-password-input"`) or direct Firebase Auth emulator tokens.
  - **Manual Runbook:** The manual runbook retains the full human journey (checking external email client and tapping link).

---

### 1.2 Visiting Teachers & Dynamic Teacher Assignment UI Gap (Step 29)
- **Problem:** In the current application, studio owners can select instructors for class creation only because teachers (e.g. `user_teacher_001` Maya Sharma) are **pre-seeded** into `assignedTeachers` inside `studios.json`.
- **Feature Gap:** The PWA does not yet have a UI workflow for studio owners to search for, invite, or dynamically assign new freelance teachers to a studio roster (tracked in `TODO.md` Step 29: *Studio Teacher Onboarding & Staff Management Suite*).
- **Testing Guardrail:** All E2E scenarios validating teacher assignments (e.g. `non-teaching-owner-assigns-visiting-teacher`) must operate against pre-seeded partner relationships (`studio_shoreditch_006` with visiting teacher `user_teacher_001`). Testing dynamic teacher invitations is deferred until Step 29 is implemented.

---

### 1.3 Studio Membership Access Control & Approval Workflow Gap (Step 17)
- **Problem:** `FEATURES.md` §5.17 specifies an invite-only studio membership policy (`open_membership` vs `invite_only_approval`), a "Request to Join" workflow, and an owner approval dashboard.
- **Feature Gap:** This is completely unimplemented in the PWA (tracked in `TODO.md` Step 17).
- **Boundary Decision:** Gated studio access and join-request approvals are completely excluded from the active regression test suite. All current studios are treated as `open_membership`.

---

## 2. Technical Ambiguities Identified in Drafts

### 2.1 Under-12-Hour Class Cancellation Enforcement UI
- **Context:** `firestoreService.cancelClassBooking` implements cancellation refund logic: if cancelled $\ge 12$h before start, pass credits are refunded; if cancelled $< 12$h, the seat is forfeited and no credit is returned.
- **Ambiguity:** What UI warning or confirmation modal should display when a student attempts to cancel $< 12$h before class? Currently, the cancellation button performs the cancellation without an explicit penalty confirmation dialog.
- **Proposal:** Author scenario `yogi-cancel-booking-late-penalty-warning` in Phase 4 once the UI warning modal is designed.

---

### 2.2 Teacher Schedule Modal Booking Integration Handler
- **Context:** In `UnifiedProfileView.tsx`, tapping "View Full Schedule" opens `TeacherScheduleModal.tsx`.
- **Resolution (Remediated in Issue #9):** Connected `onBookClass` from `UnifiedProfileView` to `TeacherScheduleModal`, triggering `BookingPassSelectionModalView` and executing `bookClassWithPass`. Scenario `yogi-book-class-from-teacher-schedule-modal` is now fully automated and passing in `yogi_smoke.spec.ts`.

---

### 2.3 Front-Desk Pass Granting Permissions (`AdminGrantPassModalView`) & Assigned Studio Teachers
- **Context:** `AdminGrantPassModalView` allows granting passes and credits with a stepper.
- **Specification Clarification & Product Mandate:**
  - In addition to studio owners, **assigned studio teachers** (`studio.assignedTeachers`) must be authorized to record in-person walk-in cash payments and grant class passes/credits for the specific studios where they teach.
  - This capability will be rolled out as part of **Phase 13 / Step 29** (*Studio Teacher Onboarding & Staff Management Suite*).
  - **Testing Boundary:** Automated UI regression tests for teacher pass-granting are **skipped** for now; current automation validates pass-granting via studio owners (`studio-owner-grant-pass-walkin-stepper`). Once Step 29 is built, assigned teacher pass-granting tests will be enabled.

---

### 2.4 Rolling 7-Day Class Feed Boundary vs Monday–Sunday Calendar Week
- **Context:** The in-page "🧘 Classes" sub-tab on `UnifiedProfileView` displays classes within a rolling 7-day window (`now` to `now + 7 days`). The studio timetable (`StudioScheduleView.tsx`) displays fixed Monday-to-Sunday calendar weeks.
- **Tracked Design Action:** Tracked on `TODO.md` (`align-class-calendar-window`) and `ROADMAP.md` as an upcoming alignment item to clarify whether in-page teacher feeds should adopt fixed Monday–Sunday calendar navigation or retain rolling 7-day lookaheads. E2E tests will validate the current rolling 7-day filter until updated.

---

## 3. Seed Gaps Summary (Consolidated for Phase 4)

To automate all 123 canonical scenarios without flakiness or manual setup, the following seed additions are required:

| Target Persona / Entity | Required State | Unblocks Scenarios |
| :--- | :--- | :--- |
| `user_sarah` (or clone) | Pass with `expiresAt < now` | `yogi-book-class-expired-pass-excluded` |
| `studio_askew_001` (or clone) | Class with `capacity: 1`, `bookedCount: 1` | `yogi-book-full-class-join-waitlist`, `yogi-leave-class-waitlist` |
| `studio_chelsea_004` (or clone) | Studio with `operatingStatus: 'temp_closed'` | `yogi-studio-profile-temporary-closure-notice`, `yogi-schedule-closed-studio-bookings-blocked` |
| `user_teacher_private` | Teacher with `isProfilePublic: false` | `teacher-private-profile-shields-personal-info`, `yogi-subscribe-unlock-private-teacher-profile` |
| `claim_pending_seed` | Studio claim with `status: 'pending'` | `platform-admin-approve-shadow-claim`, `platform-admin-reject-shadow-claim` |
