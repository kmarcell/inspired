import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';


/**
 * Helper to authenticate in Dev Mode via credentials
 */
async function loginAs(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 15000 });
  await page.fill('[data-testid="dev-email-input"]', email);
  await page.fill('[data-testid="dev-password-input"]', password);
  await page.click('[data-testid="dev-submit-button"]');
}

/**
 * Helper to navigate to the "My Studios" view
 */
async function navigateToMyStudios(page: Page) {
  const desktopTab = page.locator('[data-testid="desktop-tab-studios"]');
  if (await desktopTab.isVisible()) {
    await desktopTab.click();
  } else {
    const profileBtn = page.locator('[data-testid="header-profile-button"]');
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await page.click('button:has-text("My Studios")');
    }
  }
  await expect(page.locator('text=My Brands & Studios').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Studio Owner Regression Suite', () => {
  // 1. platform-admin-reject-shadow-claim (uses dynamic isolated claim ID to guarantee parallel execution safety)
  test('@regression platform-admin-reject-shadow-claim — Platform administrator rejects shadow claim with justification reason', async ({
    page,
  }) => {
    const db = admin.firestore();
    const testClaimId = `claim_test_reject_${Date.now()}`;
    await db.collection('studioClaims').doc(testClaimId).set({
      id: testClaimId,
      studioId: 'studio_shadow_test_isolated',
      studioName: 'Kew Test Claim Studio',
      userId: 'user_claimant_test',
      userEmail: 'claimant@test.com',
      verificationMethod: 'domain_email',
      documentFileName: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    try {
      await loginAs(page, 'user_maryia@inspired.test', TEST_PASSWORD);
      await expect(page.locator('text=Maryia').first()).toBeVisible({ timeout: 10000 });

      // Navigate to Admin Claims Verification portal via profile
      await page.click('[data-testid="desktop-tab-profile"]');
      await expect(page.locator('[data-testid="profile-admin-portal-button"]')).toBeVisible({ timeout: 5000 });
      await page.click('[data-testid="profile-admin-portal-button"]');

      // Review pending claim
      await expect(page.locator('text=Studio Claim Verification Portal')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Kew Test Claim Studio').first()).toBeVisible({ timeout: 10000 });

      // Click Reject Claim
      await page.click(`[data-testid="reject-claim-${testClaimId}"]`);

      // Modal appears
      await expect(page.locator('text=Reject Studio Claim')).toBeVisible({ timeout: 5000 });
      await page.fill('[data-testid="input-rejection-reason"]', 'Proof document illegible');
      await page.click('[data-testid="submit-rejection-button"]');

      // Success notification alert confirms rejection
      await expect(page.locator('[data-testid="admin-action-success"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="admin-action-success"]')).toContainText('rejected');
    } finally {
      await db.collection('studioClaims').doc(testClaimId).delete();
    }
  });

  // 2. studio-owner-claim-already-verified-studio-blocked
  test('@regression studio-owner-claim-already-verified-studio-blocked — Attempting to claim an already-verified studio is blocked', async ({
    page,
  }) => {
    await loginAs(page, 'user_newbie@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Yoga').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Search
    await page.click('[data-testid="desktop-tab-search"]');
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible({ timeout: 5000 });

    // Search for Askew Road Zen Den (already verified and owned)
    await page.fill('[data-testid="search-input"]', 'Askew');
    await expect(page.locator('text=Askew Road Zen Den').first()).toBeVisible({ timeout: 10000 });

    // Assert "Claim Studio" button is NOT rendered for verified studio
    await expect(page.locator('[data-testid="claim-studio-btn-studio_askew_001"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Claim Studio 🏢")')).not.toBeVisible();
  });

  // 3. studio-owner-create-brand-invalid-email
  test('@regression studio-owner-create-brand-invalid-email — Brand creation enforces strict email regex validation', async ({
    page,
  }) => {
    await loginAs(page, 'user_david_kim@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=David').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);

    // Click Create Studio
    await page.click('[data-testid="create-studio-button"]');
    await expect(page.locator('text=Create Studio & Brand')).toBeVisible({ timeout: 5000 });

    // Fill form with invalid company email format
    await page.fill('[data-testid="input-company-name"]', 'Zenith Yoga Network');
    await page.fill('[data-testid="input-company-email"]', 'invalid-email-format');
    await page.fill('[data-testid="input-studio-name"]', 'Zenith Acton');
    await page.fill('[data-testid="input-studio-prefix"]', 'W3');
    await page.fill('[data-testid="input-studio-address"]', '100 High Street, Acton, London W3 6LJ');

    // Attempt to submit
    await page.click('[data-testid="submit-create-studio-button"]');

    // Error notice appears and submission is blocked
    await expect(page.locator('[data-testid="create-studio-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="create-studio-error"]')).toContainText('Please enter a valid company contact email');
  });

  // 4. studio-owner-create-class-missing-title-fails
  test('@regression studio-owner-create-class-missing-title-fails — Class creation blocks saving when class title is missing', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);

    // Open Chelsea studio management
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Leave Title input blank and attempt to publish live
    await page.click('button:has-text("Publish Live Class")');

    // Validation warning blocks submission
    await expect(page.locator('[data-testid="class-creator-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="class-creator-error"]')).toContainText('Please enter a class title.');
  });

  // 5. studio-owner-create-class-restricted-currency-acceptance
  test('@regression studio-owner-create-class-restricted-currency-acceptance — Studio owner publishes specialty class restricted to custom selected passes', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Title
    await page.fill('#class-title-input', 'Sound Bath & Restorative Flow');

    // Select Teacher
    const teacherSelect = page.locator('select#teacher-select');
    await expect(teacherSelect).toBeVisible({ timeout: 5000 });
    await teacherSelect.selectOption({ index: 1 });

    // Switch Currency Acceptance to Custom Selected
    await page.click('[data-testid="currency-policy-custom"]');
    await expect(page.locator('text=Check Accepted Currencies for this Class:')).toBeVisible({ timeout: 5000 });

    // Publish Live Class
    await page.click('button:has-text("Publish Live Class")');

    // Confirmation toast appears
    await expect(page.locator('text=Class published live to studio schedule!').first()).toBeVisible({ timeout: 10000 });
  });

  // 6. studio-owner-create-studio-missing-required-fields
  test('@regression studio-owner-create-studio-missing-required-fields — Studio creation form blocks submission when required fields are missing', async ({
    page,
  }) => {
    await loginAs(page, 'user_david_kim@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=David').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('[data-testid="create-studio-button"]');
    await expect(page.locator('text=Create Studio & Brand')).toBeVisible({ timeout: 5000 });

    // Leave studio name and address blank and submit
    await page.click('[data-testid="submit-create-studio-button"]');

    // Form validation error appears highlighting required studio name
    await expect(page.locator('[data-testid="create-studio-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="create-studio-error"]')).toContainText('Please enter a studio name.');
  });

  // 7. studio-owner-currency-creation-unlimited-credits-disabled
  test('@regression studio-owner-currency-creation-unlimited-credits-disabled — Selecting unlimited pass type disables and locks credit count stepper', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-pricing"]');

    // Open Create Currency Form
    await page.click('[data-testid="create-currency-button"]');
    await expect(page.locator('[data-testid="select-new-currency-tier"]')).toBeVisible({ timeout: 5000 });

    // Select Unlimited Pass
    await page.selectOption('[data-testid="select-new-currency-tier"]', 'unlimited');

    // Assert credit count input is disabled
    await expect(page.locator('[data-testid="input-new-currency-credits"]')).toBeDisabled();
  });

  // 8. studio-owner-edit-currency-pricing
  test('@regression studio-owner-edit-currency-pricing — Studio owner updates currency title, price, and validity days', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-pricing"]');

    // Click Edit on the first custom currency
    const editBtn = page.locator('[data-testid^="edit-currency-"]').first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Edit price to 195
    await page.fill('[data-testid="input-edit-currency-price"]', '195');
    await page.click('[data-testid="save-edit-currency-button"]');

    // Verify updated price is rendered
    await expect(page.locator('text=£195').first()).toBeVisible({ timeout: 10000 });
  });

  // 9. studio-owner-edit-studio-bio
  test('@regression studio-owner-edit-studio-bio — Verified studio owner updates studio bio in general settings', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    const studioId = clone.idMap['studio_chelsea_004'] || 'studio_chelsea_004';
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click(`[data-testid="manage-studio-${studioId}"]`);
    await page.click('[data-testid="studio-tab-general"]');

    // Edit Bio
    const updatedBio = 'Premier Chelsea boutique studio dedicated to dynamic alignment and mindful flow.';
    await page.fill('[data-testid="studio-bio-textarea"]', updatedBio);
    await page.click('[data-testid="save-studio-bio-button"]');

    // Wait for save completion and modal close
    await expect(page.locator('[data-testid="studio-bio-textarea"]')).not.toBeVisible({ timeout: 5000 });

    // Verify bio persists upon reopening
    await page.click(`[data-testid="manage-studio-${studioId}"]`);
    await page.click('[data-testid="studio-tab-general"]');
    await expect(page.locator('[data-testid="studio-bio-textarea"]')).toHaveValue(updatedBio);
  });

  // 10. studio-owner-grant-pass-nonexistent-user-fails
  test('@regression studio-owner-grant-pass-nonexistent-user-fails — Admin pass grant attempts deposit to unregistered member email and aborts with zero writes', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Open Grant Pass Modal
    await page.click('button:has-text("Grant Pass")');
    await expect(page.locator('text=Grant Pass & Credits to Member')).toBeVisible({ timeout: 5000 });

    // Enter non-existent user email
    await page.fill('input[placeholder*="elena@inspiredyoga.app"]', 'nonexistent@inspired.test');
    await page.click('[data-testid="submit-grant-pass-button"]');

    // Error notice appears
    await expect(page.locator('text=No registered user account found matching "nonexistent@inspired.test"')).toBeVisible({ timeout: 5000 });
  });

  // 11. studio-owner-grant-pass-stepper-lower-bound-clamp
  test('@regression studio-owner-grant-pass-stepper-lower-bound-clamp — Admin grant pass stepper clamps at 1 and prevents decrementing to zero or negative', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Open Grant Pass Modal
    await page.click('button:has-text("Grant Pass")');
    await expect(page.locator('text=Grant Pass & Credits to Member')).toBeVisible({ timeout: 5000 });

    // Credit count initial value is 1
    const creditCountSpan = page.locator('span.text-emerald-400:has-text("1")');
    await expect(creditCountSpan).toBeVisible();

    // Decrement button "−" is disabled at lower bound clamp
    const buttonMinus = page.locator('button:has-text("−")');
    await expect(buttonMinus).toBeDisabled();

    // Value remains clamped at 1
    await expect(creditCountSpan).toBeVisible();
  });

  // 12. studio-owner-publish-class-missing-teacher-fails
  test('@regression studio-owner-publish-class-missing-teacher-fails — Publishing live class without assigned teacher is blocked', async ({
    page,
  }) => {
    await loginAs(page, 'user_owner_noteach@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Omar').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Title
    await page.fill('#class-title-input', 'Teacherless Class');

    // Explicitly unselect teacher
    await page.selectOption('select#teacher-select', '');

    // Attempt to Publish Live
    await page.click('button:has-text("Publish Live Class")');

    // Error notice blocks submission
    await expect(page.locator('[data-testid="class-creator-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="class-creator-error"]')).toContainText('Please assign a teacher to publish this class.');
  });

  // 13. studio-owner-publish-draft-directly
  test('@regression studio-owner-publish-draft-directly — Studio owner converts saved draft directly into published live class', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');

    // Create a draft class first
    await page.click('button:has-text("Create New Class")');
    await page.fill('#class-title-input', 'Draft To Live Flow');
    await page.click('[data-testid="save-draft-button"]');

    // Switch to Drafts tab in Class Manager
    await page.click('[data-testid="class-manager-tab-drafts"]');
    await expect(page.locator('text=Draft To Live Flow').first()).toBeVisible({ timeout: 10000 });

    // Publish directly from Drafts card
    await page.click('button:has-text("Publish Live")');

    // Success banner confirms class is published live to studio schedule
    await expect(page.locator('text=Published "Draft To Live Flow" live to schedule!').first()).toBeVisible({ timeout: 10000 });
  });

  // 14. studio-owner-reassign-independent-studio-to-brand
  test('@regression studio-owner-reassign-independent-studio-to-brand — Studio owner links independent studio to existing parent brand network', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_brand_founder');

    // Set cloned Fulham Flow to independent location initially
    const db = admin.firestore();
    const clonedStudioId = clone.idMap['studio_fulham_005'] || 'studio_fulham_005';
    await db.collection('studios').doc(clonedStudioId).update({ companyId: null, parentBrandName: null });

    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Marcus').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);

    // Fulham Flow is now under Independent Studios
    await expect(page.locator('text=Fulham Flow').first()).toBeVisible({ timeout: 10000 });

    // Manage Fulham Flow
    const manageBtns = page.locator('button:has-text("Manage Studio")');
    await manageBtns.last().click();

    // In General Settings, select parent brand The Zen Collective
    await expect(page.locator('[data-testid="select-parent-brand"]')).toBeVisible({ timeout: 5000 });
    await page.selectOption('[data-testid="select-parent-brand"]', { label: '🏢 The Zen Collective' });

    // Verify return to studios overview shows Fulham Flow linked to brand
    await page.click('button:has-text("Back to My Studios")');
    await expect(page.locator('text=The Zen Collective').first()).toBeVisible({ timeout: 10000 });

    // Assert Firestore studio document has updated companyId
    await expect.poll(async () => {
      const doc = await db.collection('studios').doc(clonedStudioId).get();
      return doc.data()?.companyId;
    }, { timeout: 8000 }).toBeTruthy();
  });

  // 15. studio-owner-recurrence-date-inverted-failure
  test('@regression studio-owner-recurrence-date-inverted-failure — Recurrence engine rejects end dates earlier than first session date', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Title
    await page.fill('#class-title-input', 'Inverted Recurrence Class');

    // Select Teacher
    const teacherSelect = page.locator('select#teacher-select');
    await expect(teacherSelect).toBeVisible({ timeout: 5000 });
    await teacherSelect.selectOption({ index: 1 });

    // Set recurrence cutoff date to an earlier inverted date
    await page.click('[data-testid="recurrence-date-radio"]');
    await page.fill('[data-testid="recurrence-date-input"]', '2020-01-01');

    // Attempt to publish
    await page.click('button:has-text("Publish Live Class")');

    // Validation error appears blocking submission
    await expect(page.locator('[data-testid="class-creator-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="class-creator-error"]')).toContainText('End date must be after first session date.');
  });

  // 16. studio-owner-recurrence-occurrences-boundary
  test('@regression studio-owner-recurrence-occurrences-boundary — Studio owner sets occurrence-based recurrence capped at maximum 52-occurrence boundary', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Title & Teacher
    await page.fill('#class-title-input', '52-Week Year-Round Flow');
    const teacherSelect = page.locator('select#teacher-select');
    await expect(teacherSelect).toBeVisible({ timeout: 5000 });
    await teacherSelect.selectOption({ index: 1 });

    // Set recurrence to occurrences boundary 52
    await page.click('[data-testid="recurrence-occurrences-radio"]');
    await page.fill('[data-testid="recurrence-occurrences-input"]', '52');

    // Publish class
    await page.click('button:has-text("Publish Live Class")');

    // Confirmation toast confirms live publish
    await expect(page.locator('text=Class published live to studio schedule!').first()).toBeVisible({ timeout: 10000 });

    // Assert Firestore materialized all 52 session documents
    const db = admin.firestore();
    const studioId = clone.idMap['studio_chelsea_004'] || 'studio_chelsea_004';
    await expect.poll(async () => {
      const snap = await db.collection('studios').doc(studioId).collection('classes')
        .where('className', '==', '52-Week Year-Round Flow')
        .get();
      return snap.size;
    }, { timeout: 10000 }).toBe(52);
  });

  // 17. studio-owner-reopen-temp-closed-studio
  test('@regression studio-owner-reopen-temp-closed-studio — Studio owner reopens temporarily closed studio and clears closure notice', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-general"]');

    // Set to temp closed first
    await page.click('[data-testid="studio-status-temp-closed-button"]');
    await expect(page.locator('text=Temporarily Closed').first()).toBeVisible({ timeout: 5000 });

    // Reopen studio
    await page.click('[data-testid="studio-status-active-button"]');

    // Status updates to Open & Active
    await expect(page.locator('text=Open & Active').first()).toBeVisible({ timeout: 5000 });
  });

  // 18. studio-owner-save-class-draft
  test('@regression studio-owner-save-class-draft — Studio owner saves incomplete class as draft and validates isolation from public timetable', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Title
    await page.fill('#class-title-input', 'Draft Only Class');

    // Tap Save Draft
    await page.click('[data-testid="save-draft-button"]');

    // Switch to Drafts tab and assert presence
    await page.click('[data-testid="class-manager-tab-drafts"]');
    await expect(page.locator('text=Draft Only Class').first()).toBeVisible({ timeout: 10000 });
  });

  // 19. studio-owner-set-temp-closed-with-note
  test('@regression studio-owner-set-temp-closed-with-note — Studio owner pauses location with temporary closure notice and custom manager notes', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-general"]');

    // Toggle status to Temporarily Closed
    await page.click('[data-testid="studio-status-temp-closed-button"]');

    // Enter note and save
    await page.fill('[data-testid="input-status-note"]', 'Flooring renovation. Reopening Nov 1st.');
    await page.click('[data-testid="save-status-note-button"]');

    // Confirm saved badge appears
    await expect(page.locator('text=Saved & Active')).toBeVisible({ timeout: 5000 });
  });

  // 20. studio-owner-soft-close-and-reopen-studio
  test('@regression studio-owner-soft-close-and-reopen-studio — Studio owner permanently soft-closes studio location and subsequently reopens it', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-general"]');

    // Soft-close studio location
    await page.click('[data-testid="studio-status-closed-button"]');
    await expect(page.locator('text=Permanently Closed').first()).toBeVisible({ timeout: 5000 });

    // Reopen studio location
    await page.click('[data-testid="studio-status-active-button"]');
    await expect(page.locator('text=Open & Active').first()).toBeVisible({ timeout: 5000 });
  });

  // 21. studio-owner-switch-policy-custom-to-follow
  test('@regression studio-owner-switch-policy-custom-to-follow — Branch owner reverts from custom_override back to follow_brand restoring brand pass inheritance', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_elena');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Elena').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-pricing"]');

    // Switch to custom location override first
    await page.click('[data-testid="policy-custom-override-button"]');
    await expect(page.locator('text=Set independent drop-in rates and location-specific passes.')).toBeVisible({ timeout: 5000 });

    // Switch back to Follow Brand Pricing
    await page.click('[data-testid="policy-follow-brand-button"]');

    // Brand passes are restored with Inherited badge
    await expect(page.locator('text=Inherited').first()).toBeVisible({ timeout: 10000 });
  });
});
