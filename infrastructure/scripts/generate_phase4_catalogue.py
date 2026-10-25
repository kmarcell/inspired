#!/usr/bin/env python3
"""
generate_phase4_catalogue.py
Executes Phase 4 of the E2E Regression Scenario Discovery:
1. Scores each of the 123 canonical merged scenarios across Impact, Likelihood, Coverage Gap, and Automation Cost.
2. Applies the Cut List (filtering out pure input validations and low-impact tests already covered by Vitest).
3. Assigns scenarios to suite tiers: smoke (P0), regression (P0 + P1), and extended (P2).
4. Outputs:
   - docs/e2e/scenario_catalogue.md
   - docs/e2e/coverage_matrix.md
   - docs/e2e/seed_gap_report.md
"""

import os
import re
from collections import defaultdict
from generate_merged_and_open_questions import YOGI_CLUSTERS, TEACHER_CLUSTERS, STUDIO_OWNER_CLUSTERS

OUTPUT_DIR = 'docs/e2e'

# Scoring Rules:
# Impact (1-3): 3 = blocks revenue/auth/data, 2 = degrades core journey, 1 = cosmetic/edge
# Likelihood (1-3): 3 = high frequency/high regression risk, 2 = regular journey, 1 = rare
# Coverage Gap (0-2): 0 = already covered by e2e, 1 = unit/component only, 2 = uncovered
# Cost: S (fast read/simple assertion), M (cloner setup/single mutation), L (multi-step workflow/modal chaining)

def score_and_tier_scenarios():
    all_clusters = []
    for c in YOGI_CLUSTERS:
        c_copy = dict(c)
        c_copy['actor'] = 'yogi'
        all_clusters.append(c_copy)
    for c in TEACHER_CLUSTERS:
        c_copy = dict(c)
        c_copy['actor'] = 'teacher'
        all_clusters.append(c_copy)
    for c in STUDIO_OWNER_CLUSTERS:
        c_copy = dict(c)
        c_copy['actor'] = 'studio-owner'
        all_clusters.append(c_copy)

    cut_list = []
    retained_scenarios = []

    for s in all_clusters:
        sid = s['id']
        p = s['priority']
        typ = s['type']
        auto_status = s['automation_status']

        # Determine Impact & Likelihood
        if p == 'P0':
            impact = 3
            likelihood = 3 if typ == 'happy' else 2
        elif p == 'P1':
            impact = 2
            likelihood = 2 if typ == 'happy' else 1
        else: # P2
            impact = 1
            likelihood = 1

        # Specific adjustments
        if 'auth' in sid or 'login' in sid or 'booking' in sid or 'book' in sid or 'currency' in sid:
            impact = max(impact, 2)
            
        # Coverage Gap
        if 'e2e' in auto_status:
            coverage_gap = 0
        elif 'unit' in auto_status:
            coverage_gap = 1
        else:
            coverage_gap = 2

        # Automation Cost
        if s['isolation'] == 'clone':
            cost = 'M' if ('never' in sid or 'recurrence' in sid or 'batch' in sid) else 'S'
            if 'stepper' in sid or 'template' in sid or 'wizard' in sid:
                cost = 'M'
        else:
            cost = 'S'

        product_score = impact * likelihood
        s['impact'] = impact
        s['likelihood'] = likelihood
        s['coverage_gap'] = coverage_gap
        s['cost'] = cost
        s['product_score'] = product_score

        source_count = len(s.get('draft_ids', []))
        if source_count >= 3:
            signal = '3/3 (Core Triad Consensus)'
        elif source_count == 2:
            signal = '2/3 (Multi-Lens Overlap)'
        else:
            signal = '1/3 (Single-Lens Deep-Dive)'
        s['triad_signal'] = signal

        # Cut List Decision:
        # Cut if:
        # 1. Pure validation already 100% covered by Vitest with zero browser value (e.g. empty password, short name < 2 chars, invalid email format)
        # 2. Impact 1 and Likelihood 1 (pure cosmetic / minor edge)
        # 3. Explicitly skipped due to known production gap
        is_cut = False
        cut_reason = ""

        if 'skipped' in auto_status:
            is_cut = True
            cut_reason = "Skipped pending production code gap remediation (tracked in TODO.md / ROADMAP.md)"
        elif sid in [
            'visitor-login-empty-password-disabled',
            'visitor-magic-link-invalid-email-rejected',
            'visitor-onboarding-name-boundary-accepted',
            'teacher-enforce-bio-charlimit-truncation',
            'studio-owner-create-currency-empty-title-fails',
            'studio-owner-grant-pass-empty-recipient-fails',
            'yogi-search-clear-input-resets'
        ]:
            is_cut = True
            cut_reason = "Pure HTML5/React input validation fully verified by Vitest unit tests (zero integration risk)"
        elif impact == 1 and likelihood == 1 and coverage_gap <= 1 and typ == 'edge':
            is_cut = True
            cut_reason = "Low impact (1) and low likelihood (1) edge case already tested in component tests"

        if is_cut:
            s['cut_reason'] = cut_reason
            cut_list.append(s)
        else:
            # Assign Tier
            if p == 'P0':
                tier = 'smoke'
            elif p == 'P1':
                tier = 'regression'
            else:
                tier = 'extended'
            s['tier'] = tier
            retained_scenarios.append(s)

    return retained_scenarios, cut_list

