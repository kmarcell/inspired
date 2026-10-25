# E2E Testing Guide & Scenario Lifecycle Manual

**Document Reference:** `docs/e2e_testing_guide.md`  
**Primary Test Framework:** Playwright (`@playwright/test`)  
**Target Application:** Vite Universal PWA (`Apps/PWA`)  
**Target Backend:** Firebase Local Emulator Suite (Firestore: 8081, Auth: 9099)

---

## 1. Overview & Directory Index

This guide is the single source of truth for end-to-end (E2E) browser regression testing across the Inspired Yoga Platform. It catalogs all documentation, explains the scenario discovery and lifecycle architecture, outlines test isolation mechanisms, and provides step-by-step instructions for authoring, maintaining, and synchronizing tests.

### 1.1 Documentation Directory Map

| Document Path | Purpose | When to Read / Update |
| :--- | :--- | :--- |
| **[`docs/e2e/scenario_catalogue.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/scenario_catalogue.md)** | **Canonical Test Catalogue.** The definitive list of all 111 active E2E scenarios organized by Actor (`yogi`, `teacher`, `studio-owner`) and Suite Tier (`smoke`, `regression`, `extended`). Serves both as an automated test spec backlog and as a manual runbook with exact Given/When/Then steps. | Read when implementing or debugging Playwright specs; update when screen steps or assertions change. |
| **[`docs/e2e/coverage_matrix.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/coverage_matrix.md)** | **Feature × Scenario Matrix.** Maps every specification section in `FEATURES.md` (§5.1–§5.20) to its scenario IDs, priorities, suite tiers, and automation statuses. Contains the formal list of excluded TBD features. | Update whenever new features are built or test automation status advances. |
| **[`docs/e2e/seed_gap_report.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/seed_gap_report.md)** | **Persona Mapping & Seed Needs.** Maps each scenario to its required test persona, details parallel concurrency rules (`shared` vs `clone`), and specifies required seed data extensions. | Consult before authoring tests to verify seed requirements. |
| **[`docs/e2e/open_questions.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/open_questions.md)** | **Technical Boundaries & Gaps.** Documents architecture constraints (e.g. Magic link email testing limits, pre-seeded teacher assignments) and tracked production gaps. | Consult when encountering ambiguous requirements or skipped scenarios. |
| **[`docs/e2e/00_baseline_inventory.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/00_baseline_inventory.md)** | **Discovery Baseline.** The initial audit of all 21 PWA features, 25 Vitest suites, and 9 seeded personas that formed the foundation for scenario discovery. | Reference archive for feature baseline history. |
| **[`docs/test_users.md`](file:///home/marcellkresz/developer/inspired/docs/test_users.md)** | **Seeded Personas Reference.** Complete profile of all 9 seeded user accounts, roles, credentials policy, and owned entities. | Reference when selecting a persona for a new test. |

> [!NOTE]
> The `docs/e2e/drafts/` directory contains temporary intermediate raw working files generated during the multi-agent discovery phases (Phases 1–3). They are preserved for discovery audit history but are **excluded** from the active documentation and maintenance workflow. The permanent source of truth for tests is `scenario_catalogue.md`.

---

## 2. Test Architecture & Environment Isolation

### 2.1 The Parallel Shared-Emulator Model
All Playwright tests execute concurrently against **one shared Firebase Emulator instance** and one Vite development server. The emulator is never reset between tests during a test run. To guarantee 100% test independence and eliminate cross-test data pollution, scenarios adhere to strict isolation rules:

#### A. Read-Only Scenarios (`isolation: 'shared'`)
- Used for read-only audits (e.g. navigation shell verification, pricing display, viewing schedules, inspecting member lists).
- Execute directly against base seeded personas (`user_sarah`, `user_david_kim`, `user_sophia_vane`, etc.) concurrently.
- **Rule:** Must never perform state mutations (writes, bookings, deletions).
- **Rule:** Must look up elements by unique identifiers or titles, never asserting strict array lengths on shared global collections.

#### B. State-Mutating Scenarios (`isolation: 'clone'`)
- Used whenever a test creates, updates, or deletes data (e.g. booking a class, purchasing passes, publishing recurring timetable series, updating profiles, unjoining communities).
- **Mandate:** Must use the `clonedPersona(personaId)` Playwright fixture from `Apps/PWA/src/test/e2e/fixtures.ts`.
- **How Cloner Works (`clonePersona.js`):**
  1. Deep-copies the source persona and all owned entities (studios, communities, currencies, templates, passes).
  2. Rewrites document IDs with a unique test suffix: `__<testId>`.
  3. Updates internal cross-document foreign keys (`ownerId`, `studioId`, `companyId`, `acceptedCurrencyIds`).
  4. Stamps every document with a tracking marker: `_testClone: { runId, testId, createdAt }`.
  5. Creates a dedicated temporary user in Firebase Auth: `<testId>@inspired.test` with password `TEST_USER_PASSWORD`.
  6. On test completion (pass OR fail), the fixture automatically performs a recursive Firestore wipe of all cloned documents and deletes the temporary Auth account.

---

## 3. Suite Tiers & Execution Commands

Playwright tests are configured with `reporter: 'line'` to minimize token flooding and optimize CI runtimes.

| Suite Tier | Description | Target Scenarios | Execution Command |
| :--- | :--- | :--- | :--- |
| **`smoke`** | Core blocking journeys, Dev authentication, class booking, session restore. Run on every Pull Request. | 40 scenarios (P0) | `pnpm --filter inspired-pwa run test:e2e -- --grep "@smoke"` |
| **`regression`** | Complete feature regression suite covering all standard paths, boundary cases, and policy isolation. Run on merge to `main` and pre-release. | 100 scenarios (P0 + P1) | `pnpm --filter inspired-pwa run test:e2e` |
| **`extended`** | Deep edge resilience, theme persistence, and extreme boundaries. Run nightly. | 11 scenarios (P2) | `pnpm --filter inspired-pwa run test:e2e -- --grep "@extended"` |

### Quick Development Commands
```bash
# Run entire E2E test suite
pnpm --filter inspired-pwa run test:e2e

# Run a specific test file
npx playwright test src/test/e2e/regression_suite.spec.ts

# Run in UI debug mode
npx playwright test --ui

# Verify seed integrity before testing
pnpm test:seeds

# Verify cloner tooling unit tests
pnpm test:cloner
```

---

## 4. Scenario Lifecycle: How to Add & Maintain Tests

### 4.1 How to Add a New E2E Scenario
Whenever a new feature or user journey is introduced:

1. **Verify Prerequisites:**
   - Ensure the feature is specified in `@FEATURES.md` and NOT marked TBD.
   - Confirm the feature has passing Vitest component unit tests.

2. **Name the Scenario:**
   - Format: `actor-action-outcome` in lowercase kebab-case.
   - Example: `yogi-cancel-booking-refund-credit`

3. **Follow the Standard Scenario Template:**
   Add the scenario to [`docs/e2e/scenario_catalogue.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/scenario_catalogue.md):
   ```markdown
   #### <actor-action-outcome> — <Human Readable Title>
   - **ID:** <actor-action-outcome>
   - **Actor:** yogi | teacher | studio-owner
   - **Suite Tier:** [SMOKE] | [REGRESSION] | [EXTENDED] | **Priority:** P0 | P1 | P2
   - **Scoring:** Impact: X/3 | Likelihood: Y/3 | Gap: Z/2 | Cost: S/M/L
   - **Feature ref:** FEATURES.md §5.X
   - **Type:** happy | valid-failure | edge
   - **Prerequisites:** <required seeded facts>
   - **Suggested test user:** <seeded persona or extension>
   - **Seed gap:** none | <required seed attribute>
   - **Preconditions (Given):** <initial state>
   - **Steps:**
     - Given ...
     - When ...
     - And ...
     - Then ... (observable UI element or copy)
   - **Isolation:** `shared` | `clone`
   - **Data / reset notes:** <what is created/cleaned up>
   - **Platforms:** both | desktop | mobile
   - **Automation status:** e2e (<test file>) | none
   ```

