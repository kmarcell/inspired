# E2E Regression Scenario Discovery Plan (Playwright)

**Status:** Plan only. No agents instructed, no tests written. Awaiting approval.
**Created:** 2026-10-25
**Scope:** Vite PWA (`Apps/PWA`). iOS is out of scope.
**Source of truth:** `FEATURES.md` (§5.x screen behaviours), `docs/pwa_feature_parity_matrix.md`, `UserFlows.md`, `docs/test_users.md`, and the components in `Apps/PWA/src/components`.

## 1. Goal
Produce one **scenario catalogue**. Each scenario is a real-life user journey and has two uses:
1. **Automation backlog.** Each scenario maps to one Playwright test.
2. **Manual runbook.** A human can follow the scenario by hand to check a production issue, or when the automation itself is suspect.

## 2. Scenario Rules
- **Naming.** Use `actor-action-outcome` for the title and a kebab-case ID.
  - Example: "Yogi books a class with credits" has the ID `yogi-book-class-with-credits`.
- **Actors.** `visitor`, `yogi`, `teacher`, `studio-owner`, `admin`, and company owner if applicable.
- **Valid failure paths only.** A failure scenario must be reachable through the UI.
  - In scope:
    - Searching for a studio that doesn't exist.
    - Booking with no credits.
    - Booking a full class.
    - Booking a class that has already started.
    - Wrong password.
    - Accessing a gated studio without approval.
  - Out of scope:
    - Backend or network outage.
    - Anything the UI's input validation makes impossible to submit, such as a disabled button or a constrained picker.
    - Instead, record in the scenario that the validation exists, and leave it to unit tests.
- **Independence.** Each scenario has its own preconditions and test data. It must not depend on another scenario's side effects.
- **Data.** Preconditions refer to seeded personas and studios by name (see `docs/test_users.md`). No credentials or PII go in the catalogue.
- **Seed-first principle.** Scenarios start from a persona that already has the needed state (e.g. a studio owner who already owns a studio), not from zero configuration.
  - The test should only perform the action under test. Setup through the UI happens only when that setup is itself the scenario (e.g. "teacher creates a schedule template").
  - Every scenario names a suggested test user, or flags the seed gap. The deduplicated list of gaps drives the seeding work before any test is built.
  - **Isolation:** each scenario is either `shared` (read-only, uses a seeded persona directly) or `clone` (the test clones its source persona with `clonePersona`, see §3.1). The suggested test user is the clone source.
- **Assertion hygiene (cross-test pollution).** All tests share one emulator while the suite runs in parallel, so a test must only assert on data it owns.
  - Look up things by a name or ID containing the test ID, never by position in a list.
  - Never assert counts on lists other tests can add to (search results, feeds, studio lists, member lists).
  - "Does not exist" scenarios search for a unique string nothing else creates.
  - `shared` scenarios must not assert on content that clones can change.
- **Format.** Each scenario has a Given/When/And/Then description. Steps must be concrete enough for a manual tester: where to click, what text to expect.

### 2.1 Scenario Template
```markdown
### yogi-book-class-no-credits — Yogi tries to book a class but has no credits
- **ID:** yogi-book-class-no-credits
- **Actor:** yogi (persona: <seeded user>)
- **Feature ref:** FEATURES.md §5.15 / §5.20
- **Type:** happy | valid-failure | edge
- **Priority (proposed):** P0 | P1 | P2
- **Prerequisites (state needed before the scenario starts):** a list of facts, e.g. "has 0 credits", "owns one studio with a published class tomorrow", "has no pass for Brand Z"
- **Suggested test user:** an existing seeded persona from `docs/test_users.md` that already satisfies the prerequisites, with the one-line reason
  - If none fits, write `NEW: <proposed persona name>` and list the exact state to seed. Do not make the test create this state itself.
- **Seed gap:** none | extend `<persona>` with … | new persona
- **Preconditions (Given):** seeded state, e.g. logged in as X with 0 credits at Studio Y
- **Steps:**
  - **Given** …
  - **When** …
  - **And** …
  - **Then** … (observable UI outcome, exact copy or element)
- **Isolation:** shared | clone
- **Data / reset notes:** what the scenario creates or changes (the cleanup must cover it)
- **Platforms:** desktop | mobile | both
- **Automation status:** none | unit-only | partial | e2e (link)
- **Source agent(s):** SDET / PO / Feature-Analyst
```

