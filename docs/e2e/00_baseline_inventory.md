# Phase 0: Baseline Inventory (PWA E2E Regression)

**Date:** 2026-10-25  
**Document Reference:** `docs/e2e/00_baseline_inventory.md`  
**Parent Plan:** [docs/e2e_regression_scenario_plan.md](file:///home/marcellkresz/developer/inspired/docs/e2e_regression_scenario_plan.md)  
**Scope:** Vite PWA (`Apps/PWA`). Universal backend (Firestore & Firebase Auth Emulators).

---

## 1. Feature Inventory

Below is the complete inventory of all user-facing capabilities defined in `FEATURES.md` (§5.1–§5.20) and `UserFlows.md`. Each capability is assigned a stable feature key. Per plan mandate, features marked **TBD / Unimplemented** in the PWA are explicitly identified and **excluded** from the automated regression scenario catalogue.

| Feature Key | Name & Description | Specification Source | PWA Implementation Status | Primary UI Component(s) |
| :--- | :--- | :--- | :--- | :--- |
| `F-5.1-login` | **Login & Authentication Flow**<br>Magic link request with 60s cooldown timer, Google Sign-In, and Dev credentials login (`dev-email-input`, `dev-password-input`) on local/staging environments. | `FEATURES.md` §5.1, `UserFlows.md` §1.2 | **Built & Active** | `LoginView.tsx` |
| `F-5.1.1-session-mgmt` | **Cold Start & Session Restoration**<br>Automatic session restoration state machine (`launching` → `login` / `onboarding` / `authenticated`). | `FEATURES.md` §5.1.1, `UserFlows.md` §1.1 | **Built & Active** | `AuthContext.tsx`, `App.tsx` |
| `F-5.2-landing-shell` | **Landing Page Shell & Responsive Header**<br>Header with logo, interactive search bar, joined communities shortcut icon, user profile avatar, and navigation tabs. | `FEATURES.md` §5.2 | **Built & Active** | `App.tsx`, `SearchView.tsx` |
| `F-5.3-community-feed` | **Community Feed & 3-Tier Fallback**<br>Dynamic feed fallback (30d active area posts → 180d posts → Discovery Mode suggestions). Post card with avatar, handle, source badge, content, relative timestamp. | `FEATURES.md` §5.3 | **Built & Active** | `CommunityFeedView.tsx`, `FeedPostTile.tsx` |
| `F-5.3.1-privacy-fallback` | **Privacy Fallback & Stale Metadata**<br>Displaying fallback avatars for `groups-only` / `private` profiles when viewer is not a member; graceful rendering of deleted profiles. | `FEATURES.md` §5.3.1 | **Built & Active** | `FeedPostTile.tsx`, `StudioMembersView.tsx` |
| `F-5.4-onboarding` | **User Onboarding & Moderation**<br>First-time profile setup: display name validation ($\ge 2$ chars), handle generation (`name#1234`), Cloud Function moderation check (`validateDisplayName`), and profile document creation. | `FEATURES.md` §5.4 | **Built & Active** | `OnboardingView.tsx` |
| `F-5.5-localization` | **Localization & Currency Formatting**<br>Multi-language string fallback and localized currency symbol formatting (`£`, `$`, `€`). | `FEATURES.md` §5.5 | **Built & Active** | `colorTokens.ts`, shared formatters |
| `F-5.6-issue-reporting` | **Issue Reporting & Support**<br>Pre-filled Google Form integration passing user ID and environment metadata from profile screen. | `FEATURES.md` §5.6 | **Built & Active** | `ProfileView.tsx` |
| `F-5.7-security-access` | **Security & Access Control**<br>Firestore security rules enforcing least-privilege read/write permissions across users, companies, studios, classes, currencies, and passes. | `FEATURES.md` §5.7 | **Built & Active** | `infrastructure/backend/firestore.rules` |
| `F-5.8-responsive-nav-profile` | **Profile View, Settings & Theme Toggling**<br>Avatar tap routing to Profile Screen, handle display, bio editor, granular privacy toggles (`isProfilePublic`, `avatarPrivacy`, `showJoinedGroups`), Light/Dark mode toggling, and mobile logout. | `FEATURES.md` §5.8 | **Built & Active** | `ProfileView.tsx`, `ThemeContext.tsx` |
| `F-5.8-maint-mode` | **Maintenance Mode Screen**<br>Remote Config-driven non-dismissible maintenance screen displaying maintenance title, announcement message, and estimated return time. | `FEATURES.md` §5.8 (Maint) | **Built & Active** | `App.tsx` |
| `F-5.9-search-discovery` | **Search & Discovery Engine**<br>Multi-entity search with priority ranking (Area > Name > Keyword), postcode prefix matching (`SW3`, `W12`), category badges (👥 Community vs 🏢 Studio vs 📍 Area), empty state discovery, and unclaimed shadow profile claim prompt. | `FEATURES.md` §5.9 | **Built & Active** | `SearchView.tsx` |
| `F-5.10-joined-communities` | **Joined Communities Management**<br>Summary tiles for joined communities, join/leave actions, empty state recommendations, and direct feed navigation. | `FEATURES.md` §5.10 | **Built & Active** | `JoinedCommunitiesView.tsx` |
| `F-5.11-company-multi-studio` | **Company & Multi-Studio Creation & Management**<br>Brand company creation, 2-step studio branch setup (Brand Selection → Studio Location), My Studios dashboard, 3-tab studio management subpage (General Settings, Pricing & Policies, Timetable), and studio deletion confirmation modal. | `FEATURES.md` §5.11, §5.20 | **Built & Active** | `CreateStudioView.tsx`, `MyStudiosView.tsx` |
| `F-5.12-admin-claim-review` | **Shadow Profile Claiming & Admin Approval**<br>Claim button on shadow studio search tiles, document/proof verification submission form, and admin review dashboard (`AdminClaimsView`) with approve/reject actions and email notifications. | `FEATURES.md` §5.12 | **Built & Active** | `ClaimStudioView.tsx`, `AdminClaimsView.tsx` |
| `F-5.13-staging-gating` | **Staging Access Security & Invite Gating**<br>Staging admin email whitelist check preventing unauthorized registrations. | `FEATURES.md` §5.13 | **Built & Active** | `authService.ts`, `firestore.rules` |
| `F-5.14-studio-profile-schedule` | **Studio Profile Page & Class Schedule**<br>Studio profile header (banner, operating status, teachers carousel, cascading community join), 7-day schedule selector, class tiles with underlined teacher links, waitlist status indicator, `ClassInfoModal` (5 climate presets), and Studio Members list. | `FEATURES.md` §5.14 | **Built & Active** | `StudioProfileView.tsx`, `StudioScheduleView.tsx`, `ClassInfoModal.tsx`, `StudioMembersView.tsx` |
| `F-5.14-parent-brand-nav` | **Parent Brand Badge Navigation**<br>Tapping parent brand badge on studio profile opens brand community feed / profile. | `FEATURES.md` §5.14 (line 736) | **TBD / Unimplemented** *(Excluded from Discovery)* | N/A |
| `F-5.15-my-bookings` | **My Bookings Dashboard**<br>Student bookings dashboard grouped by studio with active pass status and class cancellation buttons. | `FEATURES.md` §5.15 | **TBD / Unimplemented** *(Excluded from Discovery)* | `TODO.md` Step 15 |
| `F-5.15-credit-topup-stripe` | **Payment Gateway Credit Top-Up**<br>Stripe/Apple Pay credit purchase checkout for real-money pass purchases. | `FEATURES.md` §5.15 | **TBD / Unimplemented** *(Excluded from Discovery)* | `TODO.md` Step 15 |
| `F-5.16-class-creator-recurrence` | **Studio Class Creator & Outlook Recurrence Engine**<br>Class creation form (Title, Category, Teacher Assignment, Room Climate, Capacity, Duration); Draft / Template / Published statuses; Outlook-style recurrence engine; Class Currency Acceptance Selector ("Accept All" vs "Custom Selected Currencies/Passes"); Brand Class Templates & Drafts Manager (`StudioClassManagerView`); Schedule Class from Template modal. | `FEATURES.md` §5.16 | **Built & Active** | `CreateClassView.tsx`, `StudioClassManagerView.tsx`, `CreateClassFromTemplateModal.tsx` |
| `F-5.17-studio-membership-gating` | **Studio Membership Access Control & Approval Workflow**<br>Studio membership policy (`open_membership` vs `invite_only_approval`), "Request to Join" workflow, and Owner Membership Approval dashboard (`StudioMembershipRequestsView`). | `FEATURES.md` §5.17 | **TBD / Unimplemented** *(Excluded from Discovery)* | `TODO.md` Step 17 |
| `F-5.18-dual-feed-publishing` | **Studio Owner Dual-Feed Publishing**<br>Publishing posts simultaneously to studio branch and neighborhood area feeds with visibility toggles. | `FEATURES.md` §5.18 | **TBD / Unimplemented** *(Excluded from Discovery)* | `TODO.md` Step 18 |
| `F-5.19-unified-profile` | **Unified Profile Architecture**<br>4 Profile variants (Personal Yogi/Teacher, Area Neighborhood Community, Parent Brand Network, Studio Branch); Hero banner, emblem, metric bar, canonical sub-tabs (💬 Feed, 🏢 Studios / 🧘 Classes, ℹ️ About, 👥 Members); `TeacherScheduleModal` calendar overlay with studio filters. | `FEATURES.md` §5.19 | **Built & Active** | `UnifiedProfileView.tsx`, `TeacherScheduleModal.tsx` |
| `F-5.20-currency-catalog` | **Brand & Standalone Currency Catalog**<br>Currency catalog manager in `MyStudiosView` (drop-in, credit packs 1/5/10, unlimited passes, 40% OFF promo window); Studio Currency Acceptance Policy selector (`Follow Brand` vs `Custom Studio Policy`). | `FEATURES.md` §5.20 | **Built & Active** | `MyStudiosView.tsx` |
| `F-5.20-pass-wallet` | **User Pass Digital Wallet**<br>Digital wallet displaying active passes, credit balances, unlimited memberships, and expiration dates. | `FEATURES.md` §5.20 | **Built & Active** | `UserPassWalletView.tsx` |
| `F-5.20-booking-pass-selector` | **Class Booking Pass Selector & Validation**<br>Pass selection modal filtered by eligible currency passes, disabled state on zero credits/no pass, ARIA radio semantics, and booking transaction deduction. | `FEATURES.md` §5.20 | **Built & Active** | `BookingPassSelectionModalView.tsx`, `NoPassAvailableModalView.tsx`, `CurrencyStoreCheckoutModalView.tsx` |
| `F-5.20-admin-grant-pass` | **Admin Pass & Credit Granting Modal**<br>Admin modal allowing studio/brand owners to manually grant passes and credits to test users with quantity stepper. | `FEATURES.md` §5.20 | **Built & Active** | `AdminGrantPassModalView.tsx` |
| `F-5.20-pass-autorenew` | **Pass Auto-Renewal Toggle**<br>Recurring subscription renewal toggle on pass models. | `FEATURES.md` §5.20 (line 1067) | **TBD / ON HOLD** *(Excluded from Discovery)* | N/A |

---

## 2. Existing Test Coverage Inventory

### 2.1 Component & Unit Tests (Vitest + React Testing Library)
All 25 test suites pass (102 unit/component tests).

| Test File Path | Feature Key(s) | Test Level | Key Assertions / Capabilities Covered |
| :--- | :--- | :--- | :--- |
| `Apps/PWA/src/components/__tests__/LoginView.test.tsx` | `F-5.1-login` | Component | Email format validation, magic link cooldown timer, dev credentials login. |
| `Apps/PWA/src/context/__tests__/AuthContext.test.tsx` | `F-5.1.1-session-mgmt` | Unit / State | Auth state machine (`launching` → `login` / `onboarding` / `authenticated`), session token restore. |
| `Apps/PWA/src/components/__tests__/OnboardingView.test.tsx` | `F-5.4-onboarding` | Component | Display name validation ($\ge 2$ chars), handle generation (`name#1234`), profile creation call. |
| `Apps/PWA/src/components/__tests__/CommunityFeedView.test.tsx` | `F-5.3-community-feed` | Component | 3-tier feed fallback (30d active area → 180d posts → Discovery Mode empty suggestions). |
| `Apps/PWA/src/components/__tests__/JoinedCommunitiesView.test.tsx` | `F-5.10-joined-communities` | Component | Joined community list display, unjoin/leave action, recommended communities empty state. |
| `Apps/PWA/src/components/__tests__/ProfileView.test.tsx` | `F-5.8-responsive-nav-profile`, `F-5.6-issue-reporting` | Component | Avatar & bio editing, privacy toggles (`isProfilePublic`, `avatarPrivacy`, `showJoinedGroups`), issue report link. |
| `Apps/PWA/src/context/__tests__/ThemeContext.test.tsx` | `F-5.8-responsive-nav-profile` | Unit / Context | Light and dark mode preference persistence, theme class injection. |
| `Apps/PWA/src/theme/__tests__/colorTokens.test.ts` | `F-5.5-localization`, `F-5.8-responsive-nav-profile` | Unit | Design system color token contrast, WCAG AA compliance verification. |
| `Apps/PWA/src/components/__tests__/SearchView.test.tsx` | `F-5.9-search-discovery` | Component | Postcode prefix matching (`SW3`, `W12`), priority ranking (Area > Name > Keyword), Discovery suggestions, Claim button. |
| `Apps/PWA/src/components/__tests__/CreateStudioView.test.tsx` | `F-5.11-company-multi-studio` | Component | Step 1 Brand Selection, Step 2 Location details, validation constraints. |
| `Apps/PWA/src/components/__tests__/MyStudiosView.test.tsx` | `F-5.11-company-multi-studio`, `F-5.20-currency-catalog` | Component | Multi-brand overview, 3-tab in-place navigation, currency editor detail view, studio deletion confirmation. |
| `Apps/PWA/src/components/__tests__/ClaimStudioView.test.tsx` | `F-5.12-admin-claim-review` | Component | Shadow studio claim initiation, proof document upload, owner contact form. |
| `Apps/PWA/src/components/__tests__/AdminClaimsView.test.tsx` | `F-5.12-admin-claim-review` | Component | Admin claim approval, rejection, and verification status badges. |
| `Apps/PWA/src/components/StudioProfileView.test.tsx` | `F-5.14-studio-profile-schedule` | Component | Profile banner, operating status badge, teacher carousel, tab navigation, cascading join/unjoin. |
| `Apps/PWA/src/components/ClassInfoModal.test.tsx` | `F-5.14-studio-profile-schedule` | Component | Modal overlay popup, 5 adaptive room climate presets (Hot, Air Conned, Heated, Natural, Outdoor). |
| `Apps/PWA/src/components/StudioMembersView.test.tsx` | `F-5.14-studio-profile-schedule`, `F-5.3.1-privacy-fallback` | Component | Member list rendering, privacy fallback masking for private profiles. |
| `Apps/PWA/src/components/__tests__/CreateClassView.test.tsx` | `F-5.16-class-creator-recurrence` | Component | Admin class creation form, teacher assignment, recurrence engine, status saving (`draft`/`template`/`published`). |
| `Apps/PWA/src/components/__tests__/StudioClassManagerView.test.tsx` | `F-5.16-class-creator-recurrence` | Component | Brand class templates, studio drafts list, in-place embedded timetable tab. |
| `Apps/PWA/src/components/__tests__/CreateClassFromTemplateModal.test.tsx` | `F-5.16-class-creator-recurrence` | Component | Scheduling class from template, target studio teacher sync, date picker. |
| `Apps/PWA/src/components/__tests__/UnifiedProfileView.test.tsx` | `F-5.19-unified-profile` | Component | 4 profile variants rendering, 2-metric bar, canonical tab strip, TeacherScheduleModal invocation. |
| `Apps/PWA/src/components/__tests__/UserPassWalletView.test.tsx` | `F-5.20-pass-wallet` | Component | Active passes list, remaining credits counter, unlimited badges, expiration display. |
| `Apps/PWA/src/components/__tests__/BookingPassSelectionModalView.test.tsx` | `F-5.20-booking-pass-selector` | Component | Pass selection radio list, disabled button on no match, eligible currency filtering. |
| `Apps/PWA/src/components/__tests__/NoPassAvailableModalView.test.tsx` | `F-5.20-booking-pass-selector` | Component | Empty pass wallet fallback modal, redirect to currency store. |
| `Apps/PWA/src/components/__tests__/AdminGrantPassModalView.test.tsx` | `F-5.20-admin-grant-pass` | Component | Pass grant stepper (`[ - ] N [ + ]`), studio currency selection, student assignment. |
| `Apps/PWA/src/services/__tests__/firestoreService.test.ts` | `F-5.3-community-feed`, `F-5.16-class-creator-recurrence`, `F-5.20-currency-catalog` | Service Unit | 30-item `in` query chunking, class recurrence calculation, pass booking deduction and refund rules. |

### 2.2 End-to-End Regression Tests (Playwright)
Location: `Apps/PWA/src/test/e2e/regression_suite.spec.ts` (10 tests, executes in ~4s in parallel).

| Test Name / Scenario | Feature Key(s) | Isolation Level | Coverage Summary |
| :--- | :--- | :--- | :--- |
| `authenticate and audit navigation shell for Sarah Jenkins (user_sarah)` | `F-5.1-login`, `F-5.2-landing-shell`, `F-5.10-joined-communities` | `shared` (read-only) | Verifies dev login, navigation shell, Askew community membership tile, and clean logout. |
| `authenticate and audit navigation shell for Yoga Newbie (user_newbie)` | `F-5.1-login`, `F-5.2-landing-shell` | `shared` (read-only) | Verifies clean-slate yogi login, header bar rendering, zero-state navigation shell. |
| `authenticate and audit navigation shell for Maya Sharma (user_teacher_001)` | `F-5.1-login`, `F-5.2-landing-shell` | `shared` (read-only) | Verifies freelance teacher login, teacher profile rendering. |
| `authenticate and audit navigation shell for David Kim (user_david_kim)` | `F-5.1-login`, `F-5.11-company-multi-studio` | `shared` (read-only) | Verifies independent studio owner login, "My Studios" navigation entry point. |
| `authenticate and audit navigation shell for Sophia Vane (user_sophia_vane)` | `F-5.1-login`, `F-5.11-company-multi-studio`, `F-5.20-currency-catalog` | `shared` (read-only) | Verifies custom-currency studio owner login, "My Studios" navigation entry point. |
| `authenticate and audit navigation shell for Omar Haddad (user_owner_noteach)` | `F-5.1-login`, `F-5.11-company-multi-studio` | `shared` (read-only) | Verifies non-teaching studio owner login, "My Studios" navigation entry point. |
| `authenticate and audit navigation shell for Elena Rostova (user_elena)` | `F-5.1-login`, `F-5.10-joined-communities`, `F-5.11-company-multi-studio` | `shared` (read-only) | Verifies brand branch manager login, Chiswick community tile, "My Studios" navigation. |
| `authenticate and audit navigation shell for Marcus Vance (user_brand_founder)` | `F-5.1-login`, `F-5.11-company-multi-studio` | `shared` (read-only) | Verifies brand founder login, navigation shell. |
| `authenticate and audit navigation shell for Maryia Sharma (user_maryia)` | `F-5.1-login`, `F-5.11-company-multi-studio` | `shared` (read-only) | Verifies 100% feature-complete brand founder & admin login, navigation shell. |
| `independent studio pricing isolation prevents brand pass leakage` | `F-5.20-currency-catalog`, `F-5.14-studio-profile-schedule` | `shared` (read-only) | Logs in as Sarah (student holding brand pass), opens Chelsea Sanctuary Studio (`custom_override`), asserts Chelsea standalone rates (£22 / £190) render and Brand rates (£15 / £65) do not leak. |

---

## 3. Persona & Seed Data Inventory

All personas are seeded deterministically from `infrastructure/seeds/` and maintained via `infrastructure/scripts/seeder.js`.

### 3.1 Persona Capability Matrix

| Persona ID | Display Name | Role & Flags | Owned Entities & Locations | Passes & Currencies | Current Test Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_sarah` | Sarah Jenkins | Yogi / Student<br>`isTeacher: false` | None | Member: Askew community<br>Pass: `pass_sarah_brand_5pack` (4 credits) | Navigation audit, Pricing isolation test |
| `user_newbie` | Yoga Newbie | Clean-Slate Yogi<br>`isTeacher: false` | None | Member: `area_askew`<br>Passes: 0 passes, 0 bookings | Navigation audit |
| `user_teacher_001` | Maya Sharma | Freelance Teacher<br>`isTeacher: true` | None (teaches at Askew, Ravenscourt, Shoreditch) | Passes: None | Navigation audit |
| `user_david_kim` | David Kim | Independent Studio Owner<br>`isTeacher: true` | Studio: Ravenscourt Park Pavilion (`studio_ravenscourt_003`) | Brand: None<br>Currencies: None setup<br>Schedule: 2 outdoor classes | Navigation audit |
| `user_sophia_vane` | Sophia Vane | Independent Studio Owner<br>`isTeacher: true` | Studio: Chelsea Sanctuary (`studio_chelsea_004`) | Brand: None<br>Currencies: £22 drop-in, £190 10-pack<br>Policy: `custom_override` | Navigation audit, Pricing isolation test |
| `user_owner_noteach` | Omar Haddad | Non-Teaching Studio Owner<br>`isTeacher: false` | Studio: Shoreditch Stillpoint (`studio_shoreditch_006`) | Brand: None<br>Currencies: £18 drop-in, £80 5-pack<br>Policy: `custom_override`<br>Visiting Teacher: Maya Sharma | Navigation audit |
| `user_elena` | Elena Rostova | Brand Branch Studio Owner<br>`isTeacher: true` | Studio: Chiswick Hot Yoga (`studio_chiswick_002`) | Parent Brand: Affordable London Yoga<br>Policy: `follow_brand`<br>Pass: Staff Unlimited Pass | Navigation audit |
| `user_brand_founder` | Marcus Vance | Brand Founder & Teacher<br>`isTeacher: true` | Brand: The Zen Collective (`company_zen_collective`)<br>Studio: Fulham Flow (`studio_fulham_005`) | Currencies: None setup<br>Schedule: None setup | Navigation audit |
| `user_maryia` | Maryia Sharma | Brand Founder, Studio Owner, Admin<br>`isTeacher: true`, `isAdmin: true` | Brand: Affordable London Yoga<br>Studio: Askew Road Zen Den (`studio_askew_001`) | Currencies: £15 drop-in, £65 5-pack, £120 unlimited<br>Policy: `follow_brand`<br>Templates: 2 brand class templates | Navigation audit |

### 3.2 Seed Gaps Identified for Scenario Discovery

When generating scenarios in Phase 1, the following states are not currently represented in base seeds and must either use `clonePersona` state mutation or trigger seed extensions in Phase 4:

1. **Yogi with Expired Pass:**
   - *Need:* Yogi holding a pass where `expiresAt < now`.
   - *Purpose:* Validating that expired passes do not appear as selectable in `BookingPassSelectionModalView` and cannot be redeemed.
2. **Full Studio Class with Active Waitlist:**
   - *Need:* A studio class configured with `capacity: 1` that already has 1 booked attendee (`bookedCount: 1`), with room for waitlisting.
   - *Purpose:* Testing the "Join Waitlist" booking flow and ensuring waitlisted state displays correctly.
3. **Class in the Past (Expired Schedule Item):**
   - *Need:* A published studio class whose `startTime` is in the past.
   - *Purpose:* Testing that booking past classes is disabled/blocked in UI.
4. **Shadow Studio Profile with Pending Claim:**
   - *Need:* An unclaimed studio that already has a claim record with status `pending`.
   - *Purpose:* Testing the claim status banner ("Claim under review") and preventing duplicate claim submissions.
5. **Class with Custom Currency Acceptance Exclusions:**
   - *Need:* A studio class with `currencyAcceptancePolicy: 'custom'` where only drop-ins are accepted and credit packs are excluded.
   - *Purpose:* Testing that Sarah's 5-pack pass is filtered out of the booking pass modal for that specific class.

---

## 4. Environment & Test Isolation Architecture

### 4.1 Local Running Environment
- **Vite Dev Server:** `http://localhost:5173`
- **Firebase Firestore Emulator:** `localhost:8081` (configured in `firebase.json`)
- **Firebase Auth Emulator:** `localhost:9099` (configured in `firebase.json`)
- **Single Source of Truth:** Ports are read programmatically from `firebase.json` via `infrastructure/scripts/lib/emulator.js`. `assertEmulatorOnly()` aborts execution if attempted against production GCP.

### 4.2 State Management & Parallel Safety Rules
1. **Destructive Base Seeder (`pnpm seed:local`):**
   - Wipes all Firestore collections and Firebase Auth emulator users.
   - **MANDATE:** Never execute during parallel test execution. Run only once during global setup or hard reset.
2. **Read-Only Scenarios (`isolation: 'shared'`):**
   - Safe to execute against base seeded personas (`user_sarah`, `user_david_kim`, etc.) concurrently.
   - Must only perform read assertions (navigation, view rendering, pricing display).
3. **Mutating Scenarios (`isolation: 'clone'`):**
   - Must use the Playwright fixture `clonedPersona(personaId)` from `Apps/PWA/src/test/e2e/fixtures.ts`.
   - Cloner creates deep copies of the persona, owned studios, communities, currencies, templates, and passes with suffixed IDs (`__<testId>`).
   - Stamps each document with `_testClone: { runId, testId }`.
   - Creates a dedicated Auth user `<testId>@inspired.test` with `TEST_USER_PASSWORD`.
   - On test teardown (pass or fail), recursively deletes all cloned documents and the Auth user.
4. **Assertion Hygiene:**
   - Never assert absolute counts on global collections (search results, feeds, community lists).
   - Target cloned entities using IDs or titles containing `testId`.

---

## 5. Next Action
With Phase 0 Baseline Inventory established and committed, proceed to **Phase 1: Independent Scenario Generation** across the 3 approved actors (`yogi`, `teacher`, `studio-owner`) and 3 lenses (`Feature Analyst`, `SDET`, `Product Owner`).
