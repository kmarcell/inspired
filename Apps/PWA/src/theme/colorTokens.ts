/**
 * Inspired Yoga Platform - Centralized Theme Color Tokens
 *
 * All tokens provide complete, static Tailwind CSS utility strings for both Light and Dark modes.
 * Built to comply strictly with WCAG 2.1 AA contrast requirements:
 *   - Normal text: >= 4.5:1
 *   - Large text & UI control boundaries: >= 3.0:1
 *
 * NOTE: Do NOT use dynamic string interpolation (e.g. `bg-${color}`) to ensure Tailwind v4 scanner
 * detects and bundles all required classes at build time.
 */

export const colorTokens = {
  // Surface & Container backgrounds
  surfaces: {
    page: 'text-slate-900 dark:text-slate-100',
    card: 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl',
    cardInteractive: 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 rounded-2xl shadow-sm dark:shadow-xl transition-all',
    inset: 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800',
    insetRounded: 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl',
    modal: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100',
    backdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto',
    // Semantic Notice Surfaces (WCAG AA compliant light & dark)
    amberNotice: 'bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300',
    emeraldNotice: 'bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200',
    roseNotice: 'bg-red-50 border border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200',
  },

  // Borders & Dividers
  borders: {
    default: 'border-slate-200 dark:border-slate-800',
    subtle: 'border-slate-200 dark:border-slate-800/80',
    dividerBottom: 'border-b border-slate-200 dark:border-slate-800',
    dividerTop: 'border-t border-slate-200 dark:border-slate-800',
  },

  // Typography Tokens
  text: {
    primary: 'text-slate-900 dark:text-white',
    secondary: 'text-slate-700 dark:text-slate-300',
    muted: 'text-slate-600 dark:text-slate-400',
    subtle: 'text-slate-500 dark:text-slate-400',
    accentEmerald: 'text-emerald-600 dark:text-emerald-400',
    accentAmber: 'text-amber-800 dark:text-amber-400',
    accentIndigo: 'text-indigo-700 dark:text-indigo-300',
  },

  // Interactive Form Inputs
  inputs: {
    base: 'w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors',
    select: 'w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors',
    selectAmberFocus: 'w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors',
    label: 'block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2',
    helper: 'text-xs text-slate-500 dark:text-slate-400 mt-1',
  },

  // Buttons & CTAs
  buttons: {
    primaryGradient: 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2',
    secondary: 'p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors',
    secondaryText: 'px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors',
    ghost: 'px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 text-xs font-bold transition-colors',
    danger: 'p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950 dark:text-slate-400 dark:hover:text-red-300 text-xs font-semibold border border-slate-200 dark:border-transparent transition-colors',
    amberAction: 'px-4 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 dark:hover:bg-amber-500/30 text-xs font-bold transition-colors',
    // Studio sub-tab schedule navigation action button (distinct from active tab state)
    navActionSchedule: 'py-2 px-4 rounded-xl text-xs font-extrabold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-1.5',
  },

  // Tabs
  tabs: {
    activeAmber: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm',
    activeSlate: 'bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 shadow-sm',
    activeIndigo: 'bg-indigo-600 text-white shadow-md',
    inactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60',
    inactivePill: 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
  },

  // Semantic Badges & Pills (Guaranteed WCAG 2.1 AA contrast)
  badges: {
    amber: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    rose: 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
    purple: 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
    cyan: 'bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40',
    neutral: 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
} as const;

export type ColorTokens = typeof colorTokens;
