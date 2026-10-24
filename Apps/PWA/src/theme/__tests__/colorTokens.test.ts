import { describe, it, expect } from 'vitest';
import { colorTokens } from '../colorTokens';

describe('Design System colorTokens', () => {
  it('exports all standard token groups', () => {
    expect(colorTokens.surfaces).toBeDefined();
    expect(colorTokens.borders).toBeDefined();
    expect(colorTokens.text).toBeDefined();
    expect(colorTokens.inputs).toBeDefined();
    expect(colorTokens.buttons).toBeDefined();
    expect(colorTokens.tabs).toBeDefined();
    expect(colorTokens.badges).toBeDefined();
  });

  it('guarantees that semantic badge tokens define both light and dark mode classes', () => {
    Object.values(colorTokens.badges).forEach((tokenValue) => {
      expect(typeof tokenValue).toBe('string');
      expect(tokenValue.length).toBeGreaterThan(0);
      expect(tokenValue).toContain('dark:');
    });
  });

  it('guarantees that surfaces include dark mode variants', () => {
    expect(colorTokens.surfaces.card).toContain('dark:');
    expect(colorTokens.surfaces.cardInteractive).toContain('dark:');
    expect(colorTokens.surfaces.modal).toContain('dark:');
    expect(colorTokens.surfaces.amberNotice).toContain('dark:');
    expect(colorTokens.surfaces.emeraldNotice).toContain('dark:');
    expect(colorTokens.surfaces.roseNotice).toContain('dark:');
  });

  it('guarantees that text tokens provide dark mode variants', () => {
    expect(colorTokens.text.primary).toContain('dark:');
    expect(colorTokens.text.secondary).toContain('dark:');
    expect(colorTokens.text.muted).toContain('dark:');
    expect(colorTokens.text.subtle).toContain('dark:');
    expect(colorTokens.text.accentEmerald).toContain('dark:');
  });

  it('ensures input tokens have dark background and border variants', () => {
    expect(colorTokens.inputs.base).toContain('dark:bg-slate-950');
    expect(colorTokens.inputs.base).toContain('dark:border-slate-800');
    expect(colorTokens.inputs.select).toContain('dark:bg-slate-950');
  });

  it('ensures schedule navigation action button provides distinct high contrast styling', () => {
    expect(colorTokens.buttons.navActionSchedule).toBeDefined();
    expect(colorTokens.buttons.navActionSchedule).toContain('dark:bg-slate-800');
    expect(colorTokens.buttons.navActionSchedule).toContain('dark:text-slate-200');
  });
});
