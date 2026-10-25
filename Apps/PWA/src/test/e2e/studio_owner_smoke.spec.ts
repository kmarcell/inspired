import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';

/**
 * Resets the unclaimed shadow studio seed and pending claim record in Firestore
 * to ensure pristine repeatable test execution.
 */
async function resetShadowStudioSeed() {
  const db = admin.firestore();

  await db.collection('studios').doc('studio_shadow_kew').set(
    {
      id: 'studio_shadow_kew',
      name: 'Kew Gardens Yoga Sanctuary',
      address: '15 Kew Green, Richmond TW9 3AA',
      about: 'Serene riverside yoga space near the royal botanic gardens.',
      rating: 4.6,
      isClaimed: false,
      status: 'active',
      ownerId: '',
      companyId: null,
      parentBrandName: null,
      parentBrandCommunityId: null,
      reviewCount: 19,
      membersCount: 52,
      location_prefix: 'TW9',
      engagementScore: 420,
      contactEmail: 'contact@kewgardensyoga.test',
      contactPhone: '+44 20 8940 5566',
      websiteUrl: 'https://kewgardensyoga.test',
      moderationSettings: { autoApproveMemberComments: true, guestCommentsEnabled: true },
      location: { lat: 51.4828, lng: -0.2882 },
      assignedTeachers: [
        { id: 'user_teacher_001', displayName: 'Maya Sharma', specialty: 'Vinyasa Flow', isPublic: true },
      ],
    },
    { merge: true }
  );

  await db.collection('studioClaims').doc('claim_pending_seed').set({
    id: 'claim_pending_seed',
    studioId: 'studio_shadow_kew',
    studioName: 'Kew Gardens Yoga Sanctuary',
    userId: 'user_newbie',
    userEmail: 'user_newbie@inspired.test',
    verificationMethod: 'domain_email',
    documentFileName: null,
    status: 'pending',
    createdAt: '2026-01-01T10:00:00Z',
  });

  // Remove any newly created claims for studio_shadow_kew other than the original seed
  const claimsSnap = await db.collection('studioClaims').where('studioId', '==', 'studio_shadow_kew').get();
  for (const doc of claimsSnap.docs) {
    if (doc.id !== 'claim_pending_seed') {
      await doc.ref.delete();
    }
  }
}

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

