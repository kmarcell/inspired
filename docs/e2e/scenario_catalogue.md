# Phase 4: Final E2E Regression Scenario Catalogue (Playwright)

**Date:** 2026-10-25  
**Status:** Prioritised, Scored & Filtered (Ready for User Review & Spec Authoring)  
**Total Retained Scenarios:** 111 (out of 123 canonical merged scenarios)  
**Total Cut Scenarios:** 12  

---

## 1. Executive Summary & Suite Architecture

- **Suite Tiers:**
  - **`smoke` (P0 - 40 scenarios):** Run on every pull request. Covers critical paths: Dev auth, cold-start session restore, core postcode search, class booking with pass credit deduction, 12h cancellation credit refund, multi-studio schedule viewing, non-teaching owner class scheduling, and standalone currency management.
  - **`regression` (P0 + P1 - 100 scenarios):** Run on merge to `main` and pre-release staging deployments. Covers standard user journeys, boundary conditions, custom currency isolation, temporary closures, and shadow studio claims.
  - **`extended` (P2 - 11 scenarios):** Nightly or pre-major release test run. Covers theme toggling, issue reporting link prefill, empty states, and minor edge boundaries.

- **Breakdown by Actor:**
  - **Yogi (Student / Visitor):** 53 scenarios
  - **Teacher:** 20 scenarios
  - **Studio Owner & Admin:** 38 scenarios

---

## 2. Cut List (Filtered Scenarios & Rationale)

| Scenario ID | Actor | Original Priority | Rationale for Cut |
| :--- | :--- | :--- | :--- |
| `visitor-login-empty-password-disabled` | `yogi` | **P1** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `visitor-magic-link-invalid-email-rejected` | `yogi` | **P1** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `visitor-onboarding-name-boundary-accepted` | `yogi` | **P2** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `visitor-onboarding-public-profile-forces-avatar-public` | `yogi` | **P2** | Low impact (1) and low likelihood (1) edge case already tested in component tests |
| `yogi-search-clear-input-resets` | `yogi` | **P2** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `teacher-view-classes-tab-empty-state` | `teacher` | **P2** | Low impact (1) and low likelihood (1) edge case already tested in component tests |
| `teacher-multi-postcode-badge-truncation` | `teacher` | **P2** | Low impact (1) and low likelihood (1) edge case already tested in component tests |
| `teacher-enforce-bio-charlimit-truncation` | `teacher` | **P2** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `yogi-book-class-from-teacher-schedule-modal` | `teacher` | **P0** | Skipped pending production code gap remediation (tracked in TODO.md / ROADMAP.md) |
| `studio-owner-create-currency-empty-title-fails` | `studio-owner` | **P2** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `studio-owner-grant-pass-empty-recipient-fails` | `studio-owner` | **P2** | Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk) |
| `studio-owner-delete-brand-network-modal-abort` | `studio-owner` | **P2** | Low impact (1) and low likelihood (1) edge case already tested in component tests |

---

## 3. Retained Scenario Catalogue by Actor

### Actor: YOGI (53 Scenarios)

#### visitor-login-wrong-password-fails — Visitor attempts login with incorrect password and is blocked with error
- **ID:** visitor-login-wrong-password-fails
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.1
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Valid registered user email exists.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Visitor on login view with dev password tool enabled.
- **Steps:**
  - Given the visitor enters email "user_sarah@inspired.test"
  - When they enter incorrect password "incorrect_pass_999!" and tap "Log In"
  - Then the auth submission fails with error "Invalid credentials" or "auth/wrong-password"
  - And the visitor remains unauthenticated on the login screen
- **Isolation:** `shared`
- **Data / reset notes:** None (auth failure rejected by emulator).
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-auth-dev-login-success — Yogi authenticates via Dev credentials and accesses application shell
- **ID:** yogi-auth-dev-login-success
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.1, §5.2
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Seeded active yogi account exists with valid dev password.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Logged out visitor arrives on Login screen.
- **Steps:**
  - Given the visitor is on the login view
  - When they enter valid email "user_sarah@inspired.test" and the dev test password
  - And they tap "Log In"
  - Then the application authenticates and transitions to the Landing Page shell
  - And displays greeting "Sarah Jenkins" with user avatar and search bar in the header
- **Isolation:** `shared`
- **Data / reset notes:** None (read-only authentication session).
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-book-class-no-pass-triggers-store — Yogi with 0 credits attempts booking and is redirected to Currency Store checkout modal
- **ID:** yogi-book-class-no-pass-triggers-store
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** valid-failure
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Newbie has 0 passes in wallet.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none (Newbie holds 0 passes)
- **Preconditions (Given):** Newbie navigates to Askew schedule.
- **Steps:**
  - Given Newbie views an open class and taps "[ Book ]"
  - When pass lookup finds 0 valid passes in wallet
  - Then "No Valid Pass Available" modal appears
  - And clicking "Purchase Pass 💳" opens CurrencyStoreCheckoutModalView showing studio pricing tiers
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-book-class-with-pass-success — Returning yogi books open class redeeming active pass credit
- **ID:** yogi-book-class-with-pass-success
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.20
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sarah holds active 5-pack pass with 4 credits for Affordable London Yoga brand.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none (Sarah holds pass_sarah_brand_5pack with 4 credits)
- **Preconditions (Given):** Sarah is logged in and viewing Askew Road Zen Den schedule.
- **Steps:**
  - Given Sarah views an open Vinyasa Flow class with 5/15 spots booked
  - When she taps "[ Book ]"
  - Then BookingPassSelectionModalView opens displaying her 5-Class Pack (4 credits remaining)
  - And when she confirms booking
  - Then class booking record is created in Firestore
  - And pass remainingCredits decrements from 4 to 3
  - And schedule button transitions to "✓ Booked"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes booking and restores pass remainingCredits.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-booking-pass-selector-filters-custom-currency — Pass selector modal filters out passes incompatible with studio custom currency policy
