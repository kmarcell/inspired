# Phase 4: Consolidated Seed Gap & Persona Report

**Date:** 2026-10-25  
This report maps all retained Playwright scenarios to existing seeded personas, flags required test extensions and new seed personas, and defines the isolation ownership rules for parallel execution.

---

## 1. Existing Persona Scenario Mapping

| Persona | Role | Retained Scenarios Supported | Concurrency Rule |
| :--- | :--- | :--- | :--- |
| `user_brand_founder (Marcus Vance)` | Studio-owner | **4 scenarios** | 0 shared (read-only); 4 cloned via `clonedPersona` |
| `user_david_kim (David Kim)` | Studio-owner | **4 scenarios** | 2 shared (read-only); 2 cloned via `clonedPersona` |
| `user_elena (Elena Rostova)` | Yogi | **4 scenarios** | 0 shared (read-only); 4 cloned via `clonedPersona` |
| `user_maryia (Maryia Sharma - Platform Admin)` | Studio-owner | **2 scenarios** | 0 shared (read-only); 2 cloned via `clonedPersona` |
| `user_maryia (Maryia Sharma)` | Studio-owner | **2 scenarios** | 0 shared (read-only); 2 cloned via `clonedPersona` |
| `user_newbie (Yoga Newbie)` | Yogi | **12 scenarios** | 8 shared (read-only); 4 cloned via `clonedPersona` |
| `user_owner_noteach (Omar Haddad)` | Studio-owner | **2 scenarios** | 1 shared (read-only); 1 cloned via `clonedPersona` |
| `user_sarah (Sarah Jenkins)` | Yogi | **45 scenarios** | 35 shared (read-only); 10 cloned via `clonedPersona` |
| `user_sophia_vane (Sophia Vane)` | Studio-owner | **19 scenarios** | 7 shared (read-only); 12 cloned via `clonedPersona` |
| `user_teacher_001 (Maya Sharma)` | Teacher | **11 scenarios** | 9 shared (read-only); 2 cloned via `clonedPersona` |

---

## 2. Seed Extensions & New Personas Required

To run the full suite without manual setup or skipping, the following targeted seed additions are identified:

| Proposed Entity / Persona | Required Seed Attributes | Scenarios Unblocked | Implementation Plan |
| :--- | :--- | :--- | :--- |
| `user_sarah_expired` | User holding pass with `expiresAt < now` | `yogi-book-class-expired-pass-excluded` | Extend `user_passes.json` with expired pass doc |
| `studio_full_class` | Class with `capacity: 1`, `bookedCount: 1` | `yogi-book-full-class-join-waitlist`, `yogi-leave-class-waitlist` | Add 1 full class in `studio_classes.json` |
| `studio_temp_closed` | Studio with `operatingStatus: 'temp_closed'` | `yogi-studio-profile-temporary-closure-notice`, `yogi-schedule-closed-studio-bookings-blocked` | Add or update studio in `studios.json` |
| `user_teacher_private` | Teacher with `isProfilePublic: false` | `teacher-private-profile-shields-personal-info`, `yogi-subscribe-unlock-private-teacher-profile` | Add private teacher persona in `users.json` |
| `user_teacher_zerosched` | Teacher with 0 scheduled classes | `teacher-view-classes-tab-empty-state` | Add teacher in `users.json` with no studio classes |
| `claim_pending_seed` | Studio claim with `status: 'pending'` | `platform-admin-approve-shadow-claim`, `platform-admin-reject-shadow-claim` | Add pending claim seed in `seeder.js` |

---

## 3. Parallel Execution Isolation Guidelines

1. **Shared Read-Only Personas (`isolation: 'shared'`):**
   - Scenarios mark `isolation: 'shared'` when performing read-only audits (navigation shell, pricing isolation, schedule inspection).
   - These run concurrently against base seeded personas (`user_sarah`, `user_david_kim`, `user_teacher_001`) with zero state mutation.

2. **Cloned Mutating Personas (`isolation: 'clone'`):**
   - Scenarios mark `isolation: 'clone'` whenever writing, booking, deleting, or updating state.
   - Must use `clonedPersona(personaId)` fixture from `Apps/PWA/src/test/e2e/fixtures.ts`.
   - Generates unique ID suffix `__<testId>`, creates temporary Auth user `<testId>@inspired.test`, and automatically cascades `recursiveDelete()` on fixture teardown.