def generate_catalogue_doc(retained, cut_list):
    out = ["# Phase 4: Final E2E Regression Scenario Catalogue (Playwright)\n\n"]
    out.append("**Date:** 2026-10-25  \n")
    out.append("**Status:** Prioritised, Scored & Filtered (Ready for User Review & Spec Authoring)  \n")
    out.append(f"**Total Retained Scenarios:** {len(retained)} (out of 123 canonical merged scenarios)  \n")
    out.append(f"**Total Cut Scenarios:** {len(cut_list)}  \n\n---\n\n")

    out.append("## 1. Executive Summary & Suite Architecture\n\n")
    
    by_tier = defaultdict(list)
    by_actor = defaultdict(list)
    for r in retained:
        by_tier[r['tier']].append(r)
        by_actor[r['actor']].append(r)

    out.append(f"- **Suite Tiers:**\n")
    out.append(f"  - **`smoke` (P0 - {len(by_tier['smoke'])} scenarios):** Run on every pull request. Covers critical paths: Dev auth, cold-start session restore, core postcode search, class booking with pass credit deduction, 12h cancellation credit refund, multi-studio schedule viewing, non-teaching owner class scheduling, and standalone currency management.\n")
    out.append(f"  - **`regression` (P0 + P1 - {len(by_tier['smoke']) + len(by_tier['regression'])} scenarios):** Run on merge to `main` and pre-release staging deployments. Covers standard user journeys, boundary conditions, custom currency isolation, temporary closures, and shadow studio claims.\n")
    out.append(f"  - **`extended` (P2 - {len(by_tier['extended'])} scenarios):** Nightly or pre-major release test run. Covers theme toggling, issue reporting link prefill, empty states, and minor edge boundaries.\n\n")

    out.append(f"- **Breakdown by Actor:**\n")
    out.append(f"  - **Yogi (Student / Visitor):** {len(by_actor['yogi'])} scenarios\n")
    out.append(f"  - **Teacher:** {len(by_actor['teacher'])} scenarios\n")
    out.append(f"  - **Studio Owner & Admin:** {len(by_actor['studio-owner'])} scenarios\n\n")

    out.append("---\n\n")
    out.append("## 2. Cut List (Filtered Scenarios & Rationale)\n\n")
    out.append("| Scenario ID | Actor | Original Priority | Rationale for Cut |\n")
    out.append("| :--- | :--- | :--- | :--- |\n")
    for c in cut_list:
        out.append(f"| `{c['id']}` | `{c['actor']}` | **{c['priority']}** | {c['cut_reason']} |\n")

    out.append("\n---\n\n")
    out.append("## 3. Retained Scenario Catalogue by Actor\n\n")

    for actor in ['yogi', 'teacher', 'studio-owner']:
        group = by_actor[actor]
        out.append(f"### Actor: {actor.upper()} ({len(group)} Scenarios)\n\n")
        
        # Sort by tier: smoke -> regression -> extended
        tier_order = {'smoke': 0, 'regression': 1, 'extended': 2}
        sorted_group = sorted(group, key=lambda x: (tier_order.get(x['tier'], 9), x['id']))

        for s in sorted_group:
            out.append(f"#### {s['id']} — {s['title']}\n")
            out.append(f"- **ID:** {s['id']}\n")
            out.append(f"- **Actor:** {s['actor']}\n")
            out.append(f"- **Suite Tier:** `[{s['tier'].upper()}]` | **Priority:** **{s['priority']}**\n")
            out.append(f"- **Scoring:** Impact: `{s['impact']}/3` | Likelihood: `{s['likelihood']}/3` | Gap: `{s['coverage_gap']}/2` | Cost: `{s['cost']}`\n")
            out.append(f"- **Feature ref:** {s['feature_ref']}\n")
            out.append(f"- **Type:** {s['type']}\n")
            out.append(f"- **Triad Signal:** {s['triad_signal']}\n")
            out.append(f"- **Prerequisites:** {s['prerequisites']}\n")
            out.append(f"- **Suggested test user:** {s['suggested_user']}\n")
            out.append(f"- **Seed gap:** {s['seed_gap']}\n")
            out.append(f"- **Preconditions (Given):** {s['preconditions']}\n")
            out.append(f"- **Steps:**\n")
            for step in s['steps']:
                out.append(f"  - {step}\n")
            out.append(f"- **Isolation:** `{s['isolation']}`\n")
            out.append(f"- **Data / reset notes:** {s['data_reset']}\n")
            out.append(f"- **Platforms:** {s['platforms']}\n")
            out.append(f"- **Automation status:** {s['automation_status']}\n\n")

    with open(os.path.join(OUTPUT_DIR, 'scenario_catalogue.md'), 'w', encoding='utf-8') as f:
        f.write("".join(out))
    print(f"Generated scenario_catalogue.md with {len(retained)} scenarios.")