- **ID:** yogi-booking-pass-selector-filters-custom-currency
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `2/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Sarah holds Affordable London brand pass; Chelsea studio operates under custom_override.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah views Chelsea Sanctuary Studio schedule.
- **Steps:**
  - Given Sarah attempts booking at Chelsea studio (custom policy)
  - When pass selection checks eligibility
  - Then her Affordable London brand pass is excluded because Chelsea does not accept brand passes
  - And "No Compatible Pass" warning modal appears
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-cancel-class-booking-refund — Yogi cancels class booking >= 12h before start and pass credit is refunded to wallet
- **ID:** yogi-cancel-class-booking-refund
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.20
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sarah has booked class starting > 12h in future.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** pre-existing booking created >=12h in advance
- **Preconditions (Given):** Sarah viewing booked class on timetable.
- **Steps:**
  - Given Sarah has a booked class ("✓ Booked") scheduled tomorrow (>12h away)
  - When she taps "✓ Booked" button to trigger cancellation modal
  - And confirms "Cancel Booking"
  - Then booking record is cancelled in Firestore
  - And 1 credit is refunded back to her pass balance
  - And button updates back to "[ Book ]"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores test state.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-cold-start-session-restore — Authenticated yogi reloads application and session is restored automatically
- **ID:** yogi-cold-start-session-restore
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.1.1, UserFlows.md §1.1
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User is actively authenticated in browser storage.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Authenticated user refreshes browser or relaunches app.
- **Steps:**
  - Given Sarah Jenkins is logged into the application
  - When the page is hard refreshed (cold start)
  - Then splash loader briefly appears while auth state initializes
  - And application directly routes to authenticated feed without presenting login screen
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-feed-view-unified-stream — Yogi views chronological feed stream of joined communities and area posts
- **ID:** yogi-feed-view-unified-stream
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.3
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Sarah is member of Askew community with seeded posts.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah logged in on Community Feed tab.
- **Steps:**
  - Given Sarah navigates to feed
  - When feed loads
  - Then post tiles render with author avatar, display name, handle, source community badge, content text, and relative timestamp
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-joined-communities-view-list — Yogi views list of joined communities and navigates to community profile
- **ID:** yogi-joined-communities-view-list
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.10
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Sarah is member of Askew Community.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah clicks "My Communities" in navigation header.
- **Steps:**
  - Given Sarah opens Joined Communities view
  - When communities load
  - Then Askew Community summary tile is displayed
  - And clicking the tile navigates to UnifiedProfileView for Askew community
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-logout-session-terminated — Yogi logs out cleanly and application returns to login view
- **ID:** yogi-logout-session-terminated
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.1, §5.8
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Authenticated user session active.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Logged in on application.
- **Steps:**
  - Given the yogi is authenticated
  - When they tap user profile and select "Sign Out"
  - Then session token is revoked and user profile is cleared from context
  - And app redirects back to Login view displaying dev credentials inputs
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-onboarding-complete-profile — First-time yogi completes onboarding, validates handle, and enters feed
- **ID:** yogi-onboarding-complete-profile
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.4
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Freshly registered Firebase Auth account with no existing Firestore /users/{uid} document.
- **Suggested test user:** NEW: user_onboard_fresh (UID with no profile)
- **Seed gap:** Auth user record without Firestore profile document
- **Preconditions (Given):** App detects missing profile and redirects to OnboardingView.
- **Steps:**
  - Given an authenticated user arrives on onboarding view
  - When they enter display name "Elena Fox"
  - Then generated handle preview displays "@elena_fox#XXXX"
  - And when they tap "Complete Setup"
  - Then Firestore document /users/{uid} is created with privacy defaults
  - And app navigates to CommunityFeedView
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes cloned /users/{uid} document and Auth account.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-schedule-unjoined-book-join-prompt — Unjoined yogi attempting to book class is prompted with Join Studio modal
- **ID:** yogi-schedule-unjoined-book-join-prompt
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User is not joined to studio community.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** Newbie navigates to Askew schedule.
- **Steps:**
  - Given Newbie views an open class at unjoined studio
  - When they tap "[ Book ]"
  - Then modal "Join Studio to Book" appears explaining membership is required
  - And clicking "Join & Continue" joins the studio and opens the pass selection modal
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores unjoined state.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-schedule-view-7day-calendar — Yogi navigates 7-day studio timetable selector and views classes for selected date
- **ID:** yogi-schedule-view-7day-calendar
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Studio Askew has classes scheduled across multiple days.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah on Timetable tab.
- **Steps:**
  - Given Sarah views Timetable tab with week switcher and 7 day selector pills
  - When she taps Wednesday pill
  - Then schedule updates to show classes scheduled for Wednesday
  - And class tiles display start time, climate preset icon, title, instructor link, and booking status
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-search-by-postcode-prefix — Yogi searches outward postcode prefix and sees local studios ranked first
- **ID:** yogi-search-by-postcode-prefix
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Askew Road Zen Den seeded at postcode W12 9AS.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi focuses header search bar.
- **Steps:**
  - Given yogi types "W12" or "w12" into search input
  - When results resolve
  - Then Askew Road Zen Den and W12 Askew Area Community are ranked at top of results
  - And tapping Askew Road Zen Den navigates to its StudioProfileView
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-search-discovery-initial-state — Yogi opens Search view and sees Discovery Mode suggestions with category badges
- **ID:** yogi-search-discovery-initial-state
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Seeded communities, studios, and areas exist.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi navigates to Search tab with empty query input.
- **Steps:**
  - Given the yogi is on the Search screen
  - When search query input is empty
  - Then "Discovery Mode" header is displayed
  - And curated suggestions appear with badges: 👥 Community, 🏢 Studio, 📍 Area
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-studio-profile-cascading-join — Yogi joins studio branch executing atomic cascading join of parent brand network
- **ID:** yogi-studio-profile-cascading-join
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Chiswick studio belongs to Affordable London Yoga brand; user is not a member.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** Newbie navigates to Chiswick studio profile.
- **Steps:**
  - Given Newbie views unjoined Chiswick studio with button "[ Join Studio ＋ ]"
  - When they tap "Join Studio"
  - Then button toggles to "✓ Joined"
  - And user profile joinedCommunities atomically receives both Chiswick studio and Affordable London Yoga brand IDs
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores unjoined state.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-studio-profile-view-details — Yogi views studio profile header details, teachers carousel, and tabs
- **ID:** yogi-studio-profile-view-details
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Studio Askew Road Zen Den seeded with teacher Maya Sharma.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi navigates to Askew Road Zen Den profile.
- **Steps:**
  - Given yogi opens studio profile
  - When page loads
  - Then hero cover banner, operating status badge "● Open", and parent brand badge render
  - And "Teachers at this Studio" carousel displays Maya Sharma card with photo and name
  - And sub-tab switcher displays "Timetable", "About", and "Members"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-view-public-teacher-profile — Yogi views public teacher profile credentials, rolling 7-day classes, and multi-studio schedule button
- **ID:** yogi-view-public-teacher-profile
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Maya Sharma seeded with isTeacher: true.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none (Maya Sharma seeded)
- **Preconditions (Given):** Sarah opens Maya Sharma UnifiedProfileView.
- **Steps:**
  - Given Sarah navigates to Maya Sharma teacher profile
  - When profile loads
  - Then verified checkmark, handle, "🧘 Teacher" badge, and bio render
  - And "🧘 Classes" sub-tab displays rolling 7-day classes taught across Askew, Ravenscourt, and Shoreditch
  - And clicking "View Full Schedule" opens TeacherScheduleModal
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### yogi-view-teacher-multi-studio-schedule-modal — Yogi opens Teacher Schedule Modal from teacher profile and filters by partner studio
- **ID:** yogi-view-teacher-multi-studio-schedule-modal
- **Actor:** yogi
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Maya Sharma teaches across multiple studios.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah viewing Maya Sharma profile.
- **Steps:**
  - Given Sarah taps "View Full Schedule" on Maya Sharma profile
  - When TeacherScheduleModal opens
  - Then horizontal studio location filter pills render ("All Studios", "Askew Road", "Ravenscourt", "Shoreditch")
  - And selecting "Ravenscourt" filters the schedule to display only classes at Ravenscourt
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts)

#### visitor-magic-link-cooldown-throttled — Visitor requests magic link and 60-second cooldown timer throttles retries
- **ID:** visitor-magic-link-cooldown-throttled
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.1
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Valid email address entered.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Visitor on login screen.
- **Steps:**
  - Given the visitor enters email "user_sarah@inspired.test" in magic link field
  - When they tap "Send Magic Link"
  - Then confirmation toast "Check your email" appears
  - And the send button is disabled with a 60-second countdown timer
  - And subsequent taps within 60s are blocked
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** partial (UI cooldown timer automated; out-of-band email delivery is manual runbook only)

#### visitor-maintenance-mode-barrier — Remote Config maintenance mode activates non-dismissible maintenance screen
- **ID:** visitor-maintenance-mode-barrier
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8 (Maint)
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Remote config is_maintenance_mode set to active: true.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** Remote Config is_maintenance_mode flag
- **Preconditions (Given):** Visitor attempts to access application.
- **Steps:**
  - Given application detects active maintenance flag
  - When any route is navigated
  - Then non-dismissible maintenance screen displays maintenance title, message, and expected return time
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### visitor-onboarding-profane-name-rejected — Onboarding blocks offensive display names via Cloud Function moderation
- **ID:** visitor-onboarding-profane-name-rejected
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.4
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User on onboarding view.
- **Suggested test user:** NEW: user_onboard_fresh
- **Seed gap:** Auth user without profile
- **Preconditions (Given):** Display name input focused.
- **Steps:**
  - Given user enters prohibited or profane word in display name
  - When Cloud Function validateDisplayName evaluates name
  - Then rejection message "Display name contains inappropriate content" displays and profile creation halts
- **Isolation:** `clone`
- **Data / reset notes:** Teardown removes test user.
- **Platforms:** both
- **Automation status:** unit-only (OnboardingView.test.tsx)

#### visitor-onboarding-short-name-rejected — Onboarding rejects display names shorter than 2 characters
- **ID:** visitor-onboarding-short-name-rejected
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.4
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User on onboarding screen.
- **Suggested test user:** NEW: user_onboard_fresh
- **Seed gap:** Auth user without profile
- **Preconditions (Given):** Display name input is focused.
- **Steps:**
  - Given user enters single character "A" as display name
  - When they attempt to submit
  - Then error notice "Display name must be at least 2 characters" appears and submission is blocked
- **Isolation:** `clone`
- **Data / reset notes:** Teardown removes test Auth account.
- **Platforms:** both
- **Automation status:** unit-only (OnboardingView.test.tsx)

#### visitor-staging-login-uninvited-blocked — Uninvited visitor email is rejected on staging environment by whitelist gate
- **ID:** visitor-staging-login-uninvited-blocked
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.13
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** App running with staging access gating enabled.
- **Suggested test user:** NEW: user_uninvited_staging
- **Seed gap:** uninvited email string for test assertion
- **Preconditions (Given):** Visitor attempts login with non-whitelisted email.
- **Steps:**
  - Given the visitor enters an email not present in staging whitelist
  - When they attempt to authenticate
  - Then access is denied with message "Access restricted to invited staging testers"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-book-class-expired-pass-excluded — Yogi holding expired pass cannot select it during booking
- **ID:** yogi-book-class-expired-pass-excluded
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** User holds pass with expiresAt in the past.
- **Suggested test user:** NEW: user_sarah_expired_pass
- **Seed gap:** pass with expiresAt < now
- **Preconditions (Given):** User taps book on open class.
- **Steps:**
  - Given user holds an expired 5-class pass
  - When booking pass selector modal opens
  - Then expired pass is disabled or omitted from selectable radio options
  - And user cannot confirm booking with expired pass
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes test pass.
- **Platforms:** both
- **Automation status:** unit-only (BookingPassSelectionModalView.test.tsx)

#### yogi-book-class-unlimited-pass-intact — Yogi booking with unlimited subscription pass creates booking with zero credit deduction
- **ID:** yogi-book-class-unlimited-pass-intact
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Elena holds active unlimited pass.
- **Suggested test user:** user_elena (Elena Rostova)
- **Seed gap:** none (Elena holds Staff Unlimited Pass)
- **Preconditions (Given):** Elena books class at Chiswick Hot Yoga.
- **Steps:**
  - Given user selects class to book with active Unlimited Membership pass
  - When booking transaction commits
  - Then booking is confirmed ("✓ Booked")
  - And pass balance remains unlimited without decrementing
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created booking.
- **Platforms:** both
- **Automation status:** unit-only (firestoreService.test.ts)

#### yogi-book-full-class-join-waitlist — Yogi joins waitlist when class reaches full capacity without upfront credit deduction
- **ID:** yogi-book-full-class-join-waitlist
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Class capacity is 1 and bookedCount is 1.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** class with capacity == bookedCount
- **Preconditions (Given):** Sarah views full class.
- **Steps:**
  - Given class capacity is full (1/1 booked)
  - When Sarah views schedule tile, button displays "Join Waitlist"
  - And when she taps "Join Waitlist"
  - Then waitlist booking record is created in Firestore
  - And button updates to "# Waitlisted"
  - And no pass credit is deducted upfront
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes waitlist booking.
- **Platforms:** both
- **Automation status:** none

#### yogi-book-past-class-disabled — Yogi cannot book a class session scheduled in the past
- **ID:** yogi-book-past-class-disabled
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Class session timestamp is earlier than current time.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** class session with startTime in past
- **Preconditions (Given):** Yogi views timetable on past date.
- **Steps:**
  - Given a class session that has already finished
  - When yogi views class tile
  - Then booking button is disabled with text "Class Finished" or hidden
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-dev-store-purchase-pass-activation — Yogi simulates pass purchase in development store and pass activates in wallet
- **ID:** yogi-dev-store-purchase-pass-activation
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Newbie has 0 passes.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** Newbie in CurrencyStoreCheckoutModalView.
- **Steps:**
  - Given Newbie views studio currency catalog tiers in store modal
  - When they select 5-Class Pack (£65) and tap "Simulate Purchase (Dev)"
  - Then new user_pass document is created in Firestore
  - And success notification appears confirming 5 credits available
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes purchased pass.
- **Platforms:** both
- **Automation status:** none

#### yogi-feed-empty-area-3tier-fallback — Feed executes 3-tier discovery fallback when recent local posts are absent
- **ID:** yogi-feed-empty-area-3tier-fallback
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.3
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Clean-slate user in area with 0 posts in last 30 days.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** User loads feed.
- **Steps:**
  - Given feed finds 0 posts in Tier 1 (30 days)
  - When it falls back to Tier 2 (180 days) and finds 0 posts
  - Then it automatically transitions to Tier 3 (Discovery Mode recommendations) displaying "Explore Nearby Communities"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CommunityFeedView.test.tsx)

#### yogi-feed-post-avatar-privacy-fallback — Feed post by author with groups-only privacy displays fallback avatar to non-members
- **ID:** yogi-feed-post-avatar-privacy-fallback
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.3.1
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Post author has avatarPrivacy: "groups-only".
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** Non-group-member views post.
- **Steps:**
  - Given a post rendered from a user with groups-only avatar privacy
  - When viewer does not share any mutual community with author
  - Then placeholder community-only avatar is rendered without fetching binary image
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (FeedPostTile.tsx)

#### yogi-joined-communities-leave-community — Yogi leaves a joined community via overflow menu without forfeiting class passes
- **ID:** yogi-joined-communities-leave-community
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.10, §5.15
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sarah holds pass for studio and is member of studio community.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah opens My Communities.
- **Steps:**
  - Given Sarah views Askew studio community in My Communities
  - When she taps the 3-dots overflow menu and selects "Leave Community"
  - Then community is removed from her joined list
  - And her active studio credit passes remain intact in her pass wallet
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores membership.
- **Platforms:** both
- **Automation status:** unit-only (JoinedCommunitiesView.test.tsx)

#### yogi-pass-wallet-view-active-passes — Yogi audits active passes, credit counts, and expiration dates in Digital Wallet
- **ID:** yogi-pass-wallet-view-active-passes
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sarah holds seeded pass.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah opens UserPassWalletView.
- **Steps:**
  - Given Sarah navigates to Digital Pass Wallet
  - When wallet loads
  - Then active pass card renders with title "5-Class Pack"
  - And displays "4 / 5 credits remaining"
  - And displays valid expiration date
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (UserPassWalletView.test.tsx)

#### yogi-profile-edit-bio — Yogi updates personal bio in profile settings and verifies character limit enforcement
- **ID:** yogi-profile-edit-bio
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User is authenticated.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah opens Profile screen.
- **Steps:**
  - Given Sarah opens Bio editor in Profile settings
  - When she enters new bio text
  - Then character counter displays remaining allowance (max 280 chars)
  - And saving updates Firestore /users/{uid} document
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets bio.
- **Platforms:** both
- **Automation status:** unit-only (ProfileView.test.tsx)

#### yogi-profile-toggle-privacy-settings — Yogi configures granular privacy toggles and public search constraint sync
- **ID:** yogi-profile-toggle-privacy-settings
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** User authenticated.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah opens Profile settings.
- **Steps:**
  - Given Sarah views privacy switches
  - When she toggles isProfilePublic, avatarPrivacy, or showJoinedGroups
  - Then settings persist in Firestore
  - And toggling profile public automatically synchronizes avatar privacy to public
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores privacy defaults.
- **Platforms:** both
- **Automation status:** unit-only (ProfileView.test.tsx)

#### yogi-schedule-closed-studio-bookings-blocked — Bookings are disabled on schedule when studio is temporarily closed
- **ID:** yogi-schedule-closed-studio-bookings-blocked
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio operatingStatus is temp_closed.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** studio with temp_closed status
- **Preconditions (Given):** Sarah views studio schedule.
- **Steps:**
  - Given studio is temporarily closed
  - When yogi inspects class rows on schedule
  - Then "[ Book ]" buttons are rendered disabled with label "Closed" or "Paused"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-schedule-view-class-info-modal — Yogi opens Class Info Modal and inspects room climate presets and details
- **ID:** yogi-schedule-view-class-info-modal
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Published class exists on schedule with climate metadata.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi viewing class row on schedule.
- **Steps:**
  - Given yogi taps "ⓘ" info button on Hot Vinyasa class row
  - When ClassInfoModal overlay opens
  - Then modal displays title, teacher name, category, duration, and room climate preset badge (e.g. "🔥 35°C Hot Studio")
  - And tapping close button "✕" dismisses the modal
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (ClassInfoModal.test.tsx)

#### yogi-schedule-view-custom-currency-badge — Studio schedule class tile displays Custom Currency Acceptance badge when restricted
- **ID:** yogi-schedule-view-custom-currency-badge
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16, §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Studio class configured with currencyAcceptancePolicy: "custom".
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** class with custom currency acceptance policy
- **Preconditions (Given):** Yogi views timetable.
- **Steps:**
  - Given a masterclass configured to accept Drop-In only
  - When class row renders in schedule
  - Then badge "Custom Currency Only" or "Drop-In Only" is visible on the tile
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-search-by-area-name — Yogi searches area name and finds matching neighborhood communities
- **ID:** yogi-search-by-area-name
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Seeded area community Chiswick exists.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi on search view.
- **Steps:**
  - Given yogi searches "Chiswick"
  - When search executes
  - Then Chiswick Community tile and Chiswick Hot Yoga Studio appear in result list
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (SearchView.test.tsx)

#### yogi-search-no-results-discovery-fallback — Unmatched search query displays empty notice with Discovery Mode fallback recommendations
- **ID:** yogi-search-no-results-discovery-fallback
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** None.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Yogi enters random gibberish query.
- **Steps:**
  - Given yogi searches "ZX99INVALID"
  - When search resolves with 0 matches
  - Then message "No results found for ZX99INVALID" appears
  - And "Explore Suggested Communities Near You" recommendations are displayed below
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (SearchView.test.tsx)

#### yogi-search-unclaimed-shadow-studio — Yogi views unclaimed shadow studio tile with "Claim Studio" button prompt
- **ID:** yogi-search-unclaimed-shadow-studio
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9, §5.12
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Seeded studio with isClaimed: false exists.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none (shadow studio exists in seeds)
- **Preconditions (Given):** Yogi searches shadow studio name.
- **Steps:**
  - Given yogi searches "Shoreditch" or shadow studio name
  - When search tile renders
  - Then unclaimed studio displays badge "Unclaimed Profile" and button "Claim Studio 🏢"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (SearchView.test.tsx)

#### yogi-shell-header-navigation-audit — Responsive navigation shell renders desktop sidebar vs mobile sticky header
- **ID:** yogi-shell-header-navigation-audit
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.2, §5.8
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User authenticated.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Browser viewport adjusted between 390px (mobile) and 1280px (desktop).
- **Steps:**
  - Given viewport is at 1280px desktop width
  - Then fixed desktop sidebar and wide search bar render
  - And when viewport resized to 390px mobile width
  - Then mobile sticky header with compact icons and bottom/top navigation renders
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts)

#### yogi-studio-members-privacy-enforcement — Studio members directory enforces privacy masking for private user profiles
- **ID:** yogi-studio-members-privacy-enforcement
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.3.1
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio has public member and private member.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah opens "Members" sub-tab on studio profile.
- **Steps:**
  - Given Sarah navigates to Members tab of studio
  - When members list loads
  - Then public members show clickable row with avatar and handle leading to UnifiedProfileView
  - And private members show generic placeholder without clickable profile link
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (StudioMembersView.test.tsx)

#### yogi-studio-profile-temporary-closure-notice — Yogi views studio with temporary closure notice and custom manager notes
- **ID:** yogi-studio-profile-temporary-closure-notice
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio configured with temp_closed status and closure notice string.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** studio with operatingStatus: "temp_closed"
- **Preconditions (Given):** Yogi opens temporarily closed studio profile.
- **Steps:**
  - Given yogi views studio profile with operatingStatus: "temp_closed"
  - When page renders
  - Then amber banner displays "Temporarily Closed: {customNote}"
  - And class booking action buttons on timetable are disabled
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-view-private-teacher-profile-guard — Yogi views private teacher profile displaying privacy lock shield while studio classes remain visible
- **ID:** yogi-view-private-teacher-profile-guard
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19, §5.8
- **Type:** edge
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Teacher profile configured with isProfilePublic: false.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** teacher with isProfilePublic: false
- **Preconditions (Given):** Unsubscribed yogi navigates to teacher profile.
- **Steps:**
  - Given yogi views private teacher profile
  - When page loads
  - Then privacy lock shield "🔒 This Profile is Private" is displayed
  - And bio and private feed are concealed
  - While teacher classes on public studio timetables remain visible and bookable
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (UnifiedProfileView.test.tsx)

#### yogi-view-teacher-classes-rolling-7day-cap — Teacher profile classes sub-tab caps class listing to rolling 7-day window
- **ID:** yogi-view-teacher-classes-rolling-7day-cap
- **Actor:** yogi
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Teacher has classes scheduled within 7 days and beyond 7 days.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** teacher with classes on day 8+
- **Preconditions (Given):** Sarah views Classes sub-tab.
- **Steps:**
  - Given teacher has sessions scheduled across 14 days
  - When in-page Classes sub-tab renders
  - Then only sessions falling within next 7 days are listed in the feed
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (UnifiedProfileView.test.tsx)

#### yogi-feed-post-like-toggle — Yogi likes and unlikes a feed post updating like counter
- **ID:** yogi-feed-post-like-toggle
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.3
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Post exists on feed.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah viewing feed post.
- **Steps:**
  - Given Sarah views a feed post with 2 likes
  - When she taps the heart icon
  - Then like counter increments to 3 and heart highlights
  - And when she taps again, counter decrements back to 2
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets post like counter.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-joined-communities-empty-state — Clean-slate yogi with 0 communities views empty state with join recommendations
- **ID:** yogi-joined-communities-empty-state
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.10
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User has joined 0 communities.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** User opens My Communities.
- **Steps:**
  - Given Yoga Newbie opens Joined Communities view
  - When view renders
  - Then notice "You haven't joined any communities yet" appears
  - And recommendations list with "Join" buttons is displayed
- **Isolation:** `clone`
- **Data / reset notes:** Reset joined communities to empty.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-leave-class-waitlist — Yogi leaves class waitlist updating button back to Join Waitlist
- **ID:** yogi-leave-class-waitlist
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** User is currently on waitlist for class.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** user with active waitlist entry
- **Preconditions (Given):** Sarah views class on schedule.
- **Steps:**
  - Given Sarah has waitlisted a full class ("# Waitlisted")
  - When she taps the button and confirms "Leave Waitlist"
  - Then waitlist document is deleted in Firestore
  - And button restores to "Join Waitlist"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets state.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-pass-wallet-view-empty-state — Yogi with no passes views clean empty state in Digital Pass Wallet
- **ID:** yogi-pass-wallet-view-empty-state
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Newbie has 0 passes.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** Newbie opens wallet.
- **Steps:**
  - Given Newbie opens Digital Pass Wallet
  - When passes load
  - Then empty notice "No active passes found" appears with prompt to discover studios
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-profile-issue-reporting-link — Tapping Report an Issue generates pre-filled Google Form link with user ID
- **ID:** yogi-profile-issue-reporting-link
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.6
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User authenticated.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah on Profile screen.
- **Steps:**
  - Given Sarah opens profile menu and taps "Report an Issue"
  - When external link is inspected
  - Then URL target points to configured Google Form and contains query param "entry.XXXX=user_sarah"
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-profile-switch-theme — Yogi toggles Light and Dark theme preference with immediate DOM class update
- **ID:** yogi-profile-switch-theme
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** None.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** User taps theme toggle in header/profile.
- **Steps:**
  - Given app is rendered in Light theme
  - When yogi taps theme switch
  - Then HTML root class updates to "dark"
  - And background colors transition to dark theme surface tokens
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### yogi-search-operating-status-badges — Search result studio tiles display accurate operating status badges
- **ID:** yogi-search-operating-status-badges
- **Actor:** yogi
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.9, §5.14
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Studios with active and temp_closed statuses exist.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** studio with temp_closed status
- **Preconditions (Given):** Yogi searches studios.
- **Steps:**
  - Given yogi views studio search tiles
  - Then active studios display green "● Open" badge
  - And temporarily closed studios display amber "● Temporarily Closed" badge
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

### Actor: TEACHER (20 Scenarios)

#### teacher-carousel-link-opens-profile — Tapping teacher card in studio carousel navigates to teacher UnifiedProfileView
- **ID:** teacher-carousel-link-opens-profile
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Teacher in studio carousel.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Viewing studio profile.
- **Steps:**
  - Given Sarah views Maya Sharma card in studio carousel
  - When she taps the card
  - Then app navigates to Maya Sharma UnifiedProfileView
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-filter-schedule-modal-by-studio — Filtering TeacherScheduleModal by studio location updates schedule and excludes other studios
- **ID:** teacher-filter-schedule-modal-by-studio
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Classes at Askew and Shoreditch exist.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** TeacherScheduleModal open.
- **Steps:**
  - Given modal is open with "All Studios" active
  - When user taps "Shoreditch Stillpoint Studio" filter pill
  - Then only classes at Shoreditch are listed
  - And classes at Askew and Ravenscourt are excluded
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-open-multistudio-schedule-modal — Teacher opens TeacherScheduleModal calendar overlay across all partner studios
- **ID:** teacher-open-multistudio-schedule-modal
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Teacher has multi-studio classes.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** User on teacher profile.
- **Steps:**
  - Given teacher taps "View Full Schedule"
  - When TeacherScheduleModal opens
  - Then calendar header, week switcher, 7 day pills, and horizontal studio filter pills render
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-schedule-tile-link-opens-profile — Tapping underlined teacher link on studio schedule class row navigates to teacher profile
- **ID:** teacher-schedule-tile-link-opens-profile
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.19
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Studio class row displays teacher name.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Viewing studio timetable.
- **Steps:**
  - Given Sarah views class row with text "w/ Maya Sharma"
  - When she taps the underlined link "Maya Sharma"
  - Then app navigates to Maya Sharma UnifiedProfileView
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-verify-carousel-presence-at-studio — Teacher appears in Teachers at this Studio carousel at partner studios without owning them
- **ID:** teacher-verify-carousel-presence-at-studio
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Maya is assigned teacher at Shoreditch; Omar is owner.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none (Omar owns Shoreditch, Maya is visiting teacher)
- **Preconditions (Given):** Sarah opens Shoreditch studio profile.
- **Steps:**
  - Given Sarah opens Shoreditch studio profile
  - When she inspects "Teachers at this Studio" carousel
  - Then Maya Sharma instructor card is visible with photo and name
  - And Omar Haddad does NOT appear as an instructor (non-teaching owner)
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-view-my-studios-non-owner-boundary — Freelance teacher accessing My Studios views zero ownership boundary without administrative controls
- **ID:** teacher-view-my-studios-non-owner-boundary
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `2/3` | Gap: `0/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11, §5.19
- **Type:** valid-failure
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Maya owns no studios or brands.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya is authenticated.
- **Steps:**
  - Given Maya opens navigation menu
  - When she views studios navigation
  - Then notice "No independent studios registered" appears
  - And currency creation, timetable modification, and brand settings tabs are completely absent
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-view-own-profile-overview — Teacher views personal profile overview, verified checkmark, handle, and 2-metric bar
- **ID:** teacher-view-own-profile-overview
- **Actor:** teacher
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Maya Sharma seeded with isTeacher: true.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya views her own profile.
- **Steps:**
  - Given Maya Sharma navigates to her profile
  - When profile loads
  - Then verified checkmark, handle "@maya_sharma#2026", "🧘 Teacher" badge, and bio render
  - And 2-metric bar displays Subscribers and Posts counts
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts)

