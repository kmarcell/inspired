# Phase 4: E2E Coverage Matrix

**Date:** 2026-10-25  
This matrix maps every functional capability in `FEATURES.md` to its corresponding E2E regression scenarios, automation status, and test isolation mode.

---

| Feature Key | Feature Name | Scenario ID | Tier | Priority | Isolation | Current Automation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `§5.1, §5.2` | Yogi authenticates via Dev credentials a... | `yogi-auth-dev-login-success` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1` | Visitor attempts login with incorrect pa... | `visitor-login-wrong-password-fails` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1` | Visitor requests magic link and 60-secon... | `visitor-magic-link-cooldown-throttled` | `REGRESSION` | **P1** | `shared` | partial (UI cooldown timer automated; out-of-band email delivery is manual runbook only) |
| `§5.13` | Uninvited visitor email is rejected on s... | `visitor-staging-login-uninvited-blocked` | `REGRESSION` | **P1** | `shared` | none |
| `§5.1.1, UserFlows.md §1.1` | Authenticated yogi reloads application a... | `yogi-cold-start-session-restore` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.1, §5.8` | Yogi logs out cleanly and application re... | `yogi-logout-session-terminated` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.4` | First-time yogi completes onboarding, va... | `yogi-onboarding-complete-profile` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.4` | Onboarding rejects display names shorter... | `visitor-onboarding-short-name-rejected` | `REGRESSION` | **P1** | `clone` | unit-only (OnboardingView.test.tsx) |
| `§5.4` | Onboarding blocks offensive display name... | `visitor-onboarding-profane-name-rejected` | `REGRESSION` | **P1** | `clone` | unit-only (OnboardingView.test.tsx) |
| `§5.9` | Yogi opens Search view and sees Discover... | `yogi-search-discovery-initial-state` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.9` | Yogi searches outward postcode prefix an... | `yogi-search-by-postcode-prefix` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.9` | Yogi searches area name and finds matchi... | `yogi-search-by-area-name` | `REGRESSION` | **P1** | `shared` | unit-only (SearchView.test.tsx) |
| `§5.9` | Unmatched search query displays empty no... | `yogi-search-no-results-discovery-fallback` | `REGRESSION` | **P1** | `shared` | unit-only (SearchView.test.tsx) |
| `§5.9, §5.12` | Yogi views unclaimed shadow studio tile ... | `yogi-search-unclaimed-shadow-studio` | `REGRESSION` | **P1** | `shared` | unit-only (SearchView.test.tsx) |
| `§5.9, §5.14` | Search result studio tiles display accur... | `yogi-search-operating-status-badges` | `EXTENDED` | **P2** | `shared` | unit-only (SearchView.test.tsx) |
| `§5.3` | Yogi views chronological feed stream of ... | `yogi-feed-view-unified-stream` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.3` | Feed executes 3-tier discovery fallback ... | `yogi-feed-empty-area-3tier-fallback` | `REGRESSION` | **P1** | `shared` | unit-only (CommunityFeedView.test.tsx) |
| `§5.3.1` | Feed post by author with groups-only pri... | `yogi-feed-post-avatar-privacy-fallback` | `REGRESSION` | **P1** | `shared` | unit-only (FeedPostTile.tsx) |
| `§5.3` | Yogi likes and unlikes a feed post updat... | `yogi-feed-post-like-toggle` | `EXTENDED` | **P2** | `clone` | none |
| `§5.10` | Yogi views list of joined communities an... | `yogi-joined-communities-view-list` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.10, §5.15` | Yogi leaves a joined community via overf... | `yogi-joined-communities-leave-community` | `REGRESSION` | **P1** | `clone` | unit-only (JoinedCommunitiesView.test.tsx) |
| `§5.10` | Clean-slate yogi with 0 communities view... | `yogi-joined-communities-empty-state` | `EXTENDED` | **P2** | `shared` | unit-only (JoinedCommunitiesView.test.tsx) |
| `§5.14` | Yogi views studio profile header details... | `yogi-studio-profile-view-details` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi joins studio branch executing atomi... | `yogi-studio-profile-cascading-join` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi views studio with temporary closure... | `yogi-studio-profile-temporary-closure-notice` | `REGRESSION` | **P1** | `shared` | none |
| `§5.14, §5.3.1` | Studio members directory enforces privac... | `yogi-studio-members-privacy-enforcement` | `REGRESSION` | **P1** | `shared` | unit-only (StudioMembersView.test.tsx) |
| `§5.14` | Yogi navigates 7-day studio timetable se... | `yogi-schedule-view-7day-calendar` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi opens Class Info Modal and inspects... | `yogi-schedule-view-class-info-modal` | `REGRESSION` | **P1** | `shared` | unit-only (ClassInfoModal.test.tsx) |
| `§5.16, §5.20` | Studio schedule class tile displays Cust... | `yogi-schedule-view-custom-currency-badge` | `REGRESSION` | **P1** | `shared` | none |
| `§5.14` | Unjoined yogi attempting to book class i... | `yogi-schedule-unjoined-book-join-prompt` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Bookings are disabled on schedule when s... | `yogi-schedule-closed-studio-bookings-blocked` | `REGRESSION` | **P1** | `shared` | none |
| `§5.14` | Yogi cannot book a class session schedul... | `yogi-book-past-class-disabled` | `REGRESSION` | **P1** | `shared` | none |
| `§5.14, §5.20` | Returning yogi books open class redeemin... | `yogi-book-class-with-pass-success` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi booking with unlimited subscription... | `yogi-book-class-unlimited-pass-intact` | `REGRESSION` | **P1** | `clone` | unit-only (firestoreService.test.ts) |
| `§5.14, §5.20` | Yogi cancels class booking >= 12h before... | `yogi-cancel-class-booking-refund` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi with 0 credits attempts booking and... | `yogi-book-class-no-pass-triggers-store` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.20` | Yogi holding expired pass cannot select ... | `yogi-book-class-expired-pass-excluded` | `REGRESSION` | **P1** | `clone` | unit-only (BookingPassSelectionModalView.test.tsx) |
| `§5.20` | Pass selector modal filters out passes i... | `yogi-booking-pass-selector-filters-custom-currency` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.14` | Yogi joins waitlist when class reaches f... | `yogi-book-full-class-join-waitlist` | `REGRESSION` | **P1** | `clone` | none |
| `§5.14` | Yogi leaves class waitlist updating butt... | `yogi-leave-class-waitlist` | `EXTENDED` | **P2** | `clone` | none |
| `§5.20` | Yogi simulates pass purchase in developm... | `yogi-dev-store-purchase-pass-activation` | `REGRESSION` | **P1** | `clone` | none |
| `§5.20` | Yogi audits active passes, credit counts... | `yogi-pass-wallet-view-active-passes` | `REGRESSION` | **P1** | `shared` | unit-only (UserPassWalletView.test.tsx) |
| `§5.20` | Yogi with no passes views clean empty st... | `yogi-pass-wallet-view-empty-state` | `EXTENDED` | **P2** | `shared` | unit-only (UserPassWalletView.test.tsx) |
| `§5.8` | Yogi updates personal bio in profile set... | `yogi-profile-edit-bio` | `REGRESSION` | **P1** | `clone` | unit-only (ProfileView.test.tsx) |
| `§5.8` | Yogi configures granular privacy toggles... | `yogi-profile-toggle-privacy-settings` | `REGRESSION` | **P1** | `clone` | unit-only (ProfileView.test.tsx) |
| `§5.8` | Yogi toggles Light and Dark theme prefer... | `yogi-profile-switch-theme` | `EXTENDED` | **P2** | `shared` | unit-only (ThemeContext.test.tsx) |
| `§5.6` | Tapping Report an Issue generates pre-fi... | `yogi-profile-issue-reporting-link` | `EXTENDED` | **P2** | `shared` | unit-only (ProfileView.test.tsx) |
| `§5.2, §5.8` | Responsive navigation shell renders desk... | `yogi-shell-header-navigation-audit` | `REGRESSION` | **P1** | `shared` | e2e (Apps/PWA/src/test/e2e/regression_suite.spec.ts) |
| `§5.8 (Maint)` | Remote Config maintenance mode activates... | `visitor-maintenance-mode-barrier` | `REGRESSION` | **P1** | `shared` | none |
| `§5.19` | Yogi views public teacher profile creden... | `yogi-view-public-teacher-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.19` | Teacher profile classes sub-tab caps cla... | `yogi-view-teacher-classes-rolling-7day-cap` | `REGRESSION` | **P1** | `shared` | unit-only (UnifiedProfileView.test.tsx) |
| `§5.19, §5.8` | Yogi views private teacher profile displ... | `yogi-view-private-teacher-profile-guard` | `REGRESSION` | **P1** | `shared` | unit-only (UnifiedProfileView.test.tsx) |
| `§5.19` | Yogi opens Teacher Schedule Modal from t... | `yogi-view-teacher-multi-studio-schedule-modal` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/yogi_smoke.spec.ts) |
| `§5.19` | Teacher views personal profile overview,... | `teacher-view-own-profile-overview` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Teacher classes sub-tab displays rolling... | `teacher-classes-rolling-seven-day-capping` | `REGRESSION` | **P1** | `shared` | unit-only (UnifiedProfileView.test.tsx) |
| `§5.19` | Teacher opens TeacherScheduleModal calen... | `teacher-open-multistudio-schedule-modal` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Filtering TeacherScheduleModal by studio... | `teacher-filter-schedule-modal-by-studio` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.19` | Filtering TeacherScheduleModal for studi... | `teacher-filter-schedule-modal-zero-state` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.19` | Switching day pills in TeacherScheduleMo... | `teacher-switch-calendar-day-updates-classes` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.19` | TeacherScheduleModal renders mobile bott... | `teacher-schedule-modal-responsive-layout` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.19, §5.14` | Tapping studio link on teacher class car... | `teacher-navigate-to-studio-from-class-card` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.14` | Teacher appears in Teachers at this Stud... | `teacher-verify-carousel-presence-at-studio` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping teacher card in studio carousel ... | `teacher-carousel-link-opens-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping underlined teacher link on studi... | `teacher-schedule-tile-link-opens-profile` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.14, §5.19` | Tapping teacher link inside ClassInfoMod... | `teacher-class-info-modal-link-opens-profile` | `REGRESSION` | **P1** | `shared` | unit-only (ClassInfoModal.test.tsx) |
| `§5.19` | Teacher appears in Teachers in this Area... | `teacher-area-community-presence-and-navigation` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.11, §5.19` | Freelance teacher accessing My Studios v... | `teacher-view-my-studios-non-owner-boundary` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/teacher_smoke.spec.ts) |
| `§5.8, §5.19` | Private teacher profile shields personal... | `teacher-private-profile-shields-personal-info` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.8` | Teacher updates personal bio and credent... | `teacher-update-bio-persists` | `REGRESSION` | **P1** | `clone` | unit-only (ProfileView.test.tsx) |
| `§5.8` | Enabling public profile on teacher accou... | `teacher-configure-public-discovery-enforces-avatar-public` | `REGRESSION` | **P1** | `clone` | unit-only |
| `§5.7, §5.14` | Visiting teacher cannot modify host stud... | `teacher-visiting-schedule-isolation` | `REGRESSION` | **P1** | `shared` | none |
| `§5.19` | Student subscribing to teacher profile u... | `yogi-subscribe-unlock-private-teacher-profile` | `REGRESSION` | **P1** | `clone` | unit-only |
| `§5.19` | Student cleanly unsubscribes from teache... | `yogi-unsubscribe-from-teacher` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.11` | Studio owner creates new brand network a... | `studio-owner-create-brand-and-studio` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | User creates independent standalone stud... | `studio-owner-create-independent-studio` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | Studio creation form blocks submission w... | `studio-owner-create-studio-missing-required-fields` | `REGRESSION` | **P1** | `shared` | unit-only (CreateStudioView.test.tsx) |
| `§5.11` | Brand creation enforces strict email reg... | `studio-owner-create-brand-invalid-email` | `REGRESSION` | **P1** | `shared` | unit-only (CreateStudioView.test.tsx) |
| `§5.11, §5.20` | Studio owner navigates unified in-place ... | `studio-owner-manage-studio-3tabs-navigation` | `SMOKE` | **P0** | `shared` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.11` | Verified studio owner updates studio bio... | `studio-owner-edit-studio-bio` | `REGRESSION` | **P1** | `clone` | unit-only (MyStudiosView.test.tsx) |
| `§5.11, §5.14` | Studio owner pauses location with tempor... | `studio-owner-set-temp-closed-with-note` | `REGRESSION` | **P1** | `clone` | unit-only (MyStudiosView.test.tsx) |
| `§5.11, §5.14` | Studio owner reopens temporarily closed ... | `studio-owner-reopen-temp-closed-studio` | `REGRESSION` | **P1** | `clone` | unit-only |
| `§5.11` | Studio owner links independent studio to... | `studio-owner-reassign-independent-studio-to-brand` | `REGRESSION` | **P1** | `clone` | unit-only |
| `§5.20` | Brand founder defines multi-branch curre... | `studio-owner-create-brand-currency-catalog` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Independent studio owner establishes stu... | `studio-owner-create-standalone-currency-catalog` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Branch owner switches policy from follow... | `studio-owner-switch-policy-follow-to-custom` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Branch owner reverts from custom_overrid... | `studio-owner-switch-policy-custom-to-follow` | `REGRESSION` | **P1** | `clone` | unit-only (MyStudiosView.test.tsx) |
| `§5.20` | Studio owner updates currency title, pri... | `studio-owner-edit-currency-pricing` | `REGRESSION` | **P1** | `clone` | unit-only |
| `§5.20` | Selecting unlimited pass type disables a... | `studio-owner-currency-creation-unlimited-credits-disabled` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.20` | Studio owner cancels in-progress currenc... | `studio-owner-discard-currency-changes-safeguard` | `EXTENDED` | **P2** | `shared` | unit-only |
| `§5.16` | Studio owner publishes ongoing weekly re... | `studio-owner-publish-weekly-recurring-class-with-climate` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Studio owner sets occurrence-based recur... | `studio-owner-recurrence-occurrences-boundary` | `REGRESSION` | **P1** | `clone` | unit-only (firestoreService.test.ts) |
| `§5.16` | Recurrence engine rejects end dates earl... | `studio-owner-recurrence-date-inverted-failure` | `REGRESSION` | **P1** | `shared` | unit-only (CreateClassView.test.tsx) |
| `§5.16` | Non-teaching studio owner creates class ... | `non-teaching-owner-assigns-visiting-teacher` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16, §5.20` | Studio owner publishes specialty class r... | `studio-owner-create-class-restricted-currency-acceptance` | `REGRESSION` | **P1** | `clone` | unit-only (CreateClassView.test.tsx) |
| `§5.16` | Class creation blocks saving when class ... | `studio-owner-create-class-missing-title-fails` | `REGRESSION` | **P1** | `shared` | unit-only (CreateClassView.test.tsx) |
| `§5.16` | Publishing live class without assigned t... | `studio-owner-publish-class-missing-teacher-fails` | `REGRESSION` | **P1** | `shared` | unit-only (CreateClassView.test.tsx) |
| `§5.16` | Studio owner saves incomplete class as d... | `studio-owner-save-class-draft` | `REGRESSION` | **P1** | `clone` | unit-only (StudioClassManagerView.test.tsx) |
| `§5.16` | Studio owner converts saved draft direct... | `studio-owner-publish-draft-directly` | `REGRESSION` | **P1** | `clone` | unit-only (StudioClassManagerView.test.tsx) |
| `§5.16` | Studio owner deletes unwanted class draf... | `studio-owner-delete-class-draft` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.16` | Brand founder creates teacher-agnostic b... | `studio-owner-save-brand-class-template` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Branch manager instantiates recurring sc... | `studio-owner-schedule-class-from-brand-template-sync-teacher` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.16` | Studio owner deletes class template blue... | `studio-owner-delete-class-template` | `EXTENDED` | **P2** | `clone` | unit-only |
| `§5.20` | Studio owner records in-person walk-in s... | `studio-owner-grant-pass-walkin-stepper` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.20` | Admin grant pass stepper clamps at 1 and... | `studio-owner-grant-pass-stepper-lower-bound-clamp` | `REGRESSION` | **P1** | `shared` | unit-only (AdminGrantPassModalView.test.tsx) |
| `§5.20` | Admin pass grant attempts deposit to unr... | `studio-owner-grant-pass-nonexistent-user-fails` | `REGRESSION` | **P1** | `shared` | unit-only (AdminGrantPassModalView.test.tsx) |
| `§5.12` | Prospective studio owner claims unclaime... | `studio-owner-claim-shadow-profile` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.12` | Attempting to claim an already-verified ... | `studio-owner-claim-already-verified-studio-blocked` | `REGRESSION` | **P1** | `shared` | unit-only |
| `§5.12` | Platform administrator reviews pending s... | `platform-admin-approve-shadow-claim` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |
| `§5.12` | Platform administrator rejects shadow cl... | `platform-admin-reject-shadow-claim` | `REGRESSION` | **P1** | `clone` | unit-only (AdminClaimsView.test.tsx) |
| `§5.11` | Studio owner permanently soft-closes stu... | `studio-owner-soft-close-and-reopen-studio` | `REGRESSION` | **P1** | `clone` | unit-only (MyStudiosView.test.tsx) |
| `§5.11` | Brand founder confirms brand network del... | `brand-founder-delete-brand-preserves-independent-studios` | `SMOKE` | **P0** | `clone` | e2e (Apps/PWA/src/test/e2e/studio_owner_smoke.spec.ts) |

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