test.describe('Studio Owner Smoke Suite', () => {
  // 1. brand-founder-delete-brand-preserves-independent-studios
  test('@smoke brand-founder-delete-brand-preserves-independent-studios — Brand founder confirms brand network deletion and assigned branch studios revert to independent locations', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_brand_founder');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Marcus').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await expect(page.locator('text=The Zen Collective').first()).toBeVisible({ timeout: 10000 });

    // Open Brand Management Subpage
    await page.click('button:has-text("Manage Brand & Currencies")');
    await expect(page.locator('text=Brand Info & Settings').first()).toBeVisible({ timeout: 5000 });

    // Switch to Settings tab
    await page.click('[data-testid="brand-tab-settings"]');

    // Click Danger Zone Delete Brand Network
    await page.click('button:has-text("Delete Brand Network")');

    // Confirm in modal
    await expect(page.locator('text=Delete Brand Network?')).toBeVisible();
    await page.click('button:has-text("Confirm Delete Brand")');

    // Verify company is deleted and branch studio reverts to Independent Studios
    await expect(page.locator('text=My Brands & Studios').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=The Zen Collective')).not.toBeVisible();
    await expect(page.locator('text=Independent Studios')).toBeVisible();
    await expect(page.locator('text=Fulham Flow').first()).toBeVisible();
  });

  // 2. non-teaching-owner-assigns-visiting-teacher
  test('@smoke non-teaching-owner-assigns-visiting-teacher — Non-teaching studio owner creates class and assigns visiting teacher with owner excluded from teacher selector', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_owner_noteach');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Omar').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);

    // Open Shoreditch studio management
    await page.click('button:has-text("Manage Studio")');

    // Switch to Schedule & Class Templates tab
    await page.click('[data-testid="studio-tab-schedule"]');

    // Open Class Creator
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Inspect Teacher Selector
    const teacherSelect = page.locator('select#teacher-select');
    await expect(teacherSelect).toBeVisible();

    // Verify Omar (non-teacher owner) does NOT appear
    await expect(teacherSelect.locator('option:has-text("Omar")')).toHaveCount(0);

    // Verify visiting teacher Maya Sharma appears and can be selected
    await expect(teacherSelect.locator('option:has-text("Maya Sharma")')).toHaveCount(1);
    await teacherSelect.selectOption({ index: 0 });

    // Fill Title and Publish
    await page.fill('#class-title-input', 'Morning Flow w/ Maya');
    await page.click('button:has-text("Publish Live Class")');

    // Verify class published live to schedule
    await expect(page.locator('text=Class published live to studio schedule!').first()).toBeVisible({ timeout: 10000 });
  });

  // 3 & 4: Shadow claim tests grouped serially to protect shadow studio seed
  test.describe.serial('Shadow Studio Claim Lifecycle', () => {
    test.beforeEach(async () => {
      await resetShadowStudioSeed();
    });

    test.afterEach(async () => {
      await resetShadowStudioSeed();
    });

    // 3. platform-admin-approve-shadow-claim
    test('@smoke platform-admin-approve-shadow-claim — Platform administrator reviews pending studio claim and approves ownership transfer', async ({
      page,
    }) => {
      // Platform admin Maryia logs in directly (read-only audit with state-reset teardown)
      await loginAs(page, 'user_maryia@inspired.test', TEST_PASSWORD);
      await expect(page.locator('text=Maryia').first()).toBeVisible({ timeout: 10000 });

      // Navigate to Admin Claims Verification portal via profile
      await page.click('[data-testid="desktop-tab-profile"]');
      await expect(page.locator('[data-testid="profile-admin-portal-button"]')).toBeVisible({ timeout: 5000 });
      await page.click('[data-testid="profile-admin-portal-button"]');

      // Review pending claim
      await expect(page.locator('text=Studio Claim Verification Portal')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Kew Gardens Yoga Sanctuary').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=user_newbie@inspired.test').first()).toBeVisible();

      // Approve claim
      await page.click('[data-testid="approve-claim-claim_pending_seed"]');

      // Verify approval success banner
      await expect(page.locator('[data-testid="admin-action-success"]')).toBeVisible({ timeout: 10000 });
    });

    // 4. studio-owner-claim-shadow-profile
    test('@smoke studio-owner-claim-shadow-profile — Prospective studio owner claims unclaimed shadow studio and uploads verification proof', async ({
      page,
      clonedPersona,
    }) => {
      const clone = await clonedPersona('user_newbie');
      await loginAs(page, clone.email, clone.password);
      await expect(page.locator('text=Yoga').first()).toBeVisible({ timeout: 10000 });

      // Navigate to Search & Explorer
      await page.click('[data-testid="desktop-tab-search"]');
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible({ timeout: 5000 });

      // Search for shadow studio
      await page.fill('[data-testid="search-input"]', 'Kew');
      await expect(page.locator('text=Kew Gardens Yoga Sanctuary').first()).toBeVisible({ timeout: 10000 });

      // Click Claim Studio
      const claimBtn = page.locator('button:has-text("Claim Studio"), [data-testid^="claim-studio-btn-"]');
      await expect(claimBtn.first()).toBeVisible();
      await claimBtn.first().click();

      // ClaimStudioView opens
      await expect(page.locator('text=Unclaimed Shadow Profile')).toBeVisible({ timeout: 5000 });

      // Attach verification document
      await page.setInputFiles('[data-testid="input-claim-document"]', {
        name: 'utility_bill.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock proof of ownership utility bill'),
      });

      // Submit verification claim
      await page.click('[data-testid="submit-claim-button"]');

      // Verify confirmation banner informs user claim is under administrative review
      await expect(page.locator('[data-testid="claim-submitted-banner"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Verification Claim Submitted!')).toBeVisible();
    });
  });

  // 5. studio-owner-create-brand-and-studio
  test('@smoke studio-owner-create-brand-and-studio — Studio owner creates new brand network and first branch studio in 2-step wizard', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_brand_founder');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Marcus').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('[data-testid="create-studio-button"]');
    await expect(page.locator('text=Create Studio & Brand')).toBeVisible({ timeout: 5000 });

    // Step 1: Brand Info
    await page.selectOption('[data-testid="select-company-id"]', 'new');
    await page.fill('[data-testid="input-company-name"]', 'Zenith Flow Collective');
    await page.fill('[data-testid="input-company-email"]', 'contact@zenithflow.test');
    await page.fill('[data-testid="input-company-description"]', 'Boutique hot yoga sanctuaries');

    // Step 2: Studio Location Details
    await page.fill('[data-testid="input-studio-name"]', 'Zenith Hammersmith');
    await page.fill('[data-testid="input-studio-prefix"]', 'W6');
    await page.fill('[data-testid="input-studio-address"]', '22 King St, London W6 0QA');
    await page.fill('[data-testid="input-studio-phone"]', '+44 20 7946 0888');

    // Submit wizard
    await page.click('[data-testid="submit-create-studio-button"]');

    // Verify redirected to My Studios showing new brand and branch
    await expect(page.locator('text=Zenith Flow Collective').first()).toBeVisible({ timeout: 15000 });
  });

  // 6. studio-owner-create-brand-currency-catalog
  test('@smoke studio-owner-create-brand-currency-catalog — Brand founder defines multi-branch currency pricing packages that propagate across branches', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_brand_founder');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Marcus').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Brand & Currencies")');

    // Open Currencies tab
    await page.click('[data-testid="brand-tab-currencies"]');
    await expect(page.locator('text=Brand Currencies & Passes')).toBeVisible({ timeout: 5000 });

    // Open currency creator
    await page.click('button:has-text("Create Currency")');

    // Fill Pass details
    await page.fill('input[placeholder*="5-Class Summer Pack"]', '5-Class Pack (£75)');
    await page.fill('input[placeholder*="Valid across all brand studios"]', 'Valid across all brand branch studios');

    // Set tier to credit_pack
    const tierSelect = page.locator('select').filter({ hasText: 'Single Drop-In' });
    await tierSelect.selectOption('credit_pack');

    // Set base price to 75
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill('75');

    // Set credits to 5
    const creditsInput = page.locator('input[type="number"]').nth(1);
    await creditsInput.fill('5');

    // Save Pass
    await page.click('button:has-text("Save Changes")');

    // Verify pass is rendered in the list
    await expect(page.locator('text=5-Class Pack (£75)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=£75').first()).toBeVisible();
  });

  // 7. studio-owner-create-independent-studio
  test('@smoke studio-owner-create-independent-studio — User creates independent standalone studio defaulting to unverified pending claim', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_david_kim');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=David').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('[data-testid="create-studio-button"]');

    // Step 1: Select Independent Studio
    await page.selectOption('[data-testid="select-company-id"]', 'none');

    // Step 2: Fill studio details
    await page.fill('[data-testid="input-studio-name"]', 'Chiswick Riverside Shala');
    await page.fill('[data-testid="input-studio-prefix"]', 'W4');
    await page.fill('[data-testid="input-studio-address"]', '50 Chiswick Lane, London W4 2XX');
    await page.fill('[data-testid="input-studio-phone"]', '+44 20 7946 0999');

    // Submit form
    await page.click('[data-testid="submit-create-studio-button"]');

    // Verify studio appears under Independent Studios section
    await expect(page.locator('text=Chiswick Riverside Shala').first()).toBeVisible({ timeout: 15000 });
  });

  // 8. studio-owner-create-standalone-currency-catalog
  test('@smoke studio-owner-create-standalone-currency-catalog — Independent studio owner establishes studio-specific class pricing catalog', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_david_kim');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=David').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Open Pricing & Currency Policy tab
    await page.click('[data-testid="studio-tab-pricing"]');
    await expect(page.locator('text=Currency Acceptance Policy')).toBeVisible({ timeout: 5000 });

    // Open Create Currency
    await page.click('button:has-text("Create Currency")');

    // Fill pass details
    await page.fill('input[placeholder*="Single Drop-In or 5-Class Pack"]', 'Drop-In Pass (£16)');
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill('16');

    // Save currency changes
    await page.click('button:has-text("Save Currency Changes")');

    // Verify pass is rendered
    await expect(page.locator('text=Drop-In Pass (£16)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=£16').first()).toBeVisible();
  });

  // 9. studio-owner-grant-pass-walkin-stepper
  test('@smoke studio-owner-grant-pass-walkin-stepper — Studio owner records in-person walk-in sale and deposits class credits into member wallet via stepper', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Open Grant Pass Modal
    await page.click('button:has-text("Grant Pass")');
    await expect(page.locator('text=Grant Pass & Credits to Member')).toBeVisible({ timeout: 5000 });

    // Enter recipient member
    await page.fill('input[placeholder*="elena@inspiredyoga.app"]', 'user_sarah@inspired.test');

    // Increment stepper from 1 to 2 credits
    await page.click('button:has-text("＋")');

    // Click Grant Button
    await page.click('button:has-text("Grant 2 Credit")');

    // Verify success confirmation panel
    await expect(page.locator('text=Pass Granted & Deposited!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=2 Credit(s) deposited directly into').first()).toBeVisible();

    // Close modal
    await page.click('button:has-text("Done")');
  });

  // 10. studio-owner-manage-studio-3tabs-navigation
  test('@smoke studio-owner-manage-studio-3tabs-navigation — Studio owner navigates unified in-place 3-tab layout: General Settings, Pricing & Policies, Timetable', async ({
    page,
  }) => {
    // Read-only audit persona
    await loginAs(page, 'user_sophia_vane@inspired.test', TEST_PASSWORD);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Verify 3 tabs are rendered
    const generalTab = page.locator('[data-testid="studio-tab-general"]');
    const pricingTab = page.locator('[data-testid="studio-tab-pricing"]');
    const scheduleTab = page.locator('[data-testid="studio-tab-schedule"]');

    await expect(generalTab).toBeVisible();
    await expect(pricingTab).toBeVisible();
    await expect(scheduleTab).toBeVisible();

    // Initial state: General Settings
    await expect(page.locator('text=Studio Bio / About Text')).toBeVisible();

    // Tab 2: Pricing & Policies in-place transition
    await pricingTab.click();
    await expect(page.locator('text=Currency Acceptance Policy')).toBeVisible();

    // Tab 3: Timetable / Schedule in-place transition
    await scheduleTab.click();
    await expect(page.locator('button:has-text("Create New Class")').first()).toBeVisible({ timeout: 5000 });

    // Return to General Tab
    await generalTab.click();
    await expect(page.locator('text=Studio Bio / About Text')).toBeVisible();
  });

  // 11. studio-owner-publish-weekly-recurring-class-with-climate
  test('@smoke studio-owner-publish-weekly-recurring-class-with-climate — Studio owner publishes ongoing weekly recurring class with room climate preset and recurrence', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Sophia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Go to Schedule tab
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');
    await expect(page.locator('text=Class Schedule Creator')).toBeVisible({ timeout: 5000 });

    // Fill Class Title
    await page.fill('#class-title-input', 'Sunset Yin Yoga');

    // Select Room Climate: Heated Room (26°C)
    await page.click('button:has-text("Heated Room")');
    const tempInput = page.locator('input[type="number"][min="20"][max="45"]');
    if (await tempInput.isVisible()) {
      await tempInput.fill('26');
    }

    // Set Capacity
    const capacityInput = page.locator('input[type="number"][min="1"][max="100"]');
    if (await capacityInput.isVisible()) {
      await capacityInput.fill('15');
    }

    // Select Recurrence: Weekly Recurring on Tuesdays and Thursdays
    await page.click('button:has-text("Weekly Recurring")');
    await page.click('button:has-text("Tue")');
    await page.click('button:has-text("Thu")');

    // Publish Live
    await page.click('button:has-text("Publish Live Class")');

    // Verify published class toast confirms publishing
    await expect(page.locator('text=Class published live to studio schedule!').first()).toBeVisible({ timeout: 15000 });
  });

  // 12. studio-owner-save-brand-class-template
  test('@smoke studio-owner-save-brand-class-template — Brand founder creates teacher-agnostic brand class template shared across all branches', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_maryia');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Maryia').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Brand & Currencies")');

    // Open branch studio
    await page.click('button:has-text("Manage Location")');

    // Go to Schedule tab
    await page.click('[data-testid="studio-tab-schedule"]');
    await page.click('button:has-text("Create New Class")');

    // Fill blueprint details
    await page.fill('#class-title-input', 'Ashtanga Primary Series');

    // Save as Brand Template
    await page.click('button:has-text("Save as Template")');

    // Verify template blueprint saved
    await expect(page.locator('text=Template blueprint saved to brand catalog!').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Ashtanga Primary Series').first()).toBeVisible();
  });

  // 13. studio-owner-schedule-class-from-brand-template-sync-teacher
  test('@smoke studio-owner-schedule-class-from-brand-template-sync-teacher — Branch manager instantiates recurring schedule from template dynamically synchronizing target studio teachers', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_elena');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Elena').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Go to Schedule tab
    await page.click('[data-testid="studio-tab-schedule"]');

    // Instantiate schedule from brand template card
    const scheduleBtn = page.locator('button:has-text("Use Template to Schedule")');
    await expect(scheduleBtn.first()).toBeVisible({ timeout: 10000 });
    await scheduleBtn.first().click();

    // Verify Modal opens and teacher dropdown synchronizes to Chiswick instructor
    await expect(page.locator('text=Brand Template Blueprint')).toBeVisible({ timeout: 5000 });
    const teacherSelect = page.locator('select').filter({ hasText: 'Elena' });
    await expect(teacherSelect).toBeVisible();

    // Click Publish Live
    await page.click('button:has-text("Instantiate & Publish Live")');

    // Verify class appears on Chiswick schedule
    await expect(page.locator('text=Live class schedule created').first()).toBeVisible({ timeout: 15000 });
  });

  // 14. studio-owner-switch-policy-follow-to-custom
  test('@smoke studio-owner-switch-policy-follow-to-custom — Branch owner switches policy from follow_brand to custom_override with isolated custom rates', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_elena');
    await loginAs(page, clone.email, clone.password);
    await expect(page.locator('text=Elena').first()).toBeVisible({ timeout: 10000 });

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');

    // Open Pricing & Currency Policy tab
    await page.click('[data-testid="studio-tab-pricing"]');
    await expect(page.locator('text=Currency Acceptance Policy')).toBeVisible({ timeout: 5000 });

    // Switch policy to Custom Location Pricing
    await page.click('button:has-text("Custom Location Pricing")');

    // Add a custom location pass
    await page.click('button:has-text("Create Currency")');
    await page.fill('input[placeholder*="Single Drop-In or 5-Class Pack"]', 'Custom Chiswick Drop-In (£25)');
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill('25');

    // Save pass
    await page.click('button:has-text("Save Currency Changes")');

    // Verify custom override pass appears in custom accepted list
    await expect(page.locator('text=Custom Chiswick Drop-In (£25)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Custom Accepted Location Currencies').first()).toBeVisible();
  });
});