#### teacher-area-community-presence-and-navigation — Teacher appears in Teachers in this Area list on Area Community Profile
- **ID:** teacher-area-community-presence-and-navigation
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Maya teaches at studios within Askew area community.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Sarah views Askew community Studios & Teachers tab.
- **Steps:**
  - Given Sarah navigates to Askew community profile
  - When she opens "Studios & Teachers" tab
  - Then Maya Sharma appears under "Teachers in this Area"
  - And tapping her card opens her teacher profile
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-class-info-modal-link-opens-profile — Tapping teacher link inside ClassInfoModal navigates to teacher profile
- **ID:** teacher-class-info-modal-link-opens-profile
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.14, §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** ClassInfoModal open.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Viewing class info modal.
- **Steps:**
  - Given Sarah has ClassInfoModal open
  - When she taps "Taught by Maya Sharma"
  - Then modal dismisses and app navigates to Maya Sharma profile
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (ClassInfoModal.test.tsx)

#### teacher-classes-rolling-seven-day-capping — Teacher classes sub-tab displays rolling 7-day multi-studio timetable feed with studio links
- **ID:** teacher-classes-rolling-seven-day-capping
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Maya Sharma teaches across Askew, Ravenscourt, and Shoreditch.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya views "🧘 Classes" sub-tab.
- **Steps:**
  - Given teacher views Classes tab
  - When class list renders
  - Then sessions from all partner studios scheduled in next 7 days appear
  - And each card displays session time, climate preset icon, class title, and clickable studio link
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (UnifiedProfileView.test.tsx)

