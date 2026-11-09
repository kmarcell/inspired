# RULES.md - Agent Memory & Task Tracking Mandates

## 1. System Overview & Memory Taxonomy
`.agent-memory/` provides persistent working memory and active task tracking for AI agents across execution steps, turns, and CI sessions. Memory is partitioned into four distinct, normalized files:

| File | Memory Type | Purpose & Scope | Lifecycle |
| :--- | :--- | :--- | :--- |
| **`RULES.md`** | **Procedural Memory** | Operational rules, formatting standards, and cognitive mandates. | Permanent / Committed to Git |
| **`TODO.md`** | **Working Memory** | Checkbox-style active task execution, sub-tasks, test gates, and DoD checklist. | Ephemeral per feature branch |
| **`DECISIONS.md`** | **Decisional Memory (ADRs)** | Concise Architectural Decision Records capturing choices made against alternatives. | Curated / Branch cache & main |
| **`LEARNINGS.md`** | **Knowledge Memory** | Short, high-signal system quirks, framework gotchas, and proven workarounds. | Curated / Branch cache & main |

---

## 2. Working Task Memory Rules (`TODO.md`)

### 2.1 Task Checklist Formatting Standards
- **Markdown Checkboxes**: Every task item must use an explicit checkbox (`- [ ]` for pending, `- [x]` for completed).
- **Unique Tag Identifiers**: Every major task item must carry a unique comment tag identifier (`<!-- id: task-slug -->`) for reliable parsing and cross-referencing.
- **Strict Scope**: `TODO.md` is strictly an actionable checklist. Detailed architectural rationale belongs in `DECISIONS.md`; system quirks belong in `LEARNINGS.md`.

### 2.2 Planning Mandate & Execution Modes
- **Interactive Mode**: Clarify proposed plan -> Obtain explicit verbal approval -> Track in `.agent-memory/` with date/timestamp before modifying code.
- **Autonomous Mode (`--yolo` or `--dangerously-skip-permissions`, e.g. CI agent)**: Proceed autonomously while documenting the implementation plan, evaluated trade-offs, and decisions made against alternatives in `.agent-memory/DECISIONS.md`. Every plan must specify the target files, implementation strategy, validation steps, and acceptance criteria.

### 2.3 Idea & Requirement Tracking Mandate
- Whenever an idea, feature expansion, or new requirement is introduced (triggers: "remember", "take note", "add a task"), immediately codify it as a To-Do item in `TODO.md` and update `@ROADMAP.md`.
- Never leave actionable ideas or requirements solely in conversation history or ephemeral terminal output.

### 2.4 State Maintenance During Execution
- **Context Hydration**: At the beginning of each session or CI run, read `.agent-memory/` files to restore prior execution state and context.
- **In-Flight Progress**: Check off completed items (`- [x]`) progressively as they are verified.
- **Final Update**: Before completing a turn or submitting a PR, update `TODO.md` to reflect the final task state and test verification results.

### 2.5 Definition of Done (DoD) Checklist
Before concluding work on any task or PR, ensure:
- [ ] Active items in `TODO.md` accurately reflect completion (`- [x]`).
- [ ] Implementation aligns 1:1 with `UI/Mockups/` and `@FEATURES.md`.
- [ ] All Unit, Snapshot, and UI tests pass.
- [ ] Security & architecture impacts evaluated; Firestore rules verified.
- [ ] `@ROADMAP.md` updated for relevant milestones.
- [ ] Explicit verbal user confirmation received before committing.

---

## 3. Decisional Memory Rules (`DECISIONS.md`)

- **When to Log**: Log an entry for any non-trivial architectural choice, schema modification, library selection, or when executing in autonomous mode where alternative designs were evaluated.
- **Standard Schema**:
  - `Context`: 1-2 sentence problem statement and constraints.
  - `Alternatives Considered`: Bulleted list of options with clear pros/cons and why alternatives were discarded.
  - `Chosen Decision & Rationale`: Explicit justification for the selected path.
  - `Impacted Files`: Markdown file links to modified components or services.
  - `Status & Timestamp`: `[Proposed | Accepted | Superseded]` with ISO 8601 timestamp.
- **Conciseness**: Keep entries focused and readable. Avoid unnecessary prose.

---

## 4. Knowledge Memory & Gotchas Rules (`LEARNINGS.md`)

- **Brevity Mandate (Short Learnings)**: Entries must be brief, atomic, and high-signal (single-sentence bullet points for Gotcha, Root Cause, and Solution). Never dump raw terminal outputs, verbose stack traces, or lengthy essays.
- **Deduplication Mandate**: Before logging a new learning, search `LEARNINGS.md` to ensure the topic is not already covered. Refine or augment existing entries rather than creating redundant ones.
- **High-Signal Filter**: Record only reusable, non-obvious engineering knowledge (e.g. Firebase emulator quirks, Firestore security rules edge cases, bundler subtleties, CI environment constraints). Do not record routine syntax errors, transient network hiccups, or trivial typos.
- **Pruning & Compaction**: When underlying system bugs are permanently resolved in code or tooling, prune or mark the corresponding learning as superseded to prevent unbounded file growth.

---

## 5. Security, Privacy & Git Hygiene

- **Zero Secrets / PII**: Never write API keys, tokens, passwords, emulator credentials (`TEST_USER_PASSWORD`), private keys, or personal identifiable information into any file in `.agent-memory/`.
- **Git Hygiene**:
  - Only the clean templates for `.agent-memory/TODO.md`, `.agent-memory/DECISIONS.md`, `.agent-memory/LEARNINGS.md`, and `.agent-memory/RULES.md` are committed to the repository's `main` branch.
  - Runtime execution memory is transient and maintained via GitHub Actions cache across PR builds, or local-only ignore settings (`~/.gitignore` and `git update-index --skip-worktree`).
