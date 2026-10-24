# Design System & Theme Color Tokens Specification

**Status:** Active / Production  
**Scope:** Universal Web PWA (`Apps/PWA`)  
**Source of Truth:** [`Apps/PWA/src/theme/colorTokens.ts`](file:///home/marcellkresz/developer/inspired/Apps/PWA/src/theme/colorTokens.ts)  
**Test Suite:** [`Apps/PWA/src/theme/__tests__/colorTokens.test.ts`](file:///home/marcellkresz/developer/inspired/Apps/PWA/src/theme/__tests__/colorTokens.test.ts)

---

## 1. Overview & Architectural Principles

The Inspired Yoga Platform features a dual-theme system (Light and Dark Mode) engineered to provide:
1. **Strict WCAG 2.1 AA Contrast Compliance**:
   - Standard body and label typography: Contrast ratio $\ge 4.5:1$ against surface backgrounds.
   - Large headings, badges, and interactive control boundaries: Contrast ratio $\ge 3.0:1$.
2. **Tailwind CSS v4 Scanner Preservation**:
   - In Tailwind CSS v4, dynamic class construction (e.g. ``bg-${color}-500``) breaks static build-time template scanning.
   - Every theme token in `colorTokens.ts` is defined as a **complete, static string literal** (e.g. `'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800'`).
3. **Decoupled Presentation Layer**:
   - UI views consume semantic tokens (`colorTokens.surfaces.card`, `colorTokens.badges.amber`) rather than ad-hoc inline Tailwind strings.
   - Updates to brand colors or accessibility tweaks propagate repository-wide from a single catalog.

---

## 2. Token Group Taxonomy

All tokens are organized in `Apps/PWA/src/theme/colorTokens.ts` under strongly-typed namespaces:

```typescript
import { colorTokens } from '../theme/colorTokens';
```

### 2.1 Surfaces & Containers (`colorTokens.surfaces`)
| Token | Light Surface | Dark Surface | Usage / Context |
| :--- | :--- | :--- | :--- |
| `page` | `text-slate-900` | `dark:text-slate-100` | Top-level view wrapper |
| `card` | `bg-white border-slate-200` | `dark:bg-slate-900/80 dark:border-slate-800` | Content cards, form sections |
| `cardInteractive` | `bg-white border-slate-200` | `dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/40` | Clickable template/draft cards |
| `inset` | `bg-slate-50 border-slate-200` | `dark:bg-slate-950 dark:border-slate-800` | Secondary inner panels & metadata pills |
| `modal` | `bg-white border-slate-200` | `dark:bg-slate-900 dark:border-slate-800` | Popup overlays and dialogs |
| `backdrop` | `bg-slate-950/70 backdrop-blur-sm` | `bg-slate-950/70 backdrop-blur-sm` | Modal overlay backdrop |
| `amberNotice` | `bg-amber-50 text-amber-900 border-amber-200` | `dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20` | Teacher-Agnostic Blueprint & info alerts |
| `emeraldNotice` | `bg-emerald-50 text-emerald-900 border-emerald-300` | `dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800` | Success banners and confirmations |
| `roseNotice` | `bg-red-50 text-red-900 border-red-300` | `dark:bg-red-950/60 dark:text-red-200 dark:border-red-800` | Form validation and error alerts |

### 2.2 Typography (`colorTokens.text`)
| Token | Light Mode Utility | Dark Mode Utility | WCAG 2.1 AA Contrast Ratio |
| :--- | :--- | :--- | :--- |
| `primary` | `text-slate-900` | `dark:text-white` | $\ge 15.0:1$ (Light: #0f172a on #ffffff) |
| `secondary` | `text-slate-700` | `dark:text-slate-300` | $\ge 9.0:1$ (Light: #334155 on #ffffff) |
| `muted` | `text-slate-600` | `dark:text-slate-400` | $\ge 7.0:1$ (Light: #475569 on #ffffff) |
| `subtle` | `text-slate-500` | `dark:text-slate-400` | $\ge 4.6:1$ (Light: #64748b on #ffffff) |
| `accentEmerald` | `text-emerald-600` | `dark:text-emerald-400` | Section headings, active teacher labels |
| `accentAmber` | `text-amber-800` | `dark:text-amber-400` | Blueprint summaries, temperature labels |

> [!IMPORTANT]
> **WCAG AA Light Mode Rule**: Never use `text-slate-400` as standalone body or muted text on white surfaces (`#ffffff`). `text-slate-400` fails WCAG AA at ~2.4:1 contrast. Use `colorTokens.text.muted` (`text-slate-600 dark:text-slate-400`) or `colorTokens.text.subtle` (`text-slate-500 dark:text-slate-400`).

### 2.3 Interactive Controls & Form Inputs (`colorTokens.inputs`)
| Token | Description |
| :--- | :--- |
| `inputs.base` | Form text, number, and date inputs (`bg-slate-50 border-slate-300 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-white focus:border-emerald-500`) |
| `inputs.select` | Dropdown select menus with consistent padding and theme borders |
| `inputs.selectAmberFocus` | Dropdowns within template wizards using amber focus highlight |
| `inputs.label` | Accessible field label (`block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2`) |
| `inputs.helper` | Field helper text with accessible contrast (`text-xs text-slate-500 dark:text-slate-400 mt-1`) |

### 2.4 Buttons & Navigation Actions (`colorTokens.buttons`)
| Token | Styling & Utility Pairings |
| :--- | :--- |
| `primaryGradient` | `bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-950/20` |
| `secondary` | `bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700` |
| `secondaryText` | Pill/button variant for secondary form actions |
| `danger` | Destructive action button with hover red accents |
| `amberAction` | Blueprint creation CTA |
| `navActionSchedule` | **Studio Schedule Sub-tab Navigation Action**: Differentiates schedule actions from the active indigo tab in `MyStudiosView.tsx` |

### 2.5 Semantic Badges & Pills (`colorTokens.badges`)
All badges use balanced background tints with high-contrast text and explicit borders:
| Badge | Light Theme | Dark Theme | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `amber` | `bg-amber-100 text-amber-900 border-amber-300` | `dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40` | Brand Class Templates & Blueprints |
| `emerald` | `bg-emerald-100 text-emerald-900 border-emerald-300` | `dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40` | Published live classes, active passes |
| `rose` | `bg-rose-100 text-rose-900 border-rose-300` | `dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40` | Hot yoga, ineligible passes, delete alerts |
| `purple` | `bg-purple-100 text-purple-900 border-purple-300` | `dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40` | Studio overrides & custom pricing policies |
| `cyan` | `bg-cyan-100 text-cyan-900 border-cyan-300` | `dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40` | Outlook recurrence engine schedules |
| `neutral` | `bg-slate-100 text-slate-800 border-slate-300` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` | Draft schedules, neutral metadata pills |

---

## 3. Developer Guide: How to Author Components

When creating or modifying components:
1. **Import `colorTokens`**:
   ```typescript
   import { colorTokens } from '../theme/colorTokens';
   ```
2. **Apply tokens to elements**:
   ```tsx
   <div className={colorTokens.surfaces.card}>
     <h2 className={colorTokens.text.primary}>Title</h2>
     <p className={colorTokens.text.muted}>Description</p>
     <span className={colorTokens.badges.amber}>Template</span>
   </div>
   ```
3. **Never write string interpolations**:
   ```typescript
   // ❌ FORBIDDEN (Tailwind v4 purge risk):
   const style = `bg-${color}-500`;

   // ✅ REQUIRED (Complete static literal):
   const style = colorTokens.badges.amber;
   ```

---

## 4. Verification & Testing

Every token is verified via automated tests:
```bash
pnpm --filter inspired-pwa exec vitest run src/theme/__tests__/colorTokens.test.ts
```
The test suite enforces:
- All required token groups are exported and defined.
- Every semantic badge contains both Light mode classes and `dark:` overrides.
- All surface and input tokens maintain paired Dark mode variants.