#### teacher-configure-public-discovery-enforces-avatar-public — Enabling public profile on teacher account automatically enforces public avatar setting
- **ID:** teacher-configure-public-discovery-enforces-avatar-public
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Teacher profile currently private.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya toggles isProfilePublic to true.
- **Steps:**
  - Given Maya switches isProfilePublic to true
  - When privacy settings save
  - Then avatarPrivacy automatically updates to "public"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores initial state.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-filter-schedule-modal-zero-state — Filtering TeacherScheduleModal for studio with no classes on selected day displays clean empty notice
- **ID:** teacher-filter-schedule-modal-zero-state
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Teacher has 0 classes at Ravenscourt on selected date.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Modal open on date with no classes.
- **Steps:**
  - Given user filters by Ravenscourt on a day without classes
  - Then empty notice "No classes scheduled for this day at selected locations" is displayed
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-navigate-to-studio-from-class-card — Tapping studio link on teacher class card navigates to studio profile
- **ID:** teacher-navigate-to-studio-from-class-card
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19, §5.14
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Class card renders studio link.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** none
- **Preconditions (Given):** Viewing teacher classes sub-tab.
- **Steps:**
  - Given student views class taught by Maya at Shoreditch
  - When they tap studio name "Shoreditch Stillpoint Studio"
  - Then app navigates directly to StudioProfileView for Shoreditch
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-private-profile-shields-personal-info — Private teacher profile shields personal bio from non-subscribers while studio classes remain visible
- **ID:** teacher-private-profile-shields-personal-info
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8, §5.19
- **Type:** edge
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Teacher profile configured with isProfilePublic: false.
- **Suggested test user:** NEW: user_teacher_private
- **Seed gap:** teacher with isProfilePublic: false
- **Preconditions (Given):** Unsubscribed student views teacher profile.
- **Steps:**
  - Given student views private teacher profile
  - Then privacy lock shield "🔒 This Yogi's Profile is Private" appears
  - And personal bio and community posts are concealed
  - While teacher sessions scheduled on studio timetables remain publicly visible
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-schedule-modal-responsive-layout — TeacherScheduleModal renders mobile bottom sheet vs desktop centered dialog
- **ID:** teacher-schedule-modal-responsive-layout
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Modal invoked on mobile and desktop viewports.
- **Steps:**
  - Given viewport is at 390px mobile width
  - Then modal displays as bottom sheet with swipe drag handle
  - And at 1280px desktop width, displays as centered floating dialog with top right ✕ button
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-switch-calendar-day-updates-classes — Switching day pills in TeacherScheduleModal updates class list and persists active studio filter
- **ID:** teacher-switch-calendar-day-updates-classes
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Classes on multiple dates.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Modal open with specific studio filter active.
- **Steps:**
  - Given studio filter "Askew" is active
  - When user taps a different day selector pill
  - Then timetable updates to show Askew classes for that date
  - And active "Askew" filter remains selected
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### teacher-update-bio-persists — Teacher updates personal bio and credentials with character limit feedback
- **ID:** teacher-update-bio-persists
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.8
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Teacher authenticated.
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya on Profile screen.
- **Steps:**
  - Given Maya enters new teaching bio (e.g. "500-hr RYT specializing in Ashtanga")
  - When character counter displays remaining limit
  - And she saves changes
  - Then new bio persists and is visible on her public UnifiedProfileView
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets bio.
- **Platforms:** both
- **Automation status:** unit-only (ProfileView.test.tsx)