def generate_coverage_matrix_doc(retained, cut_list):
    out = ["# Phase 4: E2E Coverage Matrix\n\n"]
    out.append("**Date:** 2026-10-25  \n")
    out.append("This matrix maps every functional capability in `FEATURES.md` to its corresponding E2E regression scenarios, automation status, and test isolation mode.\n\n---\n\n")

    out.append("| Feature Key | Feature Name | Scenario ID | Tier | Priority | Isolation | Current Automation Status |\n")
    out.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")

    for s in retained:
        feat = s['feature_ref'].replace('FEATURES.md ', '')
        out.append(f"| `{feat}` | {s['title'][:40]}... | `{s['id']}` | `{s['tier'].upper()}` | **{s['priority']}** | `{s['isolation']}` | {s['automation_status']} |\n")

    out.append("\n---\n\n")
    out.append("### Excluded TBD Capabilities Matrix\n\n")
    out.append("| Feature Key | Name | Reason for Exclusion from Active Catalogue |\n")
    out.append("| :--- | :--- | :--- |\n")
    out.append("| `F-5.14-parent-brand-nav` | Parent Brand Badge Navigation | Unimplemented; marked TBD in FEATURES.md line 736 |\n")
    out.append("| `F-5.15-my-bookings` | My Bookings Dashboard | Unimplemented in PWA; tracked in TODO.md Step 15 |\n")
    out.append("| `F-5.15-credit-topup-stripe` | Stripe Payment Gateway Checkout | Unimplemented; payment gateway integration pending |\n")
    out.append("| `F-5.17-studio-membership-gating` | Studio Membership Access Control & Approvals | Unimplemented; tracked in TODO.md Step 17 |\n")
    out.append("| `F-5.18-dual-feed-publishing` | Studio Owner Dual-Feed Publishing | Unimplemented; tracked in TODO.md Step 18 |\n")
    out.append("| `F-5.20-pass-autorenew` | Pass Auto-Renewal Toggle | ON HOLD / TBD; recurring billing webhooks pending |\n")

    with open(os.path.join(OUTPUT_DIR, 'coverage_matrix.md'), 'w', encoding='utf-8') as f:
        f.write("".join(out))
    print("Generated coverage_matrix.md")

