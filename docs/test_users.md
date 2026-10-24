# Test User Personas & Feature Completion Matrix

This document defines the seeded test user accounts for the Inspired Yoga Platform, outlining each persona's role, feature completion level, owned entities, pricing/currency configuration, and recommended testing scenarios.

---

## 1. Authentication & Security Policy

> [!IMPORTANT]
> **Password Policy**: In compliance with security guardrails, test passwords are **never** committed to version control. All seeded test accounts share the password configured in the local `.env` file under the environment variable:
> ```bash
> TEST_USER_PASSWORD=<your_local_test_password>
> ```
> Local sign-in is facilitated via the **Dev Password Login** tool on the login view (`data-testid="dev-email-input"` / `data-testid="dev-password-input"`).

---

## 2. Test User Persona Matrix

| User ID | Email | Display Name | Role & Permissions | Feature Completion Level | Owned Entities | Currencies & Policies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `user_sarah` | `user_sarah@inspired.test` | Sarah Jenkins | Yogi / Student | **Active Pass Holder** | None | Holds active 5-class pack pass (`pass_sarah_brand_5pack`) |
| `user_newbie` | `user_newbie@inspired.test` | Yoga Newbie | Yogi / Student | **Zero State** (Clean Slate) | None | No passes, no bookings |
| `user_teacher_001` | `user_teacher_001@inspired.test` | Maya Sharma | Freelance Teacher (`isTeacher: true`) | **Teacher Only** (No Studio) | None | Teaches at Askew & Ravenscourt studios |
| `user_david_kim` | `user_david_kim@inspired.test` | David Kim | Independent Studio Owner & Teacher | **Studio Setup, No Currencies** | Studio: Ravenscourt Park Zen Pavilion (`studio_ravenscourt_003`) | Brand: None<br>Currencies: None setup<br>Schedule: 2 outdoor classes |
| `user_sophia_vane` | `user_sophia_vane@inspired.test` | Sophia Vane | Independent Studio Owner & Teacher | **Studio with Custom Currencies** | Studio: Chelsea Sanctuary Studio (`studio_chelsea_004`) | Brand: None<br>Currencies: £22 drop-in, £190 10-pack<br>Policy: `custom_override`<br>Schedule: 2 classes |
| `user_elena` | `user_elena@inspired.test` | Elena Rostova | Teacher & Brand Branch Studio Owner | **Brand Branch Manager** | Studio: Chiswick Hot Yoga Studio (`studio_chiswick_002`) | Parent Brand: Affordable London Yoga<br>Policy: `follow_brand`<br>Pass: Staff Unlimited Pass<br>Schedule: 3 hot yoga classes |
| `user_brand_founder` | `user_brand_founder@inspired.test` | Marcus Vance | Brand Founder & Teacher | **Brand Zero State** (Brand + Studio, No Currencies) | Brand: The Zen Collective (`company_zen_collective`)<br>Studio: Fulham Flow (`studio_fulham_005`) | Currencies: None setup<br>Schedule: None setup |
| `user_maryia` | `user_maryia@inspired.test` | Maryia Sharma | Brand Founder, Studio Owner & Platform Admin (`isAdmin: true`) | **100% Feature-Complete** | Brand: Affordable London Yoga (`company_affordable_london`)<br>Studio: Askew Road Zen Den (`studio_askew_001`) | Currencies: £15 drop-in, £65 5-pack, £120/mo unlimited<br>Policy: `follow_brand`<br>Templates: 2 brand class templates<br>Schedule: 3 daily classes |

---

## 3. Granular Persona Profiles & Test Scenarios

### 3.1 `user_sarah` — Active Yogi / Student
- **Profile**: Sarah Jenkins (`user_sarah@inspired.test`)
- **Capabilities**:
  - Regular student account with no administrative or teaching privileges.
  - Member of Askew community and Askew Road Zen Den.
  - Active digital pass wallet containing a 5-class pack with 4 remaining credits (`pass_sarah_brand_5pack`), expiring at the end of the year.
- **Testing Scenarios**:
  - Class booking flow redeeming an active pass credit.
  - Viewing active passes in the User Pass Wallet (`UserPassWalletView`).
  - Pass credit refund testing upon cancellation $\ge 12$h before class start.

---

### 3.2 `user_newbie` — Clean Slate Yogi (Zero State)
- **Profile**: Yoga Newbie (`user_newbie@inspired.test`)
- **Capabilities**:
  - Brand new student account with empty pass wallet and no booking history.
  - Minimal joined communities (`area_askew`).
- **Testing Scenarios**:
  - Onboarding flow and display name handle prefilling (`name#XXXX`).
  - Area search and discovery mode recommendations.
  - Attempting to book a class with an empty wallet, triggering the "No Pass Available" / Currency Store purchase modal.

---

### 3.3 `user_teacher_001` — Freelance Teacher (No Studio)
- **Profile**: Maya Sharma (`user_teacher_001@inspired.test`)
- **Capabilities**:
  - Certified yoga teacher (`isTeacher: true`).
  - Assigned as teacher for classes at Askew Road Zen Den and Ravenscourt Park Zen Pavilion.
  - Does **not** own a brand or studio; has no studio management permissions.
- **Testing Scenarios**:
  - Teacher Profile view: verify classes tab lists Maya's upcoming scheduled flows across studios.
  - Verify absence of studio administration / pricing configuration tabs.
  - Teacher Schedule Modal (`TeacherScheduleModal.tsx`) multi-studio timetable viewing.

---