#### teacher-visiting-schedule-isolation — Visiting teacher cannot modify host studio schedule, climate presets, or pricing policies
- **ID:** teacher-visiting-schedule-isolation
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `2/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.7, §5.14
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Maya teaches at Shoreditch (owned by Omar).
- **Suggested test user:** user_teacher_001 (Maya Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Maya views Shoreditch studio timetable.
- **Steps:**
  - Given Maya views classes she teaches at Shoreditch Stillpoint Studio
  - When she inspects schedule controls
  - Then edit, cancel, and currency acceptance modification buttons are hidden
  - And Firestore security rules reject direct class update writes from non-owners
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** none

#### yogi-subscribe-unlock-private-teacher-profile — Student subscribing to teacher profile unlocks personal bio and member feed
- **ID:** yogi-subscribe-unlock-private-teacher-profile
- **Actor:** teacher
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Sarah is not subscribed to private teacher.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** teacher with isProfilePublic: false
- **Preconditions (Given):** Sarah viewing private teacher profile.
- **Steps:**
  - Given Sarah views locked private teacher profile with button "[ Subscribe ]"
  - When she taps "Subscribe"
  - Then button toggles to "✓ Subscribed", subscriber counter increments, and personal bio and feed unlock
- **Isolation:** `clone`
- **Data / reset notes:** Teardown removes subscription.
- **Platforms:** both
- **Automation status:** unit-only

#### yogi-unsubscribe-from-teacher — Student cleanly unsubscribes from teacher via profile ellipsis menu
- **ID:** yogi-unsubscribe-from-teacher
- **Actor:** teacher
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.19
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Sarah is subscribed to teacher.
- **Suggested test user:** user_sarah (Sarah Jenkins)
- **Seed gap:** pre-existing subscription to teacher
- **Preconditions (Given):** Sarah viewing teacher profile.
- **Steps:**
  - Given Sarah is subscribed to teacher
  - When she taps 3-dots menu and selects "Unsubscribe"
  - Then button returns to "[ Subscribe ]" and subscriber count decrements
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets subscription.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

### Actor: STUDIO-OWNER (38 Scenarios)

#### brand-founder-delete-brand-preserves-independent-studios — Brand founder confirms brand network deletion and assigned branch studios revert to independent locations
- **ID:** brand-founder-delete-brand-preserves-independent-studios
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Marcus owns brand The Zen Collective and studio Fulham Flow.
- **Suggested test user:** user_brand_founder (Marcus Vance)
- **Seed gap:** none
- **Preconditions (Given):** Marcus opens brand settings.
- **Steps:**
  - Given Marcus selects "Delete Brand Company"
  - When confirmation dialog is confirmed
  - Then company document is deleted from Firestore
  - And branch studio Fulham Flow reverts to companyId: null (independent studio)
  - And studio remains intact in Marcus's My Studios list
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores brand and re-links studio.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### non-teaching-owner-assigns-visiting-teacher — Non-teaching studio owner creates class and assigns visiting teacher with owner excluded from teacher selector
- **ID:** non-teaching-owner-assigns-visiting-teacher
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Omar Haddad is non-teaching owner; Maya Sharma is assigned teacher.
- **Suggested test user:** user_owner_noteach (Omar Haddad)
- **Seed gap:** none (Omar has isTeacher: false, Maya is visiting teacher)
- **Preconditions (Given):** Omar opens Create Class form.
- **Steps:**
  - Given Omar opens Create Class view for Shoreditch Stillpoint Studio
  - When he inspects Teacher selector dropdown
  - Then Omar does NOT appear as an instructor option (isTeacher: false mandate)
  - And visiting teacher "Maya Sharma" is selected
  - And published class correctly displays "w/ Maya Sharma"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes class.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### platform-admin-approve-shadow-claim — Platform administrator reviews pending studio claim and approves ownership transfer
- **ID:** platform-admin-approve-shadow-claim
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.12
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Maryia has isAdmin: true; pending claim exists.
- **Suggested test user:** user_maryia (Maryia Sharma - Platform Admin)
- **Seed gap:** pending claim record in seeds
- **Preconditions (Given):** Maryia opens AdminClaimsView.
- **Steps:**
  - Given Maryia opens Admin Claims Review portal
  - When she reviews pending claim and taps "Approve Claim"
  - Then studio ownerId is updated to claimant, isClaimed is set to true
  - And claim status updates to "approved"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores unassigned shadow studio state.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-claim-shadow-profile — Prospective studio owner claims unclaimed shadow studio and uploads verification proof
- **ID:** studio-owner-claim-shadow-profile
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.12
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Unclaimed studio profile exists in search.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** shadow studio profile in seeds
- **Preconditions (Given):** User finds shadow studio in search.
- **Steps:**
  - Given user taps "Claim Studio 🏢" on shadow studio tile
  - When ClaimStudioView opens
  - Then user fills ownership contact details, attaches utility bill/proof document, and submits claim
  - Then claim request document is created with status: "pending"
  - And confirmation banner informs user claim is under administrative review
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created claim.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-create-brand-and-studio — Studio owner creates new brand network and first branch studio in 2-step wizard
- **ID:** studio-owner-create-brand-and-studio
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User is authenticated.
- **Suggested test user:** user_brand_founder (Marcus Vance)
- **Seed gap:** none
- **Preconditions (Given):** Marcus opens Create Studio view.
- **Steps:**
  - Given Marcus selects "Create a New Brand Company"
  - When he enters brand name "Zenith Flow Collective", contact email, and description
  - And advances to Step 2 to enter studio branch details (name, address, outward postcode "W6", room dimensions)
  - And submits the form
  - Then company and studio documents are created in Firestore
  - And app navigates to My Studios dashboard showing new brand and branch
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created company and studio documents.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-create-brand-currency-catalog — Brand founder defines multi-branch currency pricing packages that propagate across branches
- **ID:** studio-owner-create-brand-currency-catalog
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Brand exists without currencies.
- **Suggested test user:** user_brand_founder (Marcus Vance)
- **Seed gap:** none
- **Preconditions (Given):** Marcus opens Brand Currencies tab.
- **Steps:**
  - Given Marcus opens Brand Currencies tab for The Zen Collective
  - When he creates a 5-Class Pack (£75) with 5 credits and 90 days validity
  - And saves the tier
  - Then company_currency document is created
  - And pass package becomes available to all child branches following brand
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created currency.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-create-independent-studio — User creates independent standalone studio defaulting to unverified pending claim
- **ID:** studio-owner-create-independent-studio
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** User authenticated.
- **Suggested test user:** user_david_kim (David Kim)
- **Seed gap:** none
- **Preconditions (Given):** User in Create Studio wizard.
- **Steps:**
  - Given user selects "Independent Studio (No Brand Network)"
  - When they enter studio name, address, outward postcode "W4", and contact phone
  - And submit form
  - Then standalone studio document is created with companyId: null and isClaimed: true
  - And studio appears in My Studios under Independent Studios section
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created studio.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-create-standalone-currency-catalog — Independent studio owner establishes studio-specific class pricing catalog
- **ID:** studio-owner-create-standalone-currency-catalog
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** David owns independent studio with no currencies.
- **Suggested test user:** user_david_kim (David Kim)
- **Seed gap:** none (David owns Ravenscourt with 0 currencies)
- **Preconditions (Given):** David opens Pricing & Policies tab.
- **Steps:**
  - Given David opens Pricing tab for Ravenscourt Park Zen Pavilion
  - When he creates Drop-In pass (£16)
  - And saves changes
  - Then standalone currency is saved and becomes bookable on Ravenscourt timetable
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created currency.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-grant-pass-walkin-stepper — Studio owner records in-person walk-in sale and deposits class credits into member wallet via stepper
- **ID:** studio-owner-grant-pass-walkin-stepper
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `M`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sophia owns studio; member exists.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia opens AdminGrantPassModalView.
- **Steps:**
  - Given Sophia opens Grant Pass modal
  - When she selects recipient "Sarah Jenkins", selects Drop-In pass, and increments stepper to 2 credits
  - And taps "Grant Pass"
  - Then 2 credits are deposited into Sarah's wallet
  - And other member wallets remain completely untouched (zero cross-user leak)
- **Isolation:** `clone`
- **Data / reset notes:** Teardown removes granted pass.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-manage-studio-3tabs-navigation — Studio owner navigates unified in-place 3-tab layout: General Settings, Pricing & Policies, Timetable
- **ID:** studio-owner-manage-studio-3tabs-navigation
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11, §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Sophia owns Chelsea Sanctuary Studio.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia opens My Studios and clicks Manage Studio.
- **Steps:**
  - Given Sophia opens Chelsea Sanctuary Studio management subpage
  - When subpage loads
  - Then 3 tabs render: "⚙️ General Settings", "💳 Pricing & Policies", "📅 Timetable"
  - And clicking each tab transitions the view in-place without page reload
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-publish-weekly-recurring-class-with-climate — Studio owner publishes ongoing weekly recurring class with room climate preset and recurrence
- **ID:** studio-owner-publish-weekly-recurring-class-with-climate
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Sophia owns Chelsea studio.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia in CreateClassView.
- **Steps:**
  - Given Sophia enters class title "Sunset Yin Yoga", teacher, duration 60m, capacity 15
  - When she selects climate preset "Heated (26°C)" and recurrence Weekly on Tuesdays and Thursdays
  - And sets End Condition to "Never" (up to 52 weeks)
  - And taps "Publish Live"
  - Then recurring series is generated in batches in Firestore
  - And sessions appear across weekly calendar on Chelsea timetable
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created recurring classes.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-save-brand-class-template — Brand founder creates teacher-agnostic brand class template shared across all branches
- **ID:** studio-owner-save-brand-class-template
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `M`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Maryia owns brand Affordable London Yoga.
- **Suggested test user:** user_maryia (Maryia Sharma)
- **Seed gap:** none
- **Preconditions (Given):** In CreateClassView.
- **Steps:**
  - Given Maryia creates class blueprint with title "Ashtanga Primary Series"
  - When she taps "Save as Brand Template"
  - Then company_class_template document is saved under brand company ID without bound teacher (teacher-agnostic)
  - And template becomes available to all child branch managers
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created template.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-schedule-class-from-brand-template-sync-teacher — Branch manager instantiates recurring schedule from template dynamically synchronizing target studio teachers
- **ID:** studio-owner-schedule-class-from-brand-template-sync-teacher
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `M`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Brand class template exists; Elena manages branch.
- **Suggested test user:** user_elena (Elena Rostova)
- **Seed gap:** none (Elena manages Chiswick under brand)
- **Preconditions (Given):** Elena in StudioClassManagerView.
- **Steps:**
  - Given Elena taps "Schedule Class" on Brand Template card
  - When CreateClassFromTemplateModal opens
  - Then target studio teachers dropdown synchronizes to Chiswick instructors
  - And when she selects date, time, and taps "Publish Schedule"
  - Then published class appears on Chiswick schedule with correct branch teacher
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes scheduled class.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### studio-owner-switch-policy-follow-to-custom — Branch owner switches policy from follow_brand to custom_override with isolated custom rates
- **ID:** studio-owner-switch-policy-follow-to-custom
- **Actor:** studio-owner
- **Suite Tier:** `[SMOKE]` | **Priority:** **P0**
- **Scoring:** Impact: `3/3` | Likelihood: `3/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Elena owns Chiswick currently inheriting brand passes.
- **Suggested test user:** user_elena (Elena Rostova)
- **Seed gap:** none (Elena manages Chiswick under follow_brand)
- **Preconditions (Given):** Elena in Pricing & Policies tab.
- **Steps:**
  - Given Elena selects "Custom Studio Policy (Override Brand)"
  - When she adds a custom £25 Drop-In rate and saves
  - Then studio policy transitions to custom_override
  - And custom rate renders on Chiswick schedule while sister studios continue using brand rates
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores follow_brand policy.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts)