## 3. Phases

> [!NOTE]
> **Skip rule (decided):** Only well-understood, specified behaviour gets a scenario. Anything marked TBD or not yet defined in `FEATURES.md` (e.g. assigning a teacher to a studio's class) is skipped and not written up. If it must be recorded, use a single line, `scenario unknown, skipped, needs clarification`.

### Phase 0: Baseline inventory (single agent, runs first)
Output goes to `docs/e2e/00_baseline_inventory.md`.
- **Feature inventory.** List every user-facing capability in `FEATURES.md` §5.1–§5.20 and `UserFlows.md`.
  - Give each a stable feature key, e.g. `F-5.14-studio-calendar`.
  - Note which are `TBD` or unimplemented in the PWA, and exclude those from the catalogue (log them as "specified, not built").
- **Existing coverage inventory.**
  - Vitest/RTL: `Apps/PWA/src/**/*.test.tsx` and `src/components/__tests__`.
  - Puppeteer suite: `scripts/run_ui_regression_suite.js`, which covers login, communities, profile and pass wallet, and studio pricing isolation.
  - Link each to the feature key and say whether it's unit, component, or true e2e.
- **Persona and seed data inventory.**
  - Source: `docs/test_users.md` and `seeder.js`.
  - Gaps the scenarios would need (e.g. a user with 0 credits, a full class, a gated studio).
- **Environment inventory.** How to run the PWA locally against emulators or staging, and what resets state.

### Phase 1: Independent scenario generation (3 lenses × N actors, parallel, no sharing)
Run the three lenses **per actor**. Each agent covers one actor and one lens. It gets the Phase 0 inventory and the scenario rules/template, and **must not read the other agents' outputs**. Isolation is what makes the later overlap analysis meaningful.

**Actor split (decided):** 3 actors × 3 lenses = 9 agents. The actors are `yogi`, `teacher` and `studio-owner` (company owner included, admin excluded).
- A `teacher` may teach at a studio without owning it.
- A `studio-owner` may not teach at their studio.
- Scenarios must not assume the two roles go together.
- Each agent writes to `docs/e2e/drafts/<actor>_<lens>.md`.
- Journeys that cross actors (e.g. owner publishes a class, yogi books it) are written by the actor who performs the final assertion. They list the other actor in the prerequisites.

| Agent | Lens | Method | Output |
|---|---|---|---|
| **Feature Analyst** | Specification | Walks the `FEATURES.md` sections relevant to its actor and derives scenarios from every stated behaviour, state, and rule. | `docs/e2e/drafts/<actor>_feature_analyst.md` |
| **SDET** | Risk and testability | Boundary and state analysis (credits 0/1/many, capacity full, time-of-day cutoffs, role/permission matrix, mobile vs desktop). Flags flaky or hard-to-automate steps and data needs. | `docs/e2e/drafts/<actor>_sdet.md` |
| **Product Owner** | Business value | Real-life journeys from the actor's goals, ranked by user and revenue impact. Considers first-time user, returning user, and recovery paths. | `docs/e2e/drafts/<actor>_product_owner.md` |

Every scenario must fill in prerequisites, suggested test user and seed gap (see §2.1). Each agent also adds a short **Persona needs** section at the end of its draft that summarises the seed gaps it found.

Each agent also lists:
- Features it considered and chose **not** to cover, with reasons.
- Ambiguities or contradictions found in `FEATURES.md`.

#### Actor and journey checklist (all agents)
- **Visitor/yogi.**
  - Auth: sign-up, login, wrong password, magic link, logout, session persistence, onboarding.
  - Discovery: search studios/teachers/communities, no results, view studio profile and schedule.
  - Booking: book with credits, no credits, purchase credits, pass selection, currency acceptance, full class, cancel booking, My Bookings, pass wallet.
  - Community: join/leave, feed.
  - Profile: edit, privacy.
  - Membership: request access and approval for gated studios.
- **Teacher.** Profile, teaching schedule, class visibility.
- **Studio owner.**
  - Setup: create studio, claim shadow profile, brand and currency catalogue, acceptance policy, pricing.
  - Classes: class templates, drafts, recurrence (Outlook-style), publish, edit and cancel, live timetable (once built).
  - People: assign teachers, member approval, grant pass.
  - Publishing: dual-feed publishing.
- **Company owner.** Multi-studio management.
- **Admin.** Claim review, invite-only gating, grant pass.
- **Cross-cutting.** Responsive navigation (mobile and desktop, including the 3-tab studio management view), maintenance mode, localization, issue reporting.

### Phase 2: Normalise (1 agent)
Convert all three drafts to the template, with consistent actor and ID naming, into a single combined list (`docs/e2e/drafts/_normalised.md`). Nothing is dropped at this stage. Record each scenario's source agent(s).

### Phase 3: De-duplicate and merge (1 agent, then reviewed by me)
- **Duplicate:** same actor, trigger, and observable outcome. Merge, keep the best Given/When/Then, and keep all contributing sources.
- **Overlap:** the same journey with different data (e.g. 0 credits vs expired pass). Keep both only if the UI outcome differs.
- **Conflicts:** scenarios that disagree about expected behaviour. Do not resolve silently. Raise them in `docs/e2e/open_questions.md`.
- **Persona consolidation:** when merging, prefer one shared suggested test user across scenarios with the same prerequisites. Reconcile conflicting persona proposals from different agents.
- **Output:** `docs/e2e/drafts/_merged.md` plus a merge log (what was merged into what).
- **Signal.** Scenarios found by 3 of 3 agents are likely core. Scenarios found by only one are inspected for either a real gap or noise.

### Phase 4: Filter for impact and coverage (1 agent, reviewed by user)
Score each merged scenario:

| Dimension | Scale |
|---|---|
| **Impact** (what breaks if this fails in production) | 3 = blocks revenue or access, 2 = degrades a core journey, 1 = cosmetic or rare |
| **Likelihood** (how often it's used or how often it regresses) | 3 / 2 / 1 |
| **Coverage gap** | 0 = already covered by e2e, 1 = unit/component only, 2 = uncovered |
| **Automation cost** | S / M / L (data setup, flakiness) |

- **Priority.**
  - P0: Impact 3, or Impact × Likelihood ≥ 6.
  - P1: product ≥ 3.
  - P2: the rest.
- **Cuts.**
  - Remove scenarios fully covered by faster tests (pure validation, pure rendering).
  - Remove scenarios of Impact 1 and Likelihood 1.
  - Keep a "cut list" with reasons so the decisions are reviewable.
- **Suite tiers.**
  - `smoke` (P0, run on every PR).
  - `regression` (P0 and P1).
  - `extended` (P2).
- **Output.**
  - `docs/e2e/scenario_catalogue.md`: the final catalogue, grouped by actor and feature.
  - `docs/e2e/coverage_matrix.md`: the feature × scenario × automation-status table.
  - `docs/e2e/seed_gap_report.md`: the consolidated persona matrix.
    - Existing personas mapped to the scenarios that use them.
    - Proposed new personas or extensions, each with the exact state to seed and the scenarios it unblocks.
    - Personas that mutating scenarios must own exclusively, for parallel runs.
    - Cost of the seeding work, so seeding can be done before the Playwright tests are built.

### 3.1 Isolation, Cloning and Cleanup Design (Phase 6 builds this)

The Playwright suite runs in parallel against **one shared Firebase emulator and one app instance**. The emulator is not reset between tests. It is only discarded when a fresh one is started for the run, and a locally running emulator keeps its data across runs. Isolation therefore comes from per-test data, not from per-test infrastructure. Per-test containers were considered and rejected: the emulator takes 10-30 s to start and uses a few hundred MB each, and Docker is not installed. If one emulator becomes a bottleneck, shard CI with one emulator per shard.

**Clone per test**
- A Playwright fixture calls `clonePersona(sourceId, testId)` and gets a fresh user with a copy of the persona's data.
- `testId` is the scenario ID plus the retry number, so retries never collide.
- The clone is built from the seed definitions (`infrastructure/seeds/*.json` and the inline class and member seeds in `seeder.js`), not by copying live Firestore data. Each persona has a **manifest**: the documents that belong to it. Shared data, such as area communities and other studios, is not cloned.
- IDs and references are rewritten with a suffix: `user_david_kim` becomes `user_david_kim__<testId>`, and fields like `ownerId`, `studioId`, `companyId`, `userId` and `joinedCommunities` follow.
- The Auth user is `<testId>@inspired.test`, created with the Admin SDK in the emulator. It uses the shared `TEST_USER_PASSWORD` from `.env`, so the dev password login works. Passwords are never committed.
- The fixture returns the new email and IDs.

**`_testClone` marker**
- Every document the tool writes gets `_testClone: { runId, testId }`.
- Before relying on it, check that the PWA types and mappers, the security rules (`hasOnly`, `affectedKeys`) and the Cloud Functions ignore unknown fields.
- It only covers documents the tool writes. It is a convenience, not the cleanup guarantee.

**Cleanup per test**
- Fixture teardown deletes everything the clone owns, and runs on failure too.
- Documents the app or Cloud Functions create during the test (bookings, passes, posts, classes) don't carry the marker, and we do not add test-only fields to production code. They are found by ownership: the manifest lists "owned by" queries (`class_bookings` and `user_passes` by `userId`, `studios` by `ownerId`, `posts` by author, `companies` and their currencies), and the clone's suffix in IDs.
- Subcollections go with the Admin SDK's `recursiveDelete`. The Auth user is deleted too.
- `KEEP_ON_FAIL=1` skips cleanup for failed tests so the data can be inspected in the emulator UI.

**Sweep (safety net)**
- Global setup and teardown delete anything left by older runs: documents with a `_testClone.runId` that is not the current run, documents whose IDs carry a clone suffix, and `@inspired.test` Auth users that are not base personas.
- This catches crashed runs and killed workers.

**Shared read-only personas**
- Login, profile viewing and "no results" searches use the seeded personas directly and don't clone.

**Playwright setup**
- `fullyParallel: true`, no `describe.serial`.
- `webServer` starts the emulators (`--import` of a baseline snapshot) and the Vite app pointed at the emulators.
- Global setup runs an idempotent baseline seed. Class dates are generated relative to "now".
- Cloud Function triggers can lag under load, so assertions that depend on them use `expect.poll`. Time-based rules use `page.clock`.
- Optionally, a `setup` project signs in the shared personas once and saves `storageState({ indexedDB: true })` (Firebase Auth keeps its session in IndexedDB).

### Phase 6: Build the cloning and cleanup tooling (before any Playwright tests)
Runs after the seed gap report, because the report decides which personas get manifests. Develop it test-first.
1. Persona manifest format and one manifest per persona.
2. `clonePersona` with ID and reference rewriting, `_testClone` marking and Auth user creation.
3. Ownership-based cleanup, the sweep, and `KEEP_ON_FAIL`.
4. Tests for the tooling (see §3.2).
5. A Playwright fixture wrapper, so a scenario only declares its source persona.

### 3.2 Pre-build findings (resolved 2026-10-25)
| Question | Finding / decision |
|---|---|
| Do rules, mappers and functions tolerate the `_testClone` field? | Yes. [firestore.rules](file:///home/marcellkresz/developer/inspired/infrastructure/backend/firestore.rules) has no `hasOnly`, `affectedKeys` or key-set checks (only specific field checks). The PWA reads documents with `docSnap.data() as Type`, which ignores extra fields. Cloud Functions (`validateDisplayName`, `search`, `onSendStagingInvitation`) don't read the cloned collections' shapes. Tooling tests will still assert this against the rules emulator (§3.3). |
| Inline seeds | Moved out of `seeder.js` into `infrastructure/seeds/studio_classes.json` (date placeholder `{{today}}`) and `studio_members.json` (each entry names its `studioId`). Manifests can now read every persona's data from JSON. |
| Emulator ports | One source of truth: `firebase.json`, read by [lib/emulator.js](file:///home/marcellkresz/developer/inspired/infrastructure/scripts/lib/emulator.js). The seeder and `test-rules.js` use it. The PWA reads `VITE_EMULATOR_HOST`, `VITE_AUTH_EMULATOR_PORT` and `VITE_FIRESTORE_EMULATOR_PORT` and defaults to the same ports. |
| Staging use | Emulator only. `assertEmulatorOnly()` throws unless both Firestore and Auth hosts are local. Clone, cleanup and sweep call it first. |
| Index cost | Cleanup uses single-field equality queries, which Firestore indexes automatically. No composite index is needed, and the tooling never runs on staging anyway. |
| Login for a cloned Auth user | The dev password login (`import.meta.env.DEV` only) calls `signInWithEmailAndPassword`. A cloned user needs a matching `users/{uid}` document, otherwise the app routes to onboarding (`ProfileNotFoundError`). The cloner always writes the profile document. |
| Seeder is destructive | `seeder.js` clears the Auth emulator and the seeded collections. It must only run in global setup, before any test starts. It must never run during the parallel phase. |
| Auth user shape | The seeder uses `uid = user.id` and `email = <user.id>@inspired.test`. Clones follow the same pattern: `uid = <user.id>__<testId>`, `email = <testId>@inspired.test`. |
| Usernames | Clone usernames get the suffix too, so they stay unique. |

### 3.3 What the tooling tests must prove
- Cloning twice for different test IDs produces two fully independent graphs with no shared IDs.
- All references in the clone point at the clone, not the source (no leaks back to the source persona).
- Running a clone and the app flow, then cleaning up, leaves zero documents with the suffix, including app-created bookings, passes and posts, subcollections and the Auth user.
- Cleaning up one clone does not touch another clone or the base personas.
- The sweep removes leftovers from a simulated crashed run.
- 10+ clones created and cleaned up concurrently don't interfere (parallel safety).
- The unknown-field check passes: security rules, mappers and Cloud Functions accept documents with `_testClone`.

### Phase 5: Review gate (user)
You review the catalogue, the cut list and the open questions. Only after your approval do we plan the Playwright implementation, which is out of scope here.

## 4. Deliverables

```
docs/e2e/
  00_baseline_inventory.md
  drafts/
    feature_analyst.md
    sdet.md
    product_owner.md
    _normalised.md
    _merged.md
  open_questions.md
  scenario_catalogue.md      # final, manual-executable
  coverage_matrix.md         # feature × scenario × status
  seed_gap_report.md         # personas to reuse, extend or add
```

## 5. Sub-agent Briefs (to be sent only after approval)
**Shared inputs for all of them:**
- This plan, §2 (rules and template).
- `docs/e2e/00_baseline_inventory.md`.
- Read-only access to the repo. They write only their own output file.

| Role | Extra instruction |
|---|---|
| Baseline Inventory (Phase 0) | Don't invent scenarios. Document facts and link to files and line ranges. |
| Feature Analyst | Every normative statement in `FEATURES.md` maps to at least one scenario, or to an explicit "not UI-testable" note. |
| SDET | Include state/boundary variants, role and permission checks, and mobile-vs-desktop. Record data and reset needs per scenario. |
| Product Owner | Think in goals and journeys, and propose the P0 set from a business view. Don't look at implementation details. |
| Normaliser / Merger | Preserve provenance. Never silently delete or resolve conflicts. |
| Prioritiser | Apply the scoring rubric literally. Justify each P0 in one line. |

## 6. Acceptance Criteria for the Catalogue
- [ ] Every implemented feature in the baseline inventory has at least one scenario, or an explicit exclusion.
- [ ] Every scenario has a unique ID, a Given/When/And/Then, a type, a priority and an automation status.
- [ ] Every failure scenario is reachable from the UI.
- [ ] A person who doesn't know the codebase can execute any scenario manually (persona, studio, and data are named).
- [ ] Every scenario lists prerequisites and a suggested test user (existing, or `NEW` with the state to seed).
- [ ] The seed gap report exists, so seeding can be done before the tests are written.
- [ ] No credentials or PII in any file.
- [ ] A coverage matrix exists, and the cut list explains every removal.
- [ ] Open questions are logged and not guessed.

## 7. Risks and Mitigations
- **Spec drift.** `FEATURES.md` contains TBD sections and some duplicate numbering (§5.8 appears under §6). Phase 0 marks built and unbuilt features, and the agents only cover what's built.
- **Seed data gaps.** Many scenarios need specific states (e.g. 0 credits, a full class). Phase 0 and the SDET list the gaps, and seed additions are tracked as follow-up work.
- **Anchoring bias.** Agents must not see each other's drafts before Phase 3.
- **Over-generation.** The Phase 4 scoring and cut list control volume.
- **Existing Puppeteer suite.** Treat it as coverage evidence only. Migration to Playwright is a separate step after the catalogue is approved.
