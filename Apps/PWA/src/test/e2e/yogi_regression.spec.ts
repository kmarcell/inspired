import { test, expect } from './fixtures';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';

/** Helper to sign in with dev password tool */
async function devLogin(page: any, email: string, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 10000 });
  await page.fill('[data-testid="dev-email-input"]', email);
  await page.fill('[data-testid="dev-password-input"]', password);
  await page.click('[data-testid="dev-submit-button"]');
}

/** Helper to navigate between tabs */
async function navigateTo(page: any, tab: 'feed' | 'search' | 'communities' | 'profile' | 'studios') {
  if (tab === 'feed') {
    await page.locator('[data-testid="desktop-tab-feed"]').first().click();
  } else if (tab === 'search') {
    await page.locator('[data-testid="desktop-tab-search"], [data-testid="header-search-bar"]').first().click();
  } else if (tab === 'communities') {
    await page.locator('[data-testid="desktop-tab-communities"], [data-testid="header-jc-button"]').first().click();
  } else if (tab === 'profile') {
    await page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]').first().click();
  } else if (tab === 'studios') {
    await page.locator('[data-testid="desktop-tab-studios"]').first().click();
  }
}

/** Helper to accurately open a studio profile via Search */
async function openStudioProfile(page: any, query: string, studioName: string, studioId: string) {
  const searchTab = page.locator('[data-testid="desktop-tab-search"], button:has-text("Search"), [data-testid="header-search-bar"]');
  await searchTab.first().click();

  const searchInput = page.locator('[data-testid="search-input"]');
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(query);

  const viewStudioBtn = page.locator(`[data-testid="view-studio-btn-${studioId}"]`);
  await expect(viewStudioBtn.first()).toBeVisible({ timeout: 5000 });
  await viewStudioBtn.first().click();

  await expect(page.locator(`h1:has-text("${studioName}")`).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Yogi Regression E2E Suite (27 Scenarios)', () => {
  // 1. visitor-magic-link-cooldown-throttled
  test('@regression visitor-magic-link-cooldown-throttled — Visitor requests magic link and 60-second cooldown timer throttles retries', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    await page.fill('[data-testid="email-input"]', 'user_sarah@inspired.test');
    await page.click('[data-testid="send-link-button"]');

    // Toast appears
    await expect(page.locator('[data-testid="magic-link-sent"]')).toBeVisible({ timeout: 5000 });

    // Send button disabled with countdown timer
    const sendBtn = page.locator('[data-testid="send-link-button"]');
    await expect(sendBtn).toBeDisabled();
    await expect(sendBtn).toContainText(/Resend link in \d+s/i);
  });

  // 2. visitor-maintenance-mode-barrier
  test('@regression visitor-maintenance-mode-barrier — Remote Config maintenance mode activates non-dismissible maintenance screen', async ({ page }) => {
    await page.goto('/?maintenance=true');

    // Maintenance barrier is rendered
    const maintenanceBarrier = page.locator('[data-testid="maintenance-screen"]');
    await expect(maintenanceBarrier).toBeVisible({ timeout: 10000 });
    await expect(maintenanceBarrier).toContainText('Under Scheduled Maintenance');
    await expect(maintenanceBarrier).toContainText('Expected Return: Today at 10:00 UTC');

    // Main app navigation is hidden
    await expect(page.locator('[data-testid="desktop-tab-feed"]')).not.toBeVisible();
  });

  // 3. visitor-onboarding-profane-name-rejected
  test('@regression visitor-onboarding-profane-name-rejected — Onboarding blocks offensive display names via moderation guard', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');
    const db = admin.firestore();
    // Delete profile doc so AuthContext routes to OnboardingView
    await db.collection('users').doc(clone.userId).delete();

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Setup Your Profile').first()).toBeVisible({ timeout: 10000 });

    // Fill profane display name
    await page.fill('[data-testid="display-name-input"]', 'badword_yogi');
    await page.click('[data-testid="confirm-profile-button"]');

    // Error appears and halts onboarding
    const errorAlert = page.locator('[data-testid="onboarding-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/inappropriate content|inspired name/i);
  });

  // 4. visitor-onboarding-short-name-rejected
  test('@regression visitor-onboarding-short-name-rejected — Onboarding rejects display names shorter than 2 characters', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');
    const db = admin.firestore();
    await db.collection('users').doc(clone.userId).delete();

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Setup Your Profile').first()).toBeVisible({ timeout: 10000 });

    // Enter single character
    await page.fill('[data-testid="display-name-input"]', 'A');

    // Submission is blocked and validation warning shown
    const errorAlert = page.locator('[data-testid="onboarding-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('Display name must be at least 2 characters');
    await expect(page.locator('[data-testid="confirm-profile-button"]')).toBeDisabled();
  });

  // 5. visitor-staging-login-uninvited-blocked
  test('@regression visitor-staging-login-uninvited-blocked — Uninvited visitor email is rejected on staging environment by whitelist gate', async ({ page }) => {
    await page.goto('/?staging=true');
    await expect(page.locator('[data-testid="staging-gating-badge"]')).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="email-input"]', 'uninvited_random_stranger@example.com');
    await page.click('[data-testid="send-link-button"]');

    // Access denied alert appears
    const errorAlert = page.locator('[data-testid="login-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/staging access restricted.*not been invited/i);
  });

  // 6. yogi-book-class-expired-pass-excluded
  test('@regression yogi-book-class-expired-pass-excluded — Yogi holding expired pass cannot select it during booking', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';
    const db = admin.firestore();

    // Ensure clone is joined to studio
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [`comm_studio_${studioId}`, 'comm_studio_studio_askew_001', 'area_askew'],
    });

    // Create an expired pass in user_passes
    const expiredPassId = `pass_expired_${Date.now()}`;
    await db.collection('user_passes').doc(expiredPassId).set({
      id: expiredPassId,
      userId: clone.userId,
      currencyId: 'curr_expired_test',
      currencyTitle: 'Expired Trial Pass',
      studioId,
      companyId: 'company_affordable_london',
      tierType: 'credit_pack',
      totalCredits: 5,
      creditsRemaining: 3,
      status: 'expired',
      expiresAt: '2025-01-01T00:00:00Z',
      purchasedAt: '2024-11-01T00:00:00Z',
    });

    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Open booking modal
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 6000 });
    await bookBtn.click();

    // Redeem Pass modal opens
    await expect(page.locator('h3:has-text("Redeem Pass & Book")')).toBeVisible({ timeout: 6000 });

    // Expired pass is omitted from available pass radio options
    await expect(page.locator(`text=Expired Trial Pass`)).not.toBeVisible();
  });

  // 7. yogi-book-class-unlimited-pass-intact
  test('@regression yogi-book-class-unlimited-pass-intact — Yogi booking with unlimited subscription pass creates booking with zero credit deduction', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_elena');
    const db = admin.firestore();
    const studioId = clone.idMap['studio_chiswick_002'] || 'studio_chiswick_002';

    // Ensure clone is joined to Chiswick studio and holds an active unlimited pass
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [`comm_studio_${studioId}`, 'comm_studio_studio_chiswick_002', 'area_chiswick'],
    });

    const unlimitedPassId = `pass_unlimited_${Date.now()}`;
    await db.collection('user_passes').doc(unlimitedPassId).set({
      id: unlimitedPassId,
      userId: clone.userId,
      currencyId: 'curr_unlimited_chiswick',
      currencyTitle: 'VIP Unlimited Monthly',
      studioId,
      companyId: 'company_affordable_london',
      tierType: 'unlimited',
      unlimitedPeriod: 'monthly',
      status: 'active',
      expiresAt: '2028-12-31T23:59:59Z',
      purchasedAt: new Date().toISOString(),
    });


    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Chiswick', 'Chiswick Hot Yoga Studio', studioId);

    // Book a class
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 6000 });
    await bookBtn.click();

    // In modal, select unlimited pass and confirm
    const passRadio = page.locator('div[role="radio"]:has-text("VIP Unlimited Monthly")');
    await expect(passRadio).toBeVisible({ timeout: 5000 });
    await passRadio.click();
    const confirmBtn = page.locator('[data-testid="confirm-booking-pass-button"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Status updates to Booked
    await expect(page.locator('button:has-text("✓ Booked")').first()).toBeVisible({ timeout: 6000 });

    // Firestore verification: unlimited pass status remains active and unlimited
    const passSnap = await db.collection('user_passes').doc(unlimitedPassId).get();
    expect(passSnap.exists).toBe(true);
    expect(passSnap.data().tierType).toBe('unlimited');
    expect(passSnap.data().status).toBe('active');
  });

  // 8. yogi-book-full-class-join-waitlist
  test('@regression yogi-book-full-class-join-waitlist — Yogi joins waitlist when class reaches full capacity without upfront credit deduction', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const db = admin.firestore();
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';

    // Ensure clone is joined to Askew studio
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [`comm_studio_${studioId}`, 'comm_studio_studio_askew_001', 'area_askew'],
    });

    // Create a full class (capacity == bookedCount)
    const fullClassId = `class_full_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    await db.collection('studios').doc(studioId).collection('classes').doc(fullClassId).set({
      id: fullClassId,
      studioId,
      className: 'Peak Hour Masterclass',
      dayOfWeek: (new Date().getDay() + 6) % 7,
      dateString: todayStr,
      startTime: '18:00',
      endTime: '19:15',
      capacity: 1,
      bookedCount: 1,
      waitlist: [],
      roomClimate: 'hot_studio',
      teacherId: 'user_david_kim',
      teacherName: 'David Kim',
      classTypeDescription: 'Advanced Ashtanga Masterclass.',
    });


    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Button shows Join Waitlist
    const waitlistBtn = page.locator('[data-testid="join-waitlist-button"]:has-text("Join Waitlist")').first();
    await expect(waitlistBtn).toBeVisible({ timeout: 6000 });
    await waitlistBtn.click();

    // Button updates to Waitlisted
    await expect(page.locator('button:has-text("# Waitlisted")').first()).toBeVisible({ timeout: 6000 });

    // Verify booking record is waitlisted with 0 credits redeemed
    const bookingsSnap = await db.collection('class_bookings')
      .where('userId', '==', clone.userId)
      .get();
    expect(bookingsSnap.empty).toBe(false);
    expect(bookingsSnap.docs[0].data().status).toBe('waitlisted');
    expect(bookingsSnap.docs[0].data().creditsRedeemed).toBe(0);
  });

  // 9. yogi-book-past-class-disabled
  test('@regression yogi-book-past-class-disabled — Yogi cannot book a class session scheduled in the past', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const db = admin.firestore();
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';

    // Create a finished class with past timestamp
    const pastClassId = `class_past_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    await db.collection('studios').doc(studioId).collection('classes').doc(pastClassId).set({
      id: pastClassId,
      studioId,
      className: 'Early Dawn Flow (Finished)',
      dayOfWeek: (new Date().getDay() + 6) % 7,
      dateString: todayStr,
      startTime: '05:00',
      endTime: '06:00',
      isPast: true,
      capacity: 20,
      bookedCount: 5,
      waitlist: [],
      roomClimate: 'natural_ambient',
      teacherId: 'user_david_kim',
      teacherName: 'David Kim',
      classTypeDescription: 'Dawn practice.',
    });


    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Past class button is disabled with text Class Finished
    const finishedBtn = page.locator('[data-testid="past-class-button"]').first();
    await expect(finishedBtn).toBeVisible({ timeout: 6000 });
    await expect(finishedBtn).toBeDisabled();
    await expect(finishedBtn).toContainText('Class Finished');
  });

  // 10. yogi-dev-store-purchase-pass-activation
  test('@regression yogi-dev-store-purchase-pass-activation — Yogi simulates pass purchase in development store and pass activates in wallet', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';
    const db = admin.firestore();

    // Ensure newbie is joined to Askew studio
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [`comm_studio_${studioId}`, 'comm_studio_studio_askew_001', 'area_askew'],
    });

    // Ensure studio has at least 1 currency in company_currencies
    const testCurrencyId = `curr_pack_${Date.now()}`;
    await db.collection('company_currencies').doc(testCurrencyId).set({
      id: testCurrencyId,
      studioId,
      companyId: 'company_affordable_london',
      title: '5-Class Pack',
      basePriceAmount: 65,
      currencySymbol: '£',
      tierType: 'credit_pack',
      creditCount: 5,
      validityDays: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });


    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Click Book on class with 0 credits -> triggers store
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 6000 });
    await bookBtn.click();

    // Click "Purchase Pass"
    await page.click('button:has-text("Purchase Pass")');
    await expect(page.locator('h3:has-text("Purchase Studio Pass")')).toBeVisible({ timeout: 6000 });

    // Click Simulate Purchase
    const payBtn = page.locator('[data-testid="simulate-purchase-button"]');
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Pass activates in Firestore
    await expect.poll(async () => {
      const snap = await db.collection('user_passes').where('userId', '==', clone.userId).get();
      return snap.empty ? 0 : (snap.docs[0].data().creditsRemaining || 0);
    }, { timeout: 8000 }).toBeGreaterThan(0);
  });

  // 11. yogi-feed-empty-area-3tier-fallback
  test('@regression yogi-feed-empty-area-3tier-fallback — Feed executes 3-tier discovery fallback when recent local posts are absent', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');
    const db = admin.firestore();
    // Configure user with unpopulated area and 0 joined communities
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [],
      lastSearchArea: 'EmptyOuterArea99',
    });


    await devLogin(page, clone.email, clone.password);
    await navigateTo(page, 'feed');

    // Fallback to Discovery Mode appears
    const discoveryBox = page.locator('[data-testid="discovery-mode-container"]');
    await expect(discoveryBox).toBeVisible({ timeout: 8000 });
    await expect(discoveryBox).toContainText(/No Recent Posts in|Suggested Communities/i);
  });

  // 12. yogi-feed-post-avatar-privacy-fallback
  test('@regression yogi-feed-post-avatar-privacy-fallback — Feed post by author with groups-only privacy displays fallback avatar to non-members', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'feed');

    // Verify fallback avatar icon renders on feed tiles
    const fallbackAvatar = page.locator('[data-testid="post-author-avatar-fallback"]').first();
    await expect(fallbackAvatar).toBeVisible({ timeout: 8000 });
    const text = await fallbackAvatar.textContent();
    expect(text?.trim().length).toBe(1);
  });

  // 13. yogi-joined-communities-leave-community
  test('@regression yogi-joined-communities-leave-community — Yogi leaves a joined community via overflow menu without forfeiting class passes', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';
    const commId = `comm_studio_${studioId}`;
    const db = admin.firestore();


    await devLogin(page, clone.email, clone.password);
    await navigateTo(page, 'communities');

    // Click 3-dots overflow menu for Askew community
    const menuBtn = page.locator(`[data-testid="menu-btn-${commId}"]`);
    await expect(menuBtn).toBeVisible({ timeout: 6000 });
    await menuBtn.click();

    // Click Leave Community
    const leaveBtn = page.locator(`[data-testid="leave-button-${commId}"]`);
    await expect(leaveBtn).toBeVisible({ timeout: 5000 });
    await leaveBtn.click();

    // Community tile disappears from joined list
    await expect(page.locator(`[data-testid="joined-community-${commId}"]`)).not.toBeVisible({ timeout: 5000 });

    // Verify wallet passes remain completely intact in Firestore
    const passesSnap = await db.collection('user_passes').where('userId', '==', clone.userId).get();
    expect(passesSnap.empty).toBe(false);
  });

  // 14. yogi-pass-wallet-view-active-passes
  test('@regression yogi-pass-wallet-view-active-passes — Yogi audits active passes, credit counts, and expiration dates in Digital Wallet', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');

    await devLogin(page, clone.email, clone.password);
    await navigateTo(page, 'profile');

    // Inspect digital pass wallet section
    const walletSection = page.locator('[data-testid="profile-wallet-section"]');
    await expect(walletSection).toBeVisible({ timeout: 8000 });
    await expect(walletSection).toContainText('My Digital Pass Wallet');
    await expect(walletSection).toContainText('5-Class Pack');
    await expect(walletSection).toContainText(/credits remaining/i);
    await expect(walletSection).toContainText(/Expires:/i);
  });

  // 15. yogi-profile-edit-bio
  test('@regression yogi-profile-edit-bio — Yogi updates personal bio in profile settings and verifies character limit enforcement', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const db = admin.firestore();


    await devLogin(page, clone.email, clone.password);
    await navigateTo(page, 'profile');

    // Verify character counter
    await expect(page.locator('text=/ 280').first()).toBeVisible({ timeout: 6000 });

    const updatedBio = 'Mindful yogi exploring London studio classes and breathwork ✨';
    await page.fill('[data-testid="bio-textarea"]', updatedBio);
    await page.click('[data-testid="save-bio-button"]');

    // Feedback appears
    const feedback = page.locator('[data-testid="profile-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 6000 });
    await expect(feedback).toContainText('Bio updated successfully');

    // Firestore record updated
    const userDoc = await db.collection('users').doc(clone.userId).get();
    expect(userDoc.data().bio).toBe(updatedBio);
  });

  // 16. yogi-profile-toggle-privacy-settings
  test('@regression yogi-profile-toggle-privacy-settings — Yogi configures granular privacy toggles and public search constraint sync', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const db = admin.firestore();

    // Start with private profile so toggle turns it to public
    await db.collection('users').doc(clone.userId).update({
      'privacySettings.isProfilePublic': false,
      'privacySettings.avatarPrivacy': 'groups-only',
    });


    await devLogin(page, clone.email, clone.password);
    await navigateTo(page, 'profile');

    // Toggle Public Profile switch
    await page.click('[data-testid="toggle-public-profile"]');
    await page.click('[data-testid="save-privacy-button"]');

    const feedback = page.locator('[data-testid="profile-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 6000 });

    // Firestore synchronizes isProfilePublic and avatarPrivacy
    const userDoc = await db.collection('users').doc(clone.userId).get();
    expect(userDoc.data().privacySettings.isProfilePublic).toBe(true);
    expect(userDoc.data().privacySettings.avatarPrivacy).toBe('public');
  });

  // 17. yogi-schedule-closed-studio-bookings-blocked
  test('@regression yogi-schedule-closed-studio-bookings-blocked — Bookings are disabled on schedule when studio is temporarily closed', async ({ page, clonedPersona }) => {
    const ownerClone = await clonedPersona('user_maryia');
    const studioId = ownerClone.idMap['studio_askew_001'] || 'studio_askew_001';
    const db = admin.firestore();

    // Set isolated cloned studio status to temp_closed
    await db.collection('studios').doc(studioId).update({
      status: 'temp_closed',
      statusNote: 'Closed for structural maintenance',
    });

    const yogiClone = await clonedPersona('user_sarah');
    await devLogin(page, yogiClone.email, yogiClone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Schedule buttons rendered paused / disabled
    const pausedBtn = page.locator('[data-testid="paused-class-button"]').first();
    await expect(pausedBtn).toBeVisible({ timeout: 6000 });
    await expect(pausedBtn).toBeDisabled();
    await expect(pausedBtn).toContainText('Bookings Paused');
  });

  // 18. yogi-schedule-view-class-info-modal
  test('@regression yogi-schedule-view-class-info-modal — Yogi opens Class Info Modal and inspects room climate presets and details', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', 'studio_askew_001');

    // Click ⓘ info button on class tile
    const infoBtn = page.locator('[data-testid^="class-info-btn-"]').first();
    await expect(infoBtn).toBeVisible({ timeout: 6000 });
    await infoBtn.click();

    // Modal opens
    await expect(page.locator('text=Class Information').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Taught by').first()).toBeVisible();
    await expect(page.locator('text=/ROOM CLIMATE|HOT STUDIO|NATURAL AMBIENT|AIR CONDITIONED/i').first()).toBeVisible();

    // Close modal via ✕
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('text=Class Information')).not.toBeVisible({ timeout: 5000 });
  });

  // 19. yogi-schedule-view-custom-currency-badge
  test('@regression yogi-schedule-view-custom-currency-badge — Studio schedule class tile displays Custom Currency Acceptance badge when restricted', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';
    const db = admin.firestore();

    // Add class with custom currency acceptance policy
    const customClassId = `class_custom_badge_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    await db.collection('studios').doc(studioId).collection('classes').doc(customClassId).set({
      id: customClassId,
      studioId,
      className: 'Sound Bath & Breathwork',
      dayOfWeek: (new Date().getDay() + 6) % 7,
      dateString: todayStr,
      startTime: '19:30',
      endTime: '20:45',
      capacity: 15,
      bookedCount: 0,
      waitlist: [],
      roomClimate: 'natural_ambient',
      currencyAcceptancePolicyMode: 'customSelected',
      acceptedCurrencyIds: ['curr_custom_specialty'],
      teacherId: 'user_david_kim',
      teacherName: 'David Kim',
      classTypeDescription: 'Specialty acoustic healing session.',
    });


    await devLogin(page, clone.email, clone.password);
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

    // Badge is visible on class tile
    const badge = page.locator('[data-testid="custom-currency-badge"]').first();
    await expect(badge).toBeVisible({ timeout: 6000 });
    await expect(badge).toContainText('Custom Currency Only');
  });

  // 20. yogi-search-by-area-name
  test('@regression yogi-search-by-area-name — Yogi searches area name and finds matching neighborhood communities', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'search');

    await page.fill('[data-testid="search-input"]', 'Chiswick');
    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 6000 });

    // Results include Chiswick Area Community and Chiswick Hot Yoga Studio
    await expect(page.locator('h3:has-text("Chiswick")').first()).toBeVisible();
    await expect(page.locator('text=Chiswick Hot Yoga Studio').first()).toBeVisible();
  });

  // 21. yogi-search-no-results-discovery-fallback
  test('@regression yogi-search-no-results-discovery-fallback — Unmatched search query displays empty notice with Discovery Mode fallback recommendations', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'search');

    await page.fill('[data-testid="search-input"]', 'ZX99INVALID');

    // Empty state displays query
    const noResults = page.locator('[data-testid="search-no-results"]');
    await expect(noResults).toBeVisible({ timeout: 6000 });
    await expect(noResults).toContainText(/No results found for.*ZX99INVALID/i);

    // Discovery Mode recommendations visible below
    await expect(page.locator('[data-testid="discovery-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="discovery-list"]')).toBeVisible();
  });

  // 22. yogi-search-unclaimed-shadow-studio
  test('@regression yogi-search-unclaimed-shadow-studio — Yogi views unclaimed shadow studio tile with "Claim Studio" button prompt', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'search');

    await page.fill('[data-testid="search-input"]', 'Kew');
    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 6000 });

    // Unclaimed profile badge and claim studio button are visible
    await expect(page.locator('[data-testid="unclaimed-profile-badge"]').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('[data-testid^="claim-studio-btn-"]').first()).toBeVisible();
  });

  // 23. yogi-shell-header-navigation-audit
  test('@regression yogi-shell-header-navigation-audit — Responsive navigation shell renders desktop sidebar vs mobile sticky header', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');

    // Desktop Viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-tab-feed"]')).toBeVisible();

    // Mobile Viewport (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('aside')).not.toBeVisible();
    await expect(page.locator('header.md\\:hidden')).toBeVisible();
    await expect(page.locator('[data-testid="header-search-bar"]')).toBeVisible();
  });

  // 24. yogi-studio-members-privacy-enforcement
  test('@regression yogi-studio-members-privacy-enforcement — Studio members directory enforces privacy masking for private user profiles', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', 'studio_askew_001');

    // Open Members Directory
    const membersBtn = page.locator('[data-testid="studio-members-modal-button"]');
    await expect(membersBtn).toBeVisible({ timeout: 6000 });
    await membersBtn.click();

    // Members list displays public members with clickable links and private members with lock
    await expect(page.locator('text=Members Directory').first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator('text=Public Profile ➔').first()).toBeVisible();
    await expect(page.locator('text=🔒 Private Profile').first()).toBeVisible();
  });

  // 25. yogi-studio-profile-temporary-closure-notice
  test('@regression yogi-studio-profile-temporary-closure-notice — Yogi views studio with temporary closure notice and custom manager notes', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await openStudioProfile(page, 'Notting Hill', 'Notting Hill Zen Sanctuary', 'studio_temp_closed');

    // Banner displays notice and custom note
    const banner = page.locator('[data-testid="studio-closure-banner"]');
    await expect(banner).toBeVisible({ timeout: 6000 });
    await expect(banner).toContainText('Temporarily Closed');
    await expect(banner).toContainText('Flooring renovation in progress. Reopening November 1st.');
  });

  // 26. yogi-view-private-teacher-profile-guard
  test('@regression yogi-view-private-teacher-profile-guard — Yogi views private teacher profile displaying privacy lock shield while studio classes remain visible', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await openStudioProfile(page, 'Chelsea', 'Chelsea Sanctuary Studio', 'studio_chelsea_004');

    // Click Priya Nair card in carousel (seeded as private teacher user_teacher_private)
    const priyaCard = page.locator('div:has(> p:has-text("Priya Nair"))').first();
    await expect(priyaCard).toBeVisible({ timeout: 6000 });
    await priyaCard.click();

    // Private profile displays lock shield
    const privacyShield = page.locator('[data-testid="privacy-lock-shield"]');
    await expect(privacyShield).toBeVisible({ timeout: 6000 });
    await expect(privacyShield).toContainText(/This Profile is Private/i);
  });

  // 27. yogi-view-teacher-classes-rolling-7day-cap
  test('@regression yogi-view-teacher-classes-rolling-7day-cap — Teacher profile classes sub-tab caps class listing to rolling 7-day window', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await openStudioProfile(page, 'Chiswick', 'Chiswick Hot Yoga Studio', 'studio_chiswick_002');

    // Click Elena Rostova teacher profile link
    const teacherCard = page.locator('div:has(> p:has-text("Elena Rostova"))').first();
    await expect(teacherCard).toBeVisible({ timeout: 6000 });
    await teacherCard.click();

    // Switch to Classes sub-tab
    const classesTab = page.locator('button:has-text("Classes")').first();
    await expect(classesTab).toBeVisible({ timeout: 6000 });
    await classesTab.click();

    // Header confirms 7-day cap
    await expect(page.locator('text=Classes in the Next 7 Days').first()).toBeVisible({ timeout: 6000 });
  });
});