#### platform-admin-reject-shadow-claim — Platform administrator rejects shadow claim with justification reason
- **ID:** platform-admin-reject-shadow-claim
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.12
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Maryia has isAdmin: true; pending claim exists.
- **Suggested test user:** user_maryia (Maryia Sharma - Platform Admin)
- **Seed gap:** pending claim in seeds
- **Preconditions (Given):** Maryia in AdminClaimsView.
- **Steps:**
  - Given Maryia reviews claim with insufficient proof
  - When she enters reason "Proof document illegible" and taps "Reject Claim"
  - Then claim status updates to "rejected" and studio remains unclaimed
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes claim.
- **Platforms:** both
- **Automation status:** unit-only (AdminClaimsView.test.tsx)

#### studio-owner-claim-already-verified-studio-blocked — Attempting to claim an already-verified studio is blocked
- **ID:** studio-owner-claim-already-verified-studio-blocked
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.12
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Studio has isClaimed: true.
- **Suggested test user:** user_newbie (Yoga Newbie)
- **Seed gap:** none
- **Preconditions (Given):** User inspects verified studio.
- **Steps:**
  - Given user views Askew Road Zen Den (already verified and owned)
  - Then "Claim Studio" button is not rendered on tile or profile
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### studio-owner-create-brand-invalid-email — Brand creation enforces strict email regex validation
- **ID:** studio-owner-create-brand-invalid-email
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** None.
- **Suggested test user:** user_david_kim (David Kim)
- **Seed gap:** none
- **Preconditions (Given):** User in Step 1 Brand setup.
- **Steps:**
  - Given user enters "invalid-email-format" into brand email field
  - When they attempt to proceed
  - Then validation error "Please enter a valid email address" appears and advance is blocked
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CreateStudioView.test.tsx)

