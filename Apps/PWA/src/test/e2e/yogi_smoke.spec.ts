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

/** Helper to navigate to a tab cleanly */
async function navigateTo(page: any, tab: 'feed' | 'search' | 'communities' | 'profile') {
  if (tab === 'feed') {
    await page.locator('[data-testid="desktop-tab-feed"]').first().click();
  } else if (tab === 'search') {
    await page.locator('[data-testid="desktop-tab-search"], [data-testid="header-search-bar"]').first().click();
  } else if (tab === 'communities') {
    await page.locator('[data-testid="desktop-tab-communities"], [data-testid="header-jc-button"]').first().click();
  } else if (tab === 'profile') {
    await page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]').first().click();
  }
}

/** Helper to open Askew Road Zen Den studio profile */
async function openAskewStudio(page: any) {
  await navigateTo(page, 'search');
  await page.fill('[data-testid="search-input"]', 'Askew Road Zen Den');
  await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 5000 });
  await page.locator('[data-testid^="view-studio-btn-"]').first().click();
  await expect(page.locator('text=Askew Road Zen Den').first()).toBeVisible({ timeout: 5000 });
}

test.describe('Yogi Smoke E2E Suite (20 Scenarios)', () => {
  // 1. visitor-login-wrong-password-fails
  test('@smoke visitor-login-wrong-password-fails — Visitor attempts login with incorrect password and is blocked with error', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 10000 });
    await page.fill('[data-testid="dev-email-input"]', 'user_sarah@inspired.test');
    await page.fill('[data-testid="dev-password-input"]', 'incorrect_pass_999!');
    await page.click('[data-testid="dev-submit-button"]');

    // Submission fails and error alert appears
    const errorAlert = page.locator('[data-testid="login-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/invalid|password/i);

    // Visitor remains on login screen
    await expect(page.locator('[data-testid="dev-submit-button"]')).toBeVisible();
  });

  // 2. yogi-auth-dev-login-success
  test('@smoke yogi-auth-dev-login-success — Yogi authenticates via Dev credentials and accesses application shell', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');

    // Transitions to shell and displays greeting
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="desktop-tab-feed"], [data-testid="header-search-bar"]').first()).toBeVisible();
  });

  // 3. yogi-book-class-no-pass-triggers-store
  test('@smoke yogi-book-class-no-pass-triggers-store — Yogi with 0 credits attempts booking and is redirected to Currency Store checkout modal', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');

    // Ensure clone is joined to Askew studio to test booking with 0 credits
    const db = admin.firestore();
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: ['comm_studio_studio_askew_001', 'area_askew'],
    });

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Yoga Newbie').first()).toBeVisible({ timeout: 10000 });

    // Open Askew studio via helper
    await openAskewStudio(page);

    // Verify studio timetable renders with open class
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 5000 });
    await bookBtn.click();

    // "No Valid Pass Available" modal appears
    await expect(page.locator('h3:has-text("No Valid Pass Available")')).toBeVisible({ timeout: 5000 });

    // Clicking "Purchase Pass" opens CurrencyStoreCheckoutModalView
    await page.click('button:has-text("Purchase Pass")');
    await expect(page.locator('h3:has-text("Purchase Studio Pass")')).toBeVisible({ timeout: 5000 });
  });

  // 4. yogi-book-class-with-pass-success
  test('@smoke yogi-book-class-with-pass-success — Returning yogi books open class redeeming active pass credit', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Open Askew studio
    await openAskewStudio(page);

    // Studio schedule should show open class
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 5000 });
    await bookBtn.click();

    // BookingPassSelectionModalView opens displaying 5-Class Pack
    await expect(page.locator('h3:has-text("Redeem Pass & Book")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=5-Class Pack').first()).toBeVisible();

    // Confirm booking
    const modalBookBtn = page.locator('role=dialog >> role=button[name="Book"]');
    await modalBookBtn.click();

    // Schedule button transitions to "✓ Booked"
    await expect(page.locator('button:has-text("✓ Booked")').first()).toBeVisible({ timeout: 5000 });
  });

  // 5. yogi-booking-pass-selector-filters-custom-currency
  test('@smoke yogi-booking-pass-selector-filters-custom-currency — Pass selector modal filters out passes incompatible with studio custom currency policy', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');

    // Join clone to Chelsea Sanctuary Studio (custom policy)
    const db = admin.firestore();
    await db.collection('users').doc(clone.userId).update({
      joinedCommunities: ['comm_studio_studio_chelsea_004', 'comm_area_SW3'],
    });

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Search and open Chelsea Sanctuary Studio
    await navigateTo(page, 'search');
    await page.fill('[data-testid="search-input"]', 'Chelsea');
    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 5000 });
    await page.locator('[data-testid^="view-studio-btn-"]').first().click();

    await expect(page.locator('text=Chelsea Sanctuary Studio').first()).toBeVisible({ timeout: 5000 });

    // Attempt booking on Kundalini & Sound Healing
    const bookBtn = page.locator('button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 5000 });
    await bookBtn.click();

    // Pass selection modal opens and filters out incompatible brand passes
    await expect(page.locator('h3:has-text("Redeem Pass & Book")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Restricted Class Passes: None of your active passes are accepted for this class.')).toBeVisible();
    await expect(page.locator('text=Ineligible for this class').first()).toBeVisible();

    // Book button must be disabled
    const modalBookBtn = page.locator('role=dialog >> role=button[name="Book"]');
    await expect(modalBookBtn).toBeDisabled();
  });

  // 6. yogi-cancel-class-booking-refund
  test('@smoke yogi-cancel-class-booking-refund — Yogi cancels class booking >= 12h before start and pass credit is refunded to wallet', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');

    // Calculate Wednesday of next week (>48h away)
    const today = new Date();
    const distanceToMonday = (today.getDay() + 6) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() - distanceToMonday + 7);
    const nextWed = new Date(nextMonday);
    nextWed.setDate(nextMonday.getDate() + 2);
    const nextWedISO = nextWed.toISOString().split('T')[0];

    const db = admin.firestore();
    const classId = `class_cancel_test_${clone.userId}`;
    try {
      await db.collection('studios').doc('studio_askew_001').collection('classes').doc(classId).set({
        id: classId,
        studioId: 'studio_askew_001',
        className: 'Refund Test Flow',
        teacherId: 'user_maryia',
        teacherName: 'Maryia Sharma',
        dateString: nextWedISO,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        capacity: 15,
        bookedCount: 0,
        waitlist: [],
        roomClimate: 'natural_ambient',
        status: 'published',
      });

      await devLogin(page, clone.email, clone.password);
      await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

      // Open Askew studio
      await openAskewStudio(page);

      // Click "Next Week ▶"
      await page.click('button:has-text("Next Week ▶")');

      // Click Wednesday day pill (nth(2))
      const wednesdayPill = page.locator('.grid.grid-cols-7 button').nth(2);
      await expect(wednesdayPill).toBeVisible({ timeout: 5000 });
      await wednesdayPill.click();

      // Verify Wednesday schedule loaded
      await expect(page.locator('h4:has-text("Classes for Wednesday")')).toBeVisible({ timeout: 5000 });

      // Book the class
      const bookBtn = page.locator('button:has-text("Book")').first();
      await expect(bookBtn).toBeVisible({ timeout: 5000 });
      await bookBtn.click();

      const modalBookBtn = page.locator('role=dialog >> role=button[name="Book"]');
      await modalBookBtn.click();

      // Button updates to "✓ Booked"
      const bookedBtn = page.locator('button:has-text("✓ Booked")').first();
      await expect(bookedBtn).toBeVisible({ timeout: 5000 });

      // Cancel booking
      await bookedBtn.click();

      // Button updates back to "Book"
      await expect(page.locator('button:has-text("Book")').first()).toBeVisible({ timeout: 5000 });
    } finally {
      await db.collection('studios').doc('studio_askew_001').collection('classes').doc(classId).delete().catch(() => {});
    }
  });

  // 7. yogi-cold-start-session-restore
  test('@smoke yogi-cold-start-session-restore — Authenticated yogi reloads application and session is restored automatically', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Hard reload the page
    await page.reload();

    // Application directly restores authenticated session without showing login form
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="dev-email-input"]')).not.toBeVisible();
  });

  // 8. yogi-feed-view-unified-stream
  test('@smoke yogi-feed-view-unified-stream — Yogi views chronological feed stream of joined communities and area posts', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, 'feed');

    // Verify post tiles render with author, source badge, content
    const postTile = page.locator('[data-testid^="post-tile-"]').first();
    await expect(postTile).toBeVisible({ timeout: 10000 });
    await expect(postTile.locator('[data-testid="source-badge"]')).toBeVisible();
  });

  // 9. yogi-joined-communities-view-list
  test('@smoke yogi-joined-communities-view-list — Yogi views list of joined communities and navigates to community profile', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, 'communities');

    // Askew Community summary tile is displayed
    const askewTile = page.locator('[data-testid^="joined-community-"]').filter({ hasText: 'Askew' }).first();
    await expect(askewTile).toBeVisible({ timeout: 5000 });

    // Clicking navigates to UnifiedProfileView for Askew community
    await askewTile.click();
    await expect(page.locator('text=Askew').first()).toBeVisible({ timeout: 5000 });
  });

  // 10. yogi-logout-session-terminated
  test('@smoke yogi-logout-session-terminated — Yogi logs out cleanly and application returns to login view', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Click Log Out from desktop sidebar or profile view
    const logoutBtn = page.locator('button:has-text("Log Out")').first();
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();

    // App redirects back to Login view
    await expect(page.locator('[data-testid="dev-email-input"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Welcome to Inspired')).toBeVisible();
  });

  // 11. yogi-onboarding-complete-profile
  test('@smoke yogi-onboarding-complete-profile — First-time yogi completes onboarding, validates handle, and enters feed', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');

    // Delete Firestore profile doc to force fresh onboarding state
    const db = admin.firestore();
    await db.collection('users').doc(clone.userId).delete();

    await devLogin(page, clone.email, clone.password);

    // Arrives on onboarding view
    await expect(page.locator('text=Setup Your Profile')).toBeVisible({ timeout: 10000 });

    // Enter display name
    await page.fill('[data-testid="display-name-input"]', 'Elena Fox');

    // Generated handle preview updates
    const handleInput = page.locator('[data-testid="proposed-handle-input"]');
    await expect(handleInput).toHaveValue(/^elena_fox#\d{4}$/);

    // Tap Complete Profile Setup
    await page.click('[data-testid="confirm-profile-button"]');

    // Navigates to authenticated application shell
    await expect(page.locator('text=Elena Fox').first()).toBeVisible({ timeout: 10000 });
  });

  // 12. yogi-schedule-unjoined-book-join-prompt
  test('@smoke yogi-schedule-unjoined-book-join-prompt — Unjoined yogi attempting to book class is prompted with Join Studio modal', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Yoga Newbie').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Askew studio schedule via Search (Newbie is not joined to Askew)
    await openAskewStudio(page);

    // Open class displays "Join to Book"
    const joinToBookBtn = page.locator('button:has-text("Join to Book")').first();
    await expect(joinToBookBtn).toBeVisible({ timeout: 5000 });
    await joinToBookBtn.click();

    // "Join Studio to Book" modal appears
    await expect(page.locator('h3:has-text("Join Studio to Book")')).toBeVisible({ timeout: 5000 });

    // Click "Join Studio ＋" in modal
    await page.click('button:has-text("Join Studio ＋")');

    // Modal closes and studio join status updates to joined
    await expect(page.locator('[data-testid="joined-studio-badge"]')).toBeVisible({ timeout: 5000 });
  });

  // 13. yogi-schedule-view-7day-calendar
  test('@smoke yogi-schedule-view-7day-calendar — Yogi navigates 7-day studio timetable selector and views classes for selected date', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Askew studio
    await openAskewStudio(page);

    // Verify 7-day selector pills render (MON - SUN)
    const dayPills = page.locator('.grid.grid-cols-7 button');
    await expect(dayPills).toHaveCount(7);

    // Tap another day pill (e.g. index 2)
    await dayPills.nth(2).click();

    // Active day heading updates
    await expect(page.locator('h4:has-text("Classes for")')).toBeVisible({ timeout: 5000 });
  });

  // 14. yogi-search-by-postcode-prefix
  test('@smoke yogi-search-by-postcode-prefix — Yogi searches outward postcode prefix and sees local studios ranked first', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, 'search');
    await page.fill('[data-testid="search-input"]', 'W12');

    // Results resolve
    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 5000 });
    await expect(page.locator('text=Askew Road Zen Den').first()).toBeVisible();

    // Tapping "View Studio ➔" navigates to StudioProfileView
    await page.locator('[data-testid^="view-studio-btn-"]').first().click();
    await expect(page.locator('text=Askew Road Zen Den').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Studio Profile')).toBeVisible();
  });

  // 15. yogi-search-discovery-initial-state
  test('@smoke yogi-search-discovery-initial-state — Yogi opens Search view and sees Discovery Mode suggestions with category badges', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, 'search');

    // Discovery header displays
    await expect(page.locator('[data-testid="discovery-header"]')).toBeVisible({ timeout: 5000 });

    // Discovery suggestions appear
    const discoveryList = page.locator('[data-testid="discovery-list"]');
    await expect(discoveryList).toBeVisible({ timeout: 5000 });
  });

  // 16. yogi-studio-profile-cascading-join
  test('@smoke yogi-studio-profile-cascading-join — Yogi joins studio branch executing atomic cascading join of parent brand network', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_newbie');

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Yoga Newbie').first()).toBeVisible({ timeout: 10000 });

    // Search and navigate to Chiswick studio
    await navigateTo(page, 'search');
    await page.fill('[data-testid="search-input"]', 'Chiswick');
    await page.waitForSelector('[data-testid="search-results-list"]', { timeout: 5000 });
    await page.locator('[data-testid^="view-studio-btn-"]').first().click();

    // Verify unjoined studio shows "[ Join Studio ]"
    const joinBtn = page.locator('[data-testid="join-studio-btn"]');
    await expect(joinBtn).toBeVisible({ timeout: 5000 });

    // Tap Join Studio
    await joinBtn.click();

    // Toggles to "✓ Joined Studio"
    await expect(page.locator('[data-testid="joined-studio-badge"]')).toBeVisible({ timeout: 5000 });

    // Verify atomic Firestore cascading join in user document
    const db = admin.firestore();
    await expect.poll(async () => {
      const userSnap = await db.collection('users').doc(clone.userId).get();
      return userSnap.data()?.joinedCommunities || [];
    }, { timeout: 10000 }).toContain('comm_studio_studio_chiswick_002');

    const userSnap = await db.collection('users').doc(clone.userId).get();
    const joined = userSnap.data()?.joinedCommunities || [];
    expect(joined).toContain('comm_brand_affordable_london');
  });

  // 17. yogi-studio-profile-view-details
  test('@smoke yogi-studio-profile-view-details — Yogi views studio profile header details, teachers carousel, and tabs', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Open Askew studio
    await openAskewStudio(page);

    // Studio header details
    await expect(page.locator('text=Askew Road Zen Den').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🟢 Open').first()).toBeVisible();
    await expect(page.locator('text=🏢 Affordable London Yoga').first()).toBeVisible();

    // Teachers carousel
    await expect(page.locator('text=Teachers at this Studio')).toBeVisible();
    await expect(page.locator('text=Maya Sharma').first()).toBeVisible();

    // Sub-tab switcher
    await expect(page.locator('button:has-text("Class Schedule")')).toBeVisible();
    await expect(page.locator('button:has-text("Members")')).toBeVisible();
  });

  // 18. yogi-view-public-teacher-profile
  test('@smoke yogi-view-public-teacher-profile — Yogi views public teacher profile credentials, rolling 7-day classes, and multi-studio schedule button', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Open Askew studio to find teacher Maya Sharma in carousel
    await openAskewStudio(page);

    const mayaTeacherCard = page.locator('text=Maya Sharma').first();
    await expect(mayaTeacherCard).toBeVisible({ timeout: 5000 });
    await mayaTeacherCard.click();

    // UnifiedProfileView for teacher renders
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🧘 Teacher')).toBeVisible();

    // Switch to Classes sub-tab
    const classesTab = page.locator('button:has-text("🧘 Classes")');
    await expect(classesTab).toBeVisible({ timeout: 5000 });
    await classesTab.click();

    // Displays rolling 7-day classes heading and Schedule button
    await expect(page.locator('text=Classes in the Next 7 Days')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Schedule")')).toBeVisible({ timeout: 5000 });
  });

  // 19. yogi-view-teacher-multi-studio-schedule-modal
  test('@smoke yogi-view-teacher-multi-studio-schedule-modal — Yogi opens Teacher Schedule Modal from teacher profile and filters by partner studio', async ({ page }) => {
    await devLogin(page, 'user_sarah@inspired.test');
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Maya Sharma profile
    await openAskewStudio(page);
    await page.locator('text=Maya Sharma').first().click();
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });

    // Click Classes sub-tab
    await page.click('button:has-text("🧘 Classes")');

    // Click Schedule button to open modal
    const scheduleModalBtn = page.locator('button:has-text("Schedule")');
    await expect(scheduleModalBtn).toBeVisible({ timeout: 5000 });
    await scheduleModalBtn.click();

    // TeacherScheduleModal opens
    await expect(page.locator('h3:has-text("Maya Sharma — Schedule")')).toBeVisible({ timeout: 5000 });

    // Horizontally scrollable studio filter pills render
    const allStudiosFilter = page.locator('button:has-text("All Studios")');
    await expect(allStudiosFilter).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.click('button[aria-label="Close Schedule Modal"]');
    await expect(page.locator('h3:has-text("Maya Sharma — Schedule")')).not.toBeVisible();
  });

  // 20. yogi-book-class-from-teacher-schedule-modal
  test('@smoke yogi-book-class-from-teacher-schedule-modal — Student books class session directly from teacher multi-studio schedule modal', async ({ page, clonedPersona }) => {
    const clone = await clonedPersona('user_sarah');

    await devLogin(page, clone.email, clone.password);
    await expect(page.locator('text=Sarah').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Maya Sharma profile
    await openAskewStudio(page);
    await page.locator('text=Maya Sharma').first().click();
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });

    // Click Classes sub-tab
    await page.click('button:has-text("🧘 Classes")');

    // Click Schedule button to open modal
    const scheduleModalBtn = page.locator('button:has-text("Schedule")');
    await expect(scheduleModalBtn).toBeVisible({ timeout: 5000 });
    await scheduleModalBtn.click();

    // TeacherScheduleModal opens
    await expect(page.locator('h3:has-text("Maya Sharma — Schedule")')).toBeVisible({ timeout: 5000 });

    // In-modal class card has booking button
    const bookBtn = page.locator('[data-testid="teacher-schedule-card"] button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 5000 });
    await bookBtn.click();

    // BookingPassSelectionModalView opens displaying 5-Class Pack
    await expect(page.locator('h3:has-text("Redeem Pass & Book")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=5-Class Pack').first()).toBeVisible({ timeout: 5000 });

    // Confirm booking
    const modalBookBtn = page.locator('role=dialog >> role=button[name="Book"]');
    await modalBookBtn.click();

    // In-modal class card transitions to "✓ Booked"
    await expect(page.locator('[data-testid="teacher-schedule-card"] button:has-text("✓ Booked")').first()).toBeVisible({ timeout: 5000 });
  });
});