def generate_seed_gap_report_doc(retained):
    out = ["# Phase 4: Consolidated Seed Gap & Persona Report\n\n"]
    out.append("**Date:** 2026-10-25  \n")
    out.append("This report maps all retained Playwright scenarios to existing seeded personas, flags required test extensions and new seed personas, and defines the isolation ownership rules for parallel execution.\n\n---\n\n")

    out.append("## 1. Existing Persona Scenario Mapping\n\n")
    persona_map = defaultdict(list)
    for s in retained:
        persona_map[s['suggested_user']].append(s)

    out.append("| Persona | Role | Retained Scenarios Supported | Concurrency Rule |\n")
    out.append("| :--- | :--- | :--- | :--- |\n")
    for persona, scs in sorted(persona_map.items()):
        if not persona.startswith('NEW:'):
            clone_count = sum(1 for x in scs if x['isolation'] == 'clone')
            shared_count = sum(1 for x in scs if x['isolation'] == 'shared')
            rule = f"{shared_count} shared (read-only); {clone_count} cloned via `clonedPersona`"
            out.append(f"| `{persona}` | {scs[0]['actor'].capitalize()} | **{len(scs)} scenarios** | {rule} |\n")

    out.append("\n---\n\n")
    out.append("## 2. Seed Extensions & New Personas Required\n\n")
    out.append("To run the full suite without manual setup or skipping, the following targeted seed additions are identified:\n\n")
    out.append("| Proposed Entity / Persona | Required Seed Attributes | Scenarios Unblocked | Implementation Plan |\n")
    out.append("| :--- | :--- | :--- | :--- |\n")
    out.append("| `user_sarah_expired` | User holding pass with `expiresAt < now` | `yogi-book-class-expired-pass-excluded` | Extend `user_passes.json` with expired pass doc |\n")
    out.append("| `studio_full_class` | Class with `capacity: 1`, `bookedCount: 1` | `yogi-book-full-class-join-waitlist`, `yogi-leave-class-waitlist` | Add 1 full class in `studio_classes.json` |\n")
    out.append("| `studio_temp_closed` | Studio with `operatingStatus: 'temp_closed'` | `yogi-studio-profile-temporary-closure-notice`, `yogi-schedule-closed-studio-bookings-blocked` | Add or update studio in `studios.json` |\n")
    out.append("| `user_teacher_private` | Teacher with `isProfilePublic: false` | `teacher-private-profile-shields-personal-info`, `yogi-subscribe-unlock-private-teacher-profile` | Add private teacher persona in `users.json` |\n")
    out.append("| `user_teacher_zerosched` | Teacher with 0 scheduled classes | `teacher-view-classes-tab-empty-state` | Add teacher in `users.json` with no studio classes |\n")
    out.append("| `claim_pending_seed` | Studio claim with `status: 'pending'` | `platform-admin-approve-shadow-claim`, `platform-admin-reject-shadow-claim` | Add pending claim seed in `seeder.js` |\n")

    out.append("\n---\n\n")
    out.append("## 3. Parallel Execution Isolation Guidelines\n\n")
    out.append("1. **Shared Read-Only Personas (`isolation: 'shared'`):**\n")
    out.append("   - Scenarios mark `isolation: 'shared'` when performing read-only audits (navigation shell, pricing isolation, schedule inspection).\n")
    out.append("   - These run concurrently against base seeded personas (`user_sarah`, `user_david_kim`, `user_teacher_001`) with zero state mutation.\n\n")
    out.append("2. **Cloned Mutating Personas (`isolation: 'clone'`):**\n")
    out.append("   - Scenarios mark `isolation: 'clone'` whenever writing, booking, deleting, or updating state.\n")
    out.append("   - Must use `clonedPersona(personaId)` fixture from `Apps/PWA/src/test/e2e/fixtures.ts`.\n")
    out.append("   - Generates unique ID suffix `__<testId>`, creates temporary Auth user `<testId>@inspired.test`, and automatically cascades `recursiveDelete()` on fixture teardown.\n")

    with open(os.path.join(OUTPUT_DIR, 'seed_gap_report.md'), 'w', encoding='utf-8') as f:
        f.write("".join(out))
    print("Generated seed_gap_report.md")

if __name__ == '__main__':
    retained, cut_list = score_and_tier_scenarios()
    print(f"Scored {len(retained) + len(cut_list)} scenarios: {len(retained)} retained, {len(cut_list)} cut.")
    generate_catalogue_doc(retained, cut_list)
    generate_coverage_matrix_doc(retained, cut_list)
    generate_seed_gap_report_doc(retained)