#### studio-owner-create-class-missing-title-fails — Class creation blocks saving when class title is missing
- **ID:** studio-owner-create-class-missing-title-fails
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** valid-failure
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** In CreateClassView.
- **Steps:**
  - Given user leaves Title input blank
  - When attempting to Save as Draft, Template, or Publish
  - Then validation warning "Class title is required" blocks submission
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CreateClassView.test.tsx)

#### studio-owner-create-class-restricted-currency-acceptance — Studio owner publishes specialty class restricted to custom selected passes
- **ID:** studio-owner-create-class-restricted-currency-acceptance
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16, §5.20
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio has multiple currencies.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia in CreateClassView.
- **Steps:**
  - Given Sophia creates Sound Bath workshop
  - When she switches Currency Acceptance from "Accept All" to "Custom"
  - And checks only "Drop-In Pass (£22)" while unchecking class packs
  - And publishes the class
  - Then class saves with custom policy and filters student booking pass modals accordingly
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes class.
- **Platforms:** both
- **Automation status:** unit-only (CreateClassView.test.tsx)

#### studio-owner-create-studio-missing-required-fields — Studio creation form blocks submission when required fields are missing
- **ID:** studio-owner-create-studio-missing-required-fields
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** valid-failure
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** None.
- **Suggested test user:** user_david_kim (David Kim)
- **Seed gap:** none
- **Preconditions (Given):** User opens Create Studio form.
- **Steps:**
  - Given user leaves studio name and address blank
  - When they attempt to submit
  - Then form validation errors appear highlighting required fields and blocking Firestore writes
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CreateStudioView.test.tsx)

#### studio-owner-currency-creation-unlimited-credits-disabled — Selecting unlimited pass type disables and locks credit count stepper
- **ID:** studio-owner-currency-creation-unlimited-credits-disabled
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** In currency creator form.
- **Steps:**
  - Given user selects pass type "Unlimited Membership"
  - Then credit quantity input is disabled and set to unlimited
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only

#### studio-owner-edit-currency-pricing — Studio owner updates currency title, price, and validity days
- **ID:** studio-owner-edit-currency-pricing
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Sophia has custom currencies at Chelsea.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia opens currency editor.
- **Steps:**
  - Given Sophia edits 10-Class Pack from £190 to £195
  - When she clicks "Save Changes"
  - Then currency document updates in Firestore and timetable reflects new price
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores price.
- **Platforms:** both
- **Automation status:** unit-only

#### studio-owner-edit-studio-bio — Verified studio owner updates studio bio in general settings
- **ID:** studio-owner-edit-studio-bio
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio has isClaimed: true.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia on General Settings tab.
- **Steps:**
  - Given Sophia edits studio description and philosophy in bio textarea
  - When she taps "Save Bio"
  - Then Firestore document is updated and success toast confirms changes
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets bio.
- **Platforms:** both
- **Automation status:** unit-only (MyStudiosView.test.tsx)

#### studio-owner-grant-pass-nonexistent-user-fails — Admin pass grant attempts deposit to unregistered member email and aborts with zero writes
- **ID:** studio-owner-grant-pass-nonexistent-user-fails
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** valid-failure
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** In pass grant modal.
- **Steps:**
  - Given user enters unregistered email "nonexistent@inspired.test"
  - When attempting to grant pass
  - Then error notice "Recipient not found" appears and no Firestore writes are executed
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (AdminGrantPassModalView.test.tsx)

#### studio-owner-grant-pass-stepper-lower-bound-clamp — Admin grant pass stepper clamps at 1 and prevents decrementing to zero or negative
- **ID:** studio-owner-grant-pass-stepper-lower-bound-clamp
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Modal open with quantity 1.
- **Steps:**
  - Given stepper displays quantity 1
  - When user taps "−" decrement button
  - Then value remains clamped at 1 and decrement button is disabled
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (AdminGrantPassModalView.test.tsx)

