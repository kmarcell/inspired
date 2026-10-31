import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';

/** Helper to authenticate in Dev Mode via credentials and wait for app shell */
async function loginAs(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 15000 });
  await page.fill('[data-testid="dev-email-input"]', email);
  await page.fill('[data-testid="dev-password-input"]', password);
  await page.click('[data-testid="dev-submit-button"]');
  await expect(
    page.locator('[data-testid="header-profile-button"], [data-testid="desktop-tab-studios"]').first()
  ).toBeVisible({ timeout: 15000 });
}

/** Helper to navigate between application tabs */
async function navigateTo(page: Page, tab: 'feed' | 'search' | 'communities' | 'profile' | 'studios') {
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

/** Helper to open a studio profile via Search */
async function openStudioProfile(page: Page, query: string, studioName: string, studioId: string) {
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

/** Helper to navigate to the "My Studios" view */
async function navigateToMyStudios(page: Page) {
  const desktopTab = page.locator('[data-testid="desktop-tab-studios"]');
  await expect(desktopTab).toBeVisible({ timeout: 15000 });
  await desktopTab.click();
  await expect(page.locator('text=My Brands & Studios').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Extended E2E Suite - Yogi (7 Scenarios)', () => {
  // 1. yogi-search-operating-status-badges
  test('@extended yogi-search-operating-status-badges — Search result studio tiles display accurate operating status badges', async ({
    page,
  }) => {
    await loginAs(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'search');

    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('studio');

    // Verify active studio displays Open badge
    const activeStudio = page.locator('[data-testid="search-result-item-studio_chelsea_004"]');
    await expect(activeStudio).toBeVisible({ timeout: 10000 });
    await expect(activeStudio.locator('[data-testid="studio-status-badge"]')).toContainText('Open');

    // Verify temporarily closed studio displays Temp Closed badge
    const tempClosedStudio = page.locator('[data-testid="search-result-item-studio_temp_closed"]');
    await expect(tempClosedStudio).toBeVisible({ timeout: 10000 });
    await expect(tempClosedStudio.locator('[data-testid="studio-status-badge"]')).toContainText('Temp Closed');
  });

  // 2. yogi-feed-post-like-toggle
  test('@extended yogi-feed-post-like-toggle — Yogi likes and unlikes a feed post updating like counter', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sarah');
    await loginAs(page, clone.email, clone.password);
    await navigateTo(page, 'feed');

    const likeBtn = page.locator('[data-testid^="like-button-"]').first();
    await expect(likeBtn).toBeVisible({ timeout: 10000 });

    const initialText = (await likeBtn.innerText()).trim();
    const initialCount = parseInt(initialText.replace(/\D/g, ''), 10) || 0;

    // Like post
    await likeBtn.click();
    await expect(likeBtn).toContainText(String(initialCount + 1));

    // Unlike post
    await likeBtn.click();
    await expect(likeBtn).toContainText(String(initialCount));
  });

  // 3. yogi-joined-communities-empty-state
  test('@extended yogi-joined-communities-empty-state — Clean-slate yogi with 0 communities views empty state with join recommendations', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_newbie');
    // Ensure clean slate with 0 joined communities in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [],
    });

    await loginAs(page, clone.email, clone.password);
    await navigateTo(page, 'communities');

    await expect(page.locator('[data-testid="empty-communities-container"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=No Joined Communities Yet')).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=You haven't joined any yoga communities yet")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid^="suggested-community-"]').first()).toBeVisible({ timeout: 5000 });
  });

  // 4. yogi-leave-class-waitlist
  test('@extended yogi-leave-class-waitlist — Yogi leaves class waitlist updating button back to Join Waitlist', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sarah');
    const db = admin.firestore();
    const studioId = clone.idMap['studio_askew_001'] || 'studio_askew_001';

    // Ensure clone is joined to Askew studio community
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: [`comm_studio_${studioId}`, 'comm_studio_studio_askew_001', 'area_askew'],
    });

    // Create or ensure full class exists for today
    const fullClassId = `class_full_leave_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await db.collection('studios').doc(studioId).collection('classes').doc(fullClassId).set({
        id: fullClassId,
        studioId,
        className: 'Waitlist Leave Mastery',
        dayOfWeek: (new Date().getDay() + 6) % 7,
        dateString: todayStr,
        startTime: '19:00',
        endTime: '20:15',
        capacity: 1,
        bookedCount: 1,
        waitlist: [],
        roomClimate: 'hot_studio',
        teacherId: 'user_david_kim',
        teacherName: 'David Kim',
      });

      await loginAs(page, clone.email, clone.password);
      await openStudioProfile(page, 'Askew', 'Askew Road Zen Den', studioId);

      // Tap Join Waitlist on full class
      const joinWaitlistBtn = page.locator('[data-testid="join-waitlist-button"]').first();
      await expect(joinWaitlistBtn).toBeVisible({ timeout: 10000 });
      await joinWaitlistBtn.click();

      // Button updates to # Waitlisted
      const waitlistedBtn = page.locator('button:has-text("# Waitlisted")').first();
      await expect(waitlistedBtn).toBeVisible({ timeout: 10000 });

      // Tap to leave waitlist
      await waitlistedBtn.click();

      // Button restores to Join Waitlist
      await expect(page.locator('[data-testid="join-waitlist-button"]').first()).toBeVisible({ timeout: 10000 });

      // Dual-layer verification: Firestore document state excludes user from waitlist
      await expect.poll(async () => {
        const snap = await db.collection('studios').doc(studioId).collection('classes').doc(fullClassId).get();
        const data = snap.data();
        return data?.waitlist || [];
      }).not.toContain(clone.userId);
    } finally {
      await db.collection('studios').doc(studioId).collection('classes').doc(fullClassId).delete();
    }
  });

  // 5. yogi-pass-wallet-view-empty-state
  test('@extended yogi-pass-wallet-view-empty-state — Yogi with no passes views clean empty state in Digital Pass Wallet', async ({
    page,
  }) => {
    await loginAs(page, 'user_newbie@inspired.test');
    await navigateTo(page, 'profile');

    const walletSection = page.locator('[data-testid="profile-wallet-section"]');
    await expect(walletSection).toBeVisible({ timeout: 10000 });
    await expect(walletSection.locator('text=No Active Passes Found')).toBeVisible({ timeout: 5000 });
    await expect(walletSection.locator("text=You don't hold any passes or credits yet")).toBeVisible({ timeout: 5000 });
  });

  // 6. yogi-profile-switch-theme
  test('@extended yogi-profile-switch-theme — Yogi toggles Light and Dark theme preference with immediate DOM class update', async ({
    page,
  }) => {
    await loginAs(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'profile');

    const themeToggle = page.locator('[data-testid="profile-theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Toggle theme
    await themeToggle.click();
    await expect.poll(async () => {
      return page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(!initialIsDark);

    // Toggle back to initial theme
    await themeToggle.click();
    await expect.poll(async () => {
      return page.evaluate(() => document.documentElement.classList.contains('dark'));
    }).toBe(initialIsDark);
  });

  // 7. yogi-profile-issue-reporting-link
  test('@extended yogi-profile-issue-reporting-link — Tapping Report an Issue generates pre-filled Google Form link with user ID', async ({
    page,
  }) => {
    await loginAs(page, 'user_sarah@inspired.test');
    await navigateTo(page, 'profile');

    const reportLink = page.locator('[data-testid="report-issue-link"]');
    await expect(reportLink).toBeVisible({ timeout: 10000 });

    const href = await reportLink.getAttribute('href');
    expect(href).toContain('docs.google.com/forms');
    expect(href).toContain('entry.');
    expect(href).toContain('user_sarah');
    expect(await reportLink.getAttribute('target')).toBe('_blank');
    expect(await reportLink.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

test.describe('Extended E2E Suite - Teacher (1 Scenario)', () => {
  // 8. yogi-unsubscribe-from-teacher
  test('@extended yogi-unsubscribe-from-teacher — Student cleanly unsubscribes from teacher via profile ellipsis menu', async ({
    page,
    clonedPersona,
  }) => {
    const student = await clonedPersona('user_sarah');
    await loginAs(page, student.email, student.password);
    await openStudioProfile(page, 'Chelsea', 'Chelsea Sanctuary Studio', 'studio_chelsea_004');

    // Click Priya Nair card in carousel
    const priyaCard = page.locator('div:has(> p:has-text("Priya Nair"))').first();
    await expect(priyaCard).toBeVisible({ timeout: 5000 });
    await priyaCard.click();

    await expect(page.locator('h1:has-text("Priya Nair")').first()).toBeVisible({ timeout: 5000 });

    // Tap Subscribe button
    const subscribeBtn = page.locator('button:has-text("Subscribe"), button:has-text("＋ Subscribe to Unlock Feed")').first();
    await expect(subscribeBtn).toBeVisible({ timeout: 5000 });
    await subscribeBtn.click();

    // Status updates to Subscribed
    await expect(page.locator('text=/✓ Subscribed/').first()).toBeVisible({ timeout: 5000 });

    // Open options dropdown menu
    const menuTrigger = page.locator('[data-testid="profile-menu-trigger"]');
    await expect(menuTrigger).toBeVisible({ timeout: 5000 });
    await menuTrigger.click();

    // Tap Unsubscribe
    const unsubscribeBtn = page.locator('[data-testid="leave-community-btn"]');
    await expect(unsubscribeBtn).toBeVisible({ timeout: 5000 });
    await unsubscribeBtn.click();

    // Verification: Button returns to Subscribe and private lock shield is restored
    await expect(page.locator('button:has-text("Subscribe"), button:has-text("＋ Subscribe to Unlock Feed")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="privacy-lock-shield"]')).toBeVisible({ timeout: 5000 });

    // Dual-layer verification: Firestore user document excludes teacher community
    const db = admin.firestore();
    await expect.poll(async () => {
      const snap = await db.collection('users').doc(student.userId).get();
      return (snap.data()?.joinedCommunities || []).some((id: string) => id.includes('priya'));
    }).toBe(false);
  });
});

test.describe('Extended E2E Suite - Studio Owner (3 Scenarios)', () => {
  // 9. studio-owner-discard-currency-changes-safeguard
  test('@extended studio-owner-discard-currency-changes-safeguard — Studio owner cancels in-progress currency edits and uncommitted modifications are discarded', async ({
    page,
  }) => {
    await loginAs(page, 'user_sophia_vane@inspired.test');
    await navigateToMyStudios(page);

    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-pricing"]');

    await expect(page.locator('text=Sanctuary Drop-in').first()).toBeVisible({ timeout: 10000 });

    // Open edit mode via unique testid
    const editBtn = page.locator('[data-testid="edit-currency-curr_chelsea_dropin"], [data-testid^="edit-currency-"]').last();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    const priceInput = page.locator('[data-testid="input-edit-currency-price"]');
    await expect(priceInput).toBeVisible({ timeout: 5000 });
    await priceInput.fill('99');

    // Discard changes
    await page.click('[data-testid="discard-currency-changes-btn"]');

    // Form closes and price remains unchanged
    await expect(priceInput).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=£22').first()).toBeVisible({ timeout: 5000 });
  });

  // 10. studio-owner-delete-class-draft
  test('@extended studio-owner-delete-class-draft — Studio owner deletes unwanted class draft with confirmation', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_sophia_vane');
    await loginAs(page, clone.email, clone.password);

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Studio")');
    await page.click('[data-testid="studio-tab-schedule"]');

    // Create a draft class first
    await page.click('button:has-text("Create New Class")');
    const draftTitle = `Draft To Delete ${Date.now()}`;
    await page.fill('#class-title-input', draftTitle);
    await page.click('[data-testid="save-draft-button"]');

    // Switch to Drafts tab
    await page.click('[data-testid="class-manager-tab-drafts"]');
    await expect(page.locator(`text=${draftTitle}`).first()).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog and delete
    page.once('dialog', (dialog) => dialog.accept());
    const draftCard = page.locator('div').filter({ hasText: draftTitle });
    await draftCard.locator('[data-testid^="delete-draft-btn-"], button[title="Delete Draft"]').last().click();

    // Verify draft is removed
    await expect(page.locator(`text=${draftTitle}`)).not.toBeVisible({ timeout: 10000 });
  });

  // 11. studio-owner-delete-class-template
  test('@extended studio-owner-delete-class-template — Studio owner deletes class template blueprint with confirmation dialog', async ({
    page,
    clonedPersona,
  }) => {
    const clone = await clonedPersona('user_maryia');
    await loginAs(page, clone.email, clone.password);

    await navigateToMyStudios(page);
    await page.click('button:has-text("Manage Brand & Currencies")');
    await page.click('button:has-text("Manage Location")');
    await page.click('[data-testid="studio-tab-schedule"]');

    // Create a brand template first with unique title
    await page.click('button:has-text("Create New Class")');
    const templateTitle = `Template To Delete ${Date.now()}`;
    await page.fill('#class-title-input', templateTitle);
    await page.click('button:has-text("Save as Template")');

    // Verify template blueprint saved and visible
    await expect(page.locator(`text=${templateTitle}`).first()).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog and delete the newly created template
    page.once('dialog', (dialog) => dialog.accept());
    const templateCard = page.locator('[data-testid^="template-card-"]').filter({ hasText: templateTitle });
    await templateCard.locator('button[title="Delete Template Blueprint"]').click();

    // Verify template is deleted
    await expect(page.locator(`text=${templateTitle}`)).not.toBeVisible({ timeout: 10000 });
  });
});