### 3.4 `user_david_kim` — Independent Studio Owner (No Currencies)
- **Profile**: David Kim (`user_david_kim@inspired.test`)
- **Capabilities**:
  - Teacher and owner of an independent, standalone studio: Ravenscourt Park Zen Pavilion (`studio_ravenscourt_003`).
  - Has claimed studio ownership, studio bio, and outdoor park classes scheduled.
  - **Zero Pricing State**: Has not yet configured any studio pricing, drop-in rates, or credit packs.
- **Testing Scenarios**:
  - Studio management subpage: navigating to "Pricing & Currency Policy" tab.
  - Creating first standalone studio currencies from an empty catalog.
  - Verifying schedule view prompts when classes lack accepted pricing currencies.

---

### 3.5 `user_sophia_vane` — Independent Studio Owner (Custom Currencies)
- **Profile**: Sophia Vane (`user_sophia_vane@inspired.test`)
- **Capabilities**:
  - Teacher and owner of boutique standalone studio: Chelsea Sanctuary Studio (`studio_chelsea_004`).
  - Not affiliated with any parent brand network.
  - Pre-configured custom studio currencies:
    - `curr_chelsea_dropin`: Sanctuary Drop-in (£22)
    - `curr_chelsea_10pack`: 10-Class Sound Healing & Yoga Pack (£190)
  - Studio currency policy configured as `custom_override`.
- **Testing Scenarios**:
  - Managing custom studio currency catalog (editing prices, promo discount windows).
  - Verifying independent studio pricing isolation (ensuring Chelsea currencies are not exposed to other studios).
  - Granting passes to students directly from the Studio Admin front-desk tool (`grantUserPass`).

---

### 3.6 `user_elena` — Teacher & Brand Branch Studio Owner
- **Profile**: Elena Rostova (`user_elena@inspired.test`)
- **Capabilities**:
  - Teacher and owner of Chiswick Hot Yoga Studio (`studio_chiswick_002`), which is a branch of Affordable London Yoga (`company_affordable_london`).
  - Does **not** own the parent brand (Maryia Sharma is the founder).
  - Currency policy is set to `follow_brand`, accepting all parent brand passes (`curr_brand_dropin`, `curr_brand_5pack`, `curr_brand_unlimited`).
  - Holds a Staff Unlimited Pass (`pass_elena_staff`).
- **Testing Scenarios**:
  - Branch manager workflow: managing studio branch settings while inheriting brand pricing policies.
  - Toggling between `Follow Brand` and `Custom Studio Policy` modes.
  - Teaching schedule at Chiswick and Askew studios.

---

### 3.7 `user_brand_founder` — Brand Founder Zero State
- **Profile**: Marcus Vance (`user_brand_founder@inspired.test`)
- **Capabilities**:
  - Founder of a brand network: The Zen Collective (`company_zen_collective`).
  - Owner of an initial branch studio: Fulham Flow Studio (`studio_fulham_005`).
  - **Zero Setup State**: No brand currencies created, no studio currencies configured, and no classes on the schedule.
- **Testing Scenarios**:
  - Brand Founder onboarding experience: setting up brand currency catalog from scratch.
  - Defining brand-wide class packs and unlimited passes.
  - Registering initial class schedule and associating with new currencies.

---

### 3.8 `user_maryia` — Feature-Complete Brand Founder & Studio Owner
- **Profile**: Maryia Sharma (`user_maryia@inspired.test`)
- **Capabilities**:
  - Full platform administrator (`isAdmin: true`), brand founder, and studio owner.
  - Founder of Affordable London Yoga (`company_affordable_london`).
  - Owner of Askew Road Zen Den (`studio_askew_001`).
  - **100% Feature Completion**:
    - Brand Currency Catalog: Single Class Drop-in (£15), 5-Class Pack (£65), Monthly Unlimited Membership (£120).
    - Studio Currency Policy: `follow_brand`.
    - Class Templates: Vinyasa Flow Blueprint, Hot Ashtanga Blueprint (`company_class_templates`).
    - Active Class Schedule: 3 daily classes (Dynamic Vinyasa, Hot Ashtanga Primary 35°C, Yin & Sound Bath).
    - Studio Members: 5 active members seeded.
- **Testing Scenarios**:
  - Full administrative suite: Brand Settings, Branch Studio Management, Currency Editor, Class Template Manager.
  - Staging Admin Claim Review and Pass Granting.
  - End-to-end regression validation for brand networks.

---

## 4. Supplementary Privacy Personas

These supplementary accounts are maintained for security, privacy, and audience visibility regression testing:

| User ID | Email | Privacy Configuration | Purpose |
| :--- | :--- | :--- | :--- |
| `user_groups_only` | `user_groups_only@inspired.test` | `avatarPrivacy: "groups-only"`, `showJoinedGroups: "groups-only"` | Verifies avatar and group visibility is restricted to mutual community members. |
| `user_members_only` | `user_members_only@inspired.test` | `avatarPrivacy: "members-only"`, `showJoinedGroups: "members-only"` | Verifies content is shielded from non-members. |
| `user_privacy_001` | `user_privacy_001@inspired.test` | Fully Public | Baseline for public search indexing. |
| `user_privacy_002` | `user_privacy_002@inspired.test` | Overlapping Community Member | Tests cross-community privacy gating. |
| `user_privacy_003` | `user_privacy_003@inspired.test` | Completely Private (`isProfilePublic: false`) | Ensures strict privacy isolation in search and member lists. |

---

## 5. Hydration & Testing Commands

To hydrate the local emulator environment with this full persona matrix:

```bash
# Seed local Firebase Emulator (Auth + Firestore)
npm run seed:local

# Execute automated E2E UI regression suite across personas
pnpm test:e2e
```