#### studio-owner-publish-class-missing-teacher-fails — Publishing live class without assigned teacher is blocked
- **ID:** studio-owner-publish-class-missing-teacher-fails
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_owner_noteach (Omar Haddad)
- **Seed gap:** none
- **Preconditions (Given):** In CreateClassView with empty teacher selection.
- **Steps:**
  - Given teacher selector is empty or unselected
  - When owner attempts to "Publish Live"
  - Then error notice "Please assign a teacher before publishing live" appears
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CreateClassView.test.tsx)

#### studio-owner-publish-draft-directly — Studio owner converts saved draft directly into published live class
- **ID:** studio-owner-publish-draft-directly
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Saved draft exists.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Viewing Drafts in StudioClassManagerView.
- **Steps:**
  - Given owner views draft class in Studio Drafts list
  - When they tap "Publish" on draft card
  - Then class status updates to "published" and immediately appears on public timetable
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes class.
- **Platforms:** both
- **Automation status:** unit-only (StudioClassManagerView.test.tsx)

#### studio-owner-reassign-independent-studio-to-brand — Studio owner links independent studio to existing parent brand network
- **ID:** studio-owner-reassign-independent-studio-to-brand
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Marcus owns brand and independent studio.
- **Suggested test user:** user_brand_founder (Marcus Vance)
- **Seed gap:** none
- **Preconditions (Given):** Marcus in General Settings.
- **Steps:**
  - Given Marcus views independent studio Fulham Flow
  - When he selects "Link to Brand Company" and chooses The Zen Collective
  - Then studio companyId is updated to link to the brand network
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets companyId.
- **Platforms:** both
- **Automation status:** unit-only

#### studio-owner-recurrence-date-inverted-failure — Recurrence engine rejects end dates earlier than first session date
- **ID:** studio-owner-recurrence-date-inverted-failure
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** valid-failure
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** In CreateClassView.
- **Steps:**
  - Given first session is set for tomorrow
  - When user sets recurrence end date to yesterday
  - Then validation error "End date must be after start date" blocks submission
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** unit-only (CreateClassView.test.tsx)

#### studio-owner-recurrence-occurrences-boundary — Studio owner sets occurrence-based recurrence capped at maximum 52-occurrence boundary
- **ID:** studio-owner-recurrence-occurrences-boundary
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `M`
- **Feature ref:** FEATURES.md §5.16
- **Type:** edge
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** None.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** In recurrence section of CreateClassView.
- **Steps:**
  - Given user selects End Condition "After N occurrences"
  - When they enter occurrence count 52
  - Then 52 class session records are created across future weeks without memory exhaustion
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes created classes.
- **Platforms:** both
- **Automation status:** unit-only (firestoreService.test.ts)

#### studio-owner-reopen-temp-closed-studio — Studio owner reopens temporarily closed studio and clears closure notice
- **ID:** studio-owner-reopen-temp-closed-studio
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11, §5.14
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio is temp_closed.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia in General Settings.
- **Steps:**
  - Given studio is temporarily closed
  - When Sophia toggles operating status back to "Open"
  - Then operatingStatus updates to "open", notice banner clears, and timetable bookings re-enable
- **Isolation:** `clone`
- **Data / reset notes:** Teardown resets status.
- **Platforms:** both
- **Automation status:** unit-only

#### studio-owner-save-class-draft — Studio owner saves incomplete class as draft and validates isolation from public timetable
- **ID:** studio-owner-save-class-draft
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Sophia in CreateClassView.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Class form filled.
- **Steps:**
  - Given Sophia fills class details and taps "Save as Draft"
  - Then class document is saved with status: "draft"
  - And appears in Studio Drafts list in StudioClassManagerView
  - While remaining invisible on public student timetable
- **Isolation:** `clone`
- **Data / reset notes:** Teardown deletes draft.
- **Platforms:** both
- **Automation status:** unit-only (StudioClassManagerView.test.tsx)

#### studio-owner-set-temp-closed-with-note — Studio owner pauses location with temporary closure notice and custom manager notes
- **ID:** studio-owner-set-temp-closed-with-note
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11, §5.14
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Studio is currently open.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia in General Settings.
- **Steps:**
  - Given Sophia toggles operating status to "Temporarily Closed"
  - When she enters notice note "Flooring renovation. Reopening Nov 1st."
  - And saves changes
  - Then studio operatingStatus updates to "temp_closed"
  - And public profile immediately renders closure banner
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores operatingStatus to open.
- **Platforms:** both
- **Automation status:** unit-only (MyStudiosView.test.tsx)

#### studio-owner-soft-close-and-reopen-studio — Studio owner permanently soft-closes studio location and subsequently reopens it
- **ID:** studio-owner-soft-close-and-reopen-studio
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.11
- **Type:** happy
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Sophia owns Chelsea studio.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Sophia in General Settings.
- **Steps:**
  - Given Sophia selects "Close Studio Location" and confirms modal
  - Then studio status updates to "closed" and is excluded from search
  - And when she taps "Reopen Studio Location", studio status restores to "active"
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores active status.
- **Platforms:** both
- **Automation status:** unit-only (MyStudiosView.test.tsx)

#### studio-owner-switch-policy-custom-to-follow — Branch owner reverts from custom_override back to follow_brand restoring brand pass inheritance
- **ID:** studio-owner-switch-policy-custom-to-follow
- **Actor:** studio-owner
- **Suite Tier:** `[REGRESSION]` | **Priority:** **P1**
- **Scoring:** Impact: `2/3` | Likelihood: `2/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** happy
- **Triad Signal:** 2/3 (Multi-Lens Overlap)
- **Prerequisites:** Studio currently in custom_override.
- **Suggested test user:** user_elena (Elena Rostova)
- **Seed gap:** none
- **Preconditions (Given):** Elena in Pricing & Policies tab.
- **Steps:**
  - Given studio is in custom override policy
  - When owner selects "Follow Brand Pricing" and confirms
  - Then policy updates to follow_brand and brand pass packages are instantly restored
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores state.
- **Platforms:** both
- **Automation status:** unit-only (MyStudiosView.test.tsx)

#### studio-owner-delete-class-draft — Studio owner deletes unwanted class draft with confirmation
- **ID:** studio-owner-delete-class-draft
- **Actor:** studio-owner
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Draft class exists.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** Viewing StudioClassManagerView.
- **Steps:**
  - Given draft class exists
  - When owner taps "Delete Draft" and confirms
  - Then draft document is deleted and removed from view
- **Isolation:** `clone`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### studio-owner-delete-class-template — Studio owner deletes class template blueprint with confirmation dialog
- **ID:** studio-owner-delete-class-template
- **Actor:** studio-owner
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `1/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `M`
- **Feature ref:** FEATURES.md §5.16
- **Type:** happy
- **Triad Signal:** 1/3 (Single-Lens Deep-Dive)
- **Prerequisites:** Template exists.
- **Suggested test user:** user_maryia (Maryia Sharma)
- **Seed gap:** none
- **Preconditions (Given):** Viewing templates list.
- **Steps:**
  - Given owner taps delete on class template
  - When confirmation modal is accepted
  - Then template document is deleted from Firestore
- **Isolation:** `clone`
- **Data / reset notes:** Teardown restores template.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

#### studio-owner-discard-currency-changes-safeguard — Studio owner cancels in-progress currency edits and uncommitted modifications are discarded
- **ID:** studio-owner-discard-currency-changes-safeguard
- **Actor:** studio-owner
- **Suite Tier:** `[EXTENDED]` | **Priority:** **P2**
- **Scoring:** Impact: `2/3` | Likelihood: `1/3` | Gap: `1/2` | Cost: `S`
- **Feature ref:** FEATURES.md §5.20
- **Type:** edge
- **Triad Signal:** 3/3 (Core Triad Consensus)
- **Prerequisites:** Existing currency catalog loaded.
- **Suggested test user:** user_sophia_vane (Sophia Vane)
- **Seed gap:** none
- **Preconditions (Given):** User modifies form fields.
- **Steps:**
  - Given owner edits price from £22 to £99
  - When they tap "✕ Discard Changes"
  - Then form resets back to original £22 value without writing to database
- **Isolation:** `shared`
- **Data / reset notes:** None.
- **Platforms:** both
- **Automation status:** e2e (Apps/PWA/src/test/e2e/extended_suite.spec.ts)