4. **Update the Coverage Matrix:**
   - Add the scenario row to [`docs/e2e/coverage_matrix.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/coverage_matrix.md).

5. **Author the Playwright Test:**
   - For read-only scenarios, write standard tests using seeded credentials.
   - For mutating scenarios, use the `clonedPersona` fixture:
     ```typescript
     test('yogi can book class and deduct credit', async ({ page, clonedPersona }) => {
       const user = await clonedPersona('user_sarah');
       await page.goto('/');
       await page.fill('[data-testid="dev-email-input"]', user.email);
       await page.fill('[data-testid="dev-password-input"]', user.password);
       await page.click('[data-testid="dev-submit-button"]');
       // ... test steps ...
     });
     ```

### 4.2 How to Maintain & Update Existing Scenarios
- **When UI Copy or Selectors Change:**
  - Update the Playwright spec and the "Then" assertion step in [`docs/e2e/scenario_catalogue.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/scenario_catalogue.md) simultaneously to keep the manual runbook accurate.
- **When a Production Gap is Discovered:**
  - Add an entry in [`docs/e2e/open_questions.md`](file:///home/marcellkresz/developer/inspired/docs/e2e/open_questions.md).
  - Update `TODO.md` and `@ROADMAP.md`.
  - Mark the scenario in `scenario_catalogue.md` as `Automation status: skipped (known production gap: ...)` so test runs do not produce false alarm failures.
- **When a Skipped Gap is Fixed:**
  - Remove the skip marker, enable the test in the Playwright suite, and update `coverage_matrix.md`.

---

## 5. Assertion & Test Hygiene Rules

1. **Zero Mock Fallbacks in Production Code:**
   - Production services (`firestoreService.ts`) must never contain hardcoded fallbacks or mock arrays. Test data belongs exclusively in Firestore emulators and `infrastructure/seeds/`.
2. **Never Assert Absolute Counts on Global Collections:**
   - Because parallel tests share the Firestore emulator, never assert `expect(results).toHaveLength(N)` on search results, community lists, or feeds.
   - Assert on the specific entity's presence by ID or unique name (e.g. `expect(page.locator(`text=${uniqueClassTitle}`)).toBeVisible()`).
3. **No Hardcoded Passwords in Git:**
   - Always load passwords from `process.env.TEST_USER_PASSWORD` with a local test fallback.
4. **Clean Teardown Guarantees:**
   - Cloned personas must always clean up via `try...finally` or Playwright fixture teardown hooks. If a test fails and `KEEP_ON_FAIL=1` is set, documents are preserved for local inspection.
