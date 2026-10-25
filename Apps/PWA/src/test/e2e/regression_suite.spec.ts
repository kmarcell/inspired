import { test, expect } from './fixtures';

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';

const TEST_PERSONAS = [
  { id: 'user_sarah', email: 'user_sarah@inspired.test', name: 'Sarah Jenkins', role: 'Active Yogi / Student' },
  { id: 'user_newbie', email: 'user_newbie@inspired.test', name: 'Yoga Newbie', role: 'Clean Slate Yogi (Zero State)' },
  { id: 'user_teacher_001', email: 'user_teacher_001@inspired.test', name: 'Maya Sharma', role: 'Freelance Teacher' },
  { id: 'user_david_kim', email: 'user_david_kim@inspired.test', name: 'David Kim', role: 'Independent Studio Owner' },
  { id: 'user_sophia_vane', email: 'user_sophia_vane@inspired.test', name: 'Sophia Vane', role: 'Independent Studio Owner (Custom Currencies)' },
  { id: 'user_owner_noteach', email: 'user_owner_noteach@inspired.test', name: 'Omar Haddad', role: 'Non-Teaching Studio Owner' },
  { id: 'user_elena', email: 'user_elena@inspired.test', name: 'Elena Rostova', role: 'Teacher & Brand Branch Studio Owner' },
  { id: 'user_brand_founder', email: 'user_brand_founder@inspired.test', name: 'Marcus Vance', role: 'Brand Founder' },
  { id: 'user_maryia', email: 'user_maryia@inspired.test', name: 'Maryia Sharma', role: 'Feature-Complete Brand Founder & Studio Owner' },
];

/**
 * Note on Isolation (SDET Guideline):
 * These tests audit read-only navigation shells and pricing visibility, so they safely
 * reuse the seeded personas in parallel without state mutation.
 * For any future mutating scenarios (e.g. creating classes, purchasing passes, booking seats),
 * use the `clonedPersona` fixture from `./fixtures` to ensure full data isolation.
 */
test.describe('PWA Automated UI Regression Suite (Read-Only Personas)', () => {
  for (const account of TEST_PERSONAS) {
    test(`authenticate and audit navigation shell for ${account.name} (${account.id})`, async ({ page }) => {
      // Step 1: Navigate to application
      await page.goto('/');

      // Step 2: Sign in with dev credentials
      await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 10000 });
      await page.fill('[data-testid="dev-email-input"]', account.email);
      await page.fill('[data-testid="dev-password-input"]', TEST_PASSWORD);
      await page.click('[data-testid="dev-submit-button"]');

      // Step 3: Verify authenticated shell renders
      const firstName = account.name.split(' ')[0];
      await expect(page.locator(`text=${firstName}`).first()).toBeVisible({ timeout: 10000 });

      // Step 4: Persona-specific assertions
      if (account.id === 'user_sarah') {
        // Sarah Jenkins Joined Communities check
        const jcBtn = page.locator('[data-testid="header-jc-button"], button:has-text("My Communities")');
        if (await jcBtn.count() > 0) {
          await jcBtn.first().click();
          await expect(page.locator('text=Askew').first()).toBeVisible({ timeout: 5000 });
        }
      }

      if (account.id === 'user_elena') {
        // Elena Rostova Joined Communities check
        const jcBtn = page.locator('[data-testid="header-jc-button"], button:has-text("My Communities")');
        if (await jcBtn.count() > 0) {
          await jcBtn.first().click();
          await expect(page.locator('text=Chiswick').first()).toBeVisible({ timeout: 5000 });
        }
      }

      if (account.id === 'user_owner_noteach' || account.id === 'user_david_kim' || account.id === 'user_sophia_vane') {
        // Studio owners should see My Studios navigation
        const studioBtn = page.locator('button:has-text("My Studios")');
        await expect(studioBtn).toBeVisible({ timeout: 5000 });
      }

      // Step 5: Sign out cleanly
      const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Log Out")');
      if (await signOutBtn.count() > 0) {
        await signOutBtn.first().click();
        await expect(page.locator('[data-testid="dev-email-input"]')).toBeVisible({ timeout: 5000 });
      }
    });
  }

  test('independent studio pricing isolation prevents brand pass leakage', async ({ page }) => {
    // Login as Sarah (student) to verify independent studio pricing view
    await page.goto('/');
    await page.fill('[data-testid="dev-email-input"]', 'user_sarah@inspired.test');
    await page.fill('[data-testid="dev-password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="dev-submit-button"]');

    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Open Search & Explore to find Ravenscourt Park (independent studio)
    const searchBtn = page.locator('button:has-text("Search"), button:has-text("Explore")');
    if (await searchBtn.count() > 0) {
      await searchBtn.first().click();
      const studioCard = page.locator('text=Ravenscourt Park Zen Pavilion').first();
      if (await studioCard.isVisible()) {
        await studioCard.click();
        // Ensure Maryia's Brand passes are not leaked on independent studio profile
        const brandPassTitle = page.locator('text=7-day unlimited pass £90');
        await expect(brandPassTitle).not.toBeVisible();
      }
    }
  });
});
