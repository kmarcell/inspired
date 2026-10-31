# Phase 4: E2E Coverage Matrix

**Date:** 2026-10-30  
This matrix maps every functional capability in `FEATURES.md` to its corresponding E2E regression scenarios, automation status, and test isolation mode.

---

### Coverage Summary (100 Scenarios Automated)
- **P0 Smoke Scenarios (40/40 Automated - 100%):** Covered in `yogi_smoke.spec.ts`, `teacher_smoke.spec.ts`, and `studio_owner_smoke.spec.ts`.
- **P1 Regression Scenarios (60/60 Automated - 100%):** Covered in `yogi_regression.spec.ts` (27), `teacher_regression.spec.ts` (12), and `studio_owner_regression.spec.ts` (21).
- **Overall Active Suite:** 100/100 P0/P1 scenarios automated with 100% pass rate in concurrent test runs.

---

| Feature Key | Feature Name | Scenario ID | Tier | Priority | Isolation | Current Automation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `§5.1, §5.2` | Yogi authenticates via Dev credentials and accesses application shell | `yogi-auth-dev-login-success` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1` | Visitor attempts login with incorrect password and is blocked with error | `visitor-login-wrong-password-fails` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1` | Visitor requests magic link and 60-second cooldown timer throttles retries | `visitor-magic-link-cooldown-throttled` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.13` | Uninvited visitor email is rejected on staging environment by whitelist gate | `visitor-staging-login-uninvited-blocked` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.1.1, UserFlows.md §1.1` | Authenticated yogi reloads application and session is restored automatically | `yogi-cold-start-session-restore` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1, §5.8` | Yogi logs out cleanly and application returns to login view | `yogi-logout-session-terminated` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.4` | First-time yogi completes onboarding, validates handle, and enters feed | `yogi-onboarding-complete-profile` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.4` | Onboarding rejects display names shorter than 2 characters | `visitor-onboarding-short-name-rejected` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.4` | Onboarding blocks offensive display names via moderation guard | `visitor-onboarding-profane-name-rejected` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.9` | Yogi opens Search view and sees Discovery Mode suggestions with category badges | `yogi-search-discovery-initial-state` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.9` | Yogi searches outward postcode prefix and sees local studios ranked first | `yogi-search-by-postcode-prefix` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.9` | Yogi searches area name and finds matching neighborhood communities | `yogi-search-by-area-name` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.9` | Unmatched search query displays empty notice with Discovery Mode fallback recommendations | `yogi-search-no-results-discovery-fallback` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.9, §5.12` | Yogi views unclaimed shadow studio tile with "Claim Studio" button prompt | `yogi-search-unclaimed-shadow-studio` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.9, §5.14` | Search result studio tiles display accurate operating status badges | `yogi-search-operating-status-badges` | `EXTENDED` | **P2** | `shared` | unit-only (SearchView.test.tsx) |
| `§5.3` | Yogi views chronological feed stream of joined communities and area posts | `yogi-feed-view-unified-stream` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.3` | Feed executes 3-tier discovery fallback when recent local posts are absent | `yogi-feed-empty-area-3tier-fallback` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.3.1` | Feed post by author with groups-only privacy displays fallback avatar to non-members | `yogi-feed-post-avatar-privacy-fallback` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.3` | Yogi likes and unlikes a feed post updating like count | `yogi-feed-post-like-toggle` | `EXTENDED` | **P2** | `clone` | none |
| `§5.10` | Yogi views list of joined communities and navigates to community profile | `yogi-joined-communities-view-list` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.10, §5.15` | Yogi leaves a joined community via overflow menu without forfeiting class passes | `yogi-joined-communities-leave-community` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.10` | Clean-slate yogi with 0 communities views Discovery Mode list | `yogi-joined-communities-empty-state` | `EXTENDED` | **P2** | `shared` | unit-only (JoinedCommunitiesView.test.tsx) |
| `§5.14` | Yogi views studio profile header details, teachers carousel, and tabs | `yogi-studio-profile-view-details` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi joins studio branch executing atomic cascading join of parent brand network | `yogi-studio-profile-cascading-join` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi views studio with temporary closure notice and custom manager notes | `yogi-studio-profile-temporary-closure-notice` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14, §5.3.1` | Studio members directory enforces privacy masking for private user profiles | `yogi-studio-members-privacy-enforcement` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14` | Yogi navigates 7-day studio timetable selector and views classes for selected date | `yogi-schedule-view-7day-calendar` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi opens Class Info Modal and inspects room climate presets and details | `yogi-schedule-view-class-info-modal` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.16, §5.20` | Studio schedule class tile displays Custom Currency Acceptance badge when restricted | `yogi-schedule-view-custom-currency-badge` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14` | Unjoined yogi attempting to book class is prompted with Join Studio modal | `yogi-schedule-unjoined-book-join-prompt` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Bookings are disabled on schedule when studio is temporarily closed | `yogi-schedule-closed-studio-bookings-blocked` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14` | Yogi cannot book a class session scheduled in the past | `yogi-book-past-class-disabled` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14, §5.20` | Returning yogi books open class redeeming active pass credit | `yogi-book-class-with-pass-success` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi booking with unlimited subscription pass creates booking with zero credit deduction | `yogi-book-class-unlimited-pass-intact` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14, §5.20` | Yogi cancels class booking >= 12h before start and pass credit is refunded to wallet | `yogi-cancel-class-booking-refund` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi with 0 credits attempts booking and is redirected to Currency Store checkout modal | `yogi-book-class-no-pass-triggers-store` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi holding expired pass cannot select it during booking | `yogi-book-class-expired-pass-excluded` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.20` | Pass selector modal filters out passes incompatible with studio custom currency policy | `yogi-booking-pass-selector-filters-custom-currency` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi joins waitlist when class reaches full capacity without upfront credit deduction | `yogi-book-full-class-join-waitlist` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.14` | Yogi leaves class waitlist updating button to available state | `yogi-leave-class-waitlist` | `EXTENDED` | **P2** | `clone` | none |
| `§5.20` | Yogi simulates pass purchase in development store and pass activates in wallet | `yogi-dev-store-purchase-pass-activation` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.20` | Yogi audits active passes, credit counts, and expiration dates in Digital Wallet | `yogi-pass-wallet-view-active-passes` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.20` | Yogi with no passes views clean empty state with store prompt | `yogi-pass-wallet-view-empty-state` | `EXTENDED` | **P2** | `shared` | unit-only (UserPassWalletView.test.tsx) |
| `§5.8` | Yogi updates personal bio in profile settings and verifies character limit enforcement | `yogi-profile-edit-bio` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.8` | Yogi configures granular privacy toggles and public search constraint sync | `yogi-profile-toggle-privacy-settings` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.8` | Yogi toggles Light and Dark theme preference with immediate DOM attribute update | `yogi-profile-switch-theme` | `EXTENDED` | **P2** | `shared` | unit-only (ThemeContext.test.tsx) |
| `§5.6` | Tapping Report an Issue generates pre-filled feedback email draft | `yogi-profile-issue-reporting-link` | `EXTENDED` | **P2** | `shared` | unit-only (ProfileView.test.tsx) |
| `§5.2, §5.8` | Responsive navigation shell renders desktop sidebar vs mobile sticky header | `yogi-shell-header-navigation-audit` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.8 (Maint)` | Remote Config maintenance mode activates non-dismissible maintenance screen | `visitor-maintenance-mode-barrier` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.19` | Yogi views public teacher profile credentials, rolling 7-day classes, and multi-studio schedule button | `yogi-view-public-teacher-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.19` | Teacher profile classes sub-tab caps class listing to rolling 7-day window | `yogi-view-teacher-classes-rolling-7day-cap` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.19, §5.8` | Yogi views private teacher profile displaying privacy lock shield while studio classes remain visible | `yogi-view-private-teacher-profile-guard` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_regression.spec.ts) |
| `§5.19` | Yogi opens Teacher Schedule Modal from teacher profile and filters by partner studio | `yogi-view-teacher-multi-studio-schedule-modal` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.19` | Teacher views personal profile overview, verified checkmark, handle, and 2-metric bar | `teacher-view-own-profile-overview` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Teacher classes sub-tab displays rolling 7-day classes capped at one week | `teacher-classes-rolling-seven-day-capping` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | Teacher opens TeacherScheduleModal calendar overlay across all partner studios | `teacher-open-multistudio-schedule-modal` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Filtering TeacherScheduleModal by studio location updates schedule and excludes other studios | `teacher-filter-schedule-modal-by-studio` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Filtering TeacherScheduleModal for studio with no classes displays clean empty state | `teacher-filter-schedule-modal-zero-state` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | Switching day pills in TeacherScheduleModal updates class list and persists active studio filter | `teacher-switch-calendar-day-updates-classes` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | TeacherScheduleModal renders mobile bottom sheet vs desktop centered dialog | `teacher-schedule-modal-responsive-layout` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19, §5.14` | Tapping studio link on teacher class card opens StudioProfileView | `teacher-navigate-to-studio-from-class-card` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.14` | Teacher appears in Teachers at this Studio carousel at partner studios without owning them | `teacher-verify-carousel-presence-at-studio` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping teacher card in studio carousel navigates to teacher UnifiedProfileView | `teacher-carousel-link-opens-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping underlined teacher link on studio schedule class row navigates to teacher profile | `teacher-schedule-tile-link-opens-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping teacher link inside ClassInfoModal opens teacher profile | `teacher-class-info-modal-link-opens-profile` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | Teacher appears in Teachers in this Area list on Area Community Profile | `teacher-area-community-presence-and-navigation` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.11, §5.19` | Freelance teacher accessing My Studios views zero ownership boundary without administrative controls | `teacher-view-my-studios-non-owner-boundary` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.8, §5.19` | Private teacher profile shields personal details from non-subscriber visitors | `teacher-private-profile-shields-personal-info` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.8` | Teacher updates personal bio and credentials with character limit feedback | `teacher-update-bio-persists` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.8` | Enabling public profile on teacher account automatically enforces public avatar setting | `teacher-configure-public-discovery-enforces-avatar-public` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.7, §5.14` | Visiting teacher cannot modify host studio schedule, climate presets, or pricing policies | `teacher-visiting-schedule-isolation` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | Student subscribing to teacher profile unlocks personal bio and member feed | `yogi-subscribe-unlock-private-teacher-profile` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/teacher_regression.spec.ts) |
| `§5.19` | Student cleanly unsubscribes from teacher with instant UI state sync | `yogi-unsubscribe-from-teacher` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.11` | Studio owner creates new brand network and first branch studio in 2-step wizard | `studio-owner-create-brand-and-studio` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | User creates independent standalone studio defaulting to unverified pending claim | `studio-owner-create-independent-studio` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | Studio creation form blocks submission when required fields are missing | `studio-owner-create-studio-missing-required-fields` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11` | Brand creation enforces strict email regex validation | `studio-owner-create-brand-invalid-email` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11, §5.20` | Studio owner navigates unified in-place 3-tab layout: General Settings, Pricing & Policies, Timetable | `studio-owner-manage-studio-3tabs-navigation` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | Verified studio owner updates studio bio in general settings | `studio-owner-edit-studio-bio` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11, §5.14` | Studio owner pauses location with temporary closure notice and custom manager notes | `studio-owner-set-temp-closed-with-note` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11, §5.14` | Studio owner reopens temporarily closed studio and clears closure notice | `studio-owner-reopen-temp-closed-studio` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11` | Studio owner links independent studio to existing parent brand network | `studio-owner-reassign-independent-studio-to-brand` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.20` | Brand founder defines multi-branch currency pricing packages that propagate across branches | `studio-owner-create-brand-currency-catalog` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Independent studio owner establishes studio-specific class pricing catalog | `studio-owner-create-standalone-currency-catalog` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Branch owner switches policy from follow_brand to custom_override with independent studio pricing isolation | `studio-owner-switch-policy-follow-to-custom` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Branch owner reverts from custom_override back to follow_brand restoring brand pass inheritance | `studio-owner-switch-policy-custom-to-follow` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.20` | Studio owner updates currency title, price, and validity days | `studio-owner-edit-currency-pricing` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.20` | Selecting unlimited pass type disables and locks credit count stepper | `studio-owner-currency-creation-unlimited-credits-disabled` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.20` | Studio owner cancels in-progress currency modifications with clean restore | `studio-owner-discard-currency-changes-safeguard` | `EXTENDED` | **P2** | `shared` | unit-only |
| `§5.16` | Studio owner publishes ongoing weekly recurring class with room climate preset and recurrence | `studio-owner-publish-weekly-recurring-class-with-climate` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Studio owner sets occurrence-based recurrence capped at maximum 52-occurrence boundary | `studio-owner-recurrence-occurrences-boundary` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Recurrence engine rejects end dates earlier than first session date | `studio-owner-recurrence-date-inverted-failure` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Non-teaching studio owner creates class and assigns visiting teacher with owner excluded from teacher selector | `non-teaching-owner-assigns-visiting-teacher` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16, §5.20` | Studio owner publishes specialty class restricted to custom selected passes | `studio-owner-create-class-restricted-currency-acceptance` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Class creation blocks saving when class title is missing | `studio-owner-create-class-missing-title-fails` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Publishing live class without assigned teacher is blocked | `studio-owner-publish-class-missing-teacher-fails` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Studio owner saves incomplete class as draft and validates isolation from public timetable | `studio-owner-save-class-draft` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Studio owner converts saved draft directly into published live class | `studio-owner-publish-draft-directly` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.16` | Studio owner deletes unwanted class draft from management queue | `studio-owner-delete-class-draft` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.16` | Brand founder creates teacher-agnostic brand class template shared across all branches | `studio-owner-save-brand-class-template` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Branch manager instantiates recurring schedule class from brand template with automatic teacher sync | `studio-owner-schedule-class-from-brand-template-sync-teacher` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Studio owner deletes class template blueprint | `studio-owner-delete-class-template` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.20` | Studio owner records in-person walk-in sale and deposits class credits into member wallet via stepper | `studio-owner-grant-pass-walkin-stepper` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Admin grant pass stepper clamps at 1 and prevents decrementing to zero or negative | `studio-owner-grant-pass-stepper-lower-bound-clamp` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.20` | Admin pass grant attempts deposit to unregistered member email and aborts with zero writes | `studio-owner-grant-pass-nonexistent-user-fails` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.12` | Prospective studio owner claims unclaimed shadow studio and uploads verification proof | `studio-owner-claim-shadow-profile` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.12` | Attempting to claim an already-verified studio is blocked | `studio-owner-claim-already-verified-studio-blocked` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.12` | Platform administrator reviews pending studio claim and approves ownership transfer | `platform-admin-approve-shadow-claim` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.12` | Platform administrator rejects shadow claim with justification reason | `platform-admin-reject-shadow-claim` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11` | Studio owner permanently soft-closes studio location and subsequently reopens it | `studio-owner-soft-close-and-reopen-studio` | `REGRESSION` | **P1** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_regression.spec.ts) |
| `§5.11` | Brand founder confirms brand network deletion and assigned branch studios revert to independent locations | `brand-founder-delete-brand-preserves-independent-studios` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |

---

### Excluded TBD Capabilities Matrix

| Feature Key | Name | Reason for Exclusion from Active Catalogue |
| :--- | :--- | :--- |
| `F-5.14-parent-brand-nav` | Parent Brand Badge Navigation | Unimplemented; marked TBD in FEATURES.md line 736 |
| `F-5.15-my-bookings` | My Bookings Dashboard | Unimplemented in PWA; tracked in TODO.md Step 15 |
| `F-5.15-credit-topup-stripe` | Stripe Payment Gateway Checkout | Unimplemented; payment gateway integration pending |
| `F-5.17-studio-membership-gating` | Studio Membership Access Control & Approvals | Unimplemented; tracked in TODO.md Step 17 |
| `F-5.18-dual-feed-publishing` | Studio Owner Dual-Feed Publishing | Unimplemented; tracked in TODO.md Step 18 |
| `F-5.20-pass-autorenew` | Pass Auto-Renewal Toggle | ON HOLD / TBD; recurring billing webhooks pending |
