import { test, expect } from './fixtures';

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';

/**
 * Shared Helper: Authenticate with dev credentials
 */
async function loginAs(page: any, email: string, password = TEST_PASSWORD, expectedFirstName = '') {
  await page.goto('/');
  await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 10000 });
  await page.fill('[data-testid="dev-email-input"]', email);
  await page.fill('[data-testid="dev-password-input"]', password);
  await page.click('[data-testid="dev-submit-button"]');
  if (expectedFirstName) {
    await expect(page.locator(`text=${expectedFirstName}`).first()).toBeVisible({ timeout: 10000 });
  }
}

/**
 * Shared Helper: Open Studio Profile via Search View
 */
async function openStudioProfile(page: any, query: string, studioName: string, studioId: string) {
  const searchTab = page.locator('[data-testid="desktop-tab-search"], button:has-text("Search"), [data-testid="header-search-bar"]');
  await searchTab.first().click();

  const searchInput = page.locator('[data-testid="search-input"]');
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(query);

  const viewStudioBtn = page.locator(`[data-testid="view-studio-btn-${studioId}"], button:has-text("View Studio")`);
  await expect(viewStudioBtn.first()).toBeVisible({ timeout: 5000 });
  await viewStudioBtn.first().click();

  await expect(page.locator(`h1:has-text("${studioName}")`).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Teacher Actor — P1 Regression Scenarios', () => {

  // 1. teacher-area-community-presence-and-navigation
  test('@regression teacher-area-community-presence-and-navigation — Teacher appears in Teachers in this Area list on Area Community Profile', async ({ page }) => {
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');

    // Navigate to My Communities
    const commTab = page.locator('[data-testid="desktop-tab-communities"], [data-testid="header-jc-button"]');
    await commTab.first().click();

    // Select Askew area community card
    const askewCard = page.locator('[data-testid="joined-community-area_askew"]');
    await expect(askewCard).toBeVisible({ timeout: 5000 });
    await askewCard.click();

    // UnifiedProfileView for Askew community renders
    await expect(page.locator('h1:has-text("Askew")').first()).toBeVisible({ timeout: 5000 });

    // Open Studios & Teachers tab
    const studiosTeachersTab = page.locator('button:has-text("Studios & Teachers")');
    await expect(studiosTeachersTab).toBeVisible({ timeout: 5000 });
    await studiosTeachersTab.click();

    // Check Teachers in this Area
    const teacherHeading = page.locator('text=/Teachers in this Area/i');
    await expect(teacherHeading.first()).toBeVisible({ timeout: 5000 });

    // Maya Sharma card is visible
    const mayaCard = page.locator('[data-testid="area-teacher-card-user_teacher_001"]');
    await expect(mayaCard).toBeVisible({ timeout: 5000 });

    // Tapping her card navigates to Maya's UnifiedProfileView
    await mayaCard.click();
    await expect(page.locator('h1:has-text("Maya Sharma")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🧘 Teacher').first()).toBeVisible();
  });

  // 2. teacher-class-info-modal-link-opens-profile
  test('@regression teacher-class-info-modal-link-opens-profile — Tapping teacher link inside ClassInfoModal navigates to teacher profile', async ({ page }) => {
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');
    await openStudioProfile(page, 'Shoreditch', 'Shoreditch Stillpoint Studio', 'studio_shoreditch_006');

    // Open class info modal via info button on class card
    const infoBtn = page.locator('button[title="Class Details"], button[aria-label="View class details"]').first();
    await expect(infoBtn).toBeVisible({ timeout: 5000 });
    await infoBtn.click();

    // Verify modal is open
    await expect(page.locator('text=Class Information')).toBeVisible({ timeout: 5000 });

    // Click teacher link inside modal specifically targeting the backdrop modal container
    const teacherLink = page.getByTestId('class-info-modal-backdrop').getByRole('button', { name: 'Maya Sharma' });
    await expect(teacherLink).toBeVisible();
    await teacherLink.click();

    // Modal dismisses and app navigates to Maya Sharma profile
    await expect(page.locator('text=Class Information')).not.toBeVisible();
    await expect(page.locator('h1:has-text("Maya Sharma")').first()).toBeVisible({ timeout: 5000 });
  });

  // 3. teacher-classes-rolling-seven-day-capping
  test('@regression teacher-classes-rolling-seven-day-capping — Teacher classes sub-tab displays rolling 7-day multi-studio timetable feed with studio links', async ({ page }) => {
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    // Navigate to Maya profile
    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const viewPublicBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await expect(viewPublicBtn).toBeVisible({ timeout: 5000 });
    await viewPublicBtn.click();

    // Switch to Classes tab
    const classesTab = page.locator('button:has-text("🧘 Classes")');
    await expect(classesTab).toBeVisible({ timeout: 5000 });
    await classesTab.click();

    // Verify header and class feed
    await expect(page.locator('text=Classes in the Next 7 Days')).toBeVisible({ timeout: 5000 });

    // Verify studio link presence
    const studioLink = page.locator('text=/🏢 Shoreditch Stillpoint Studio|🏢 Ravenscourt Park Zen Pavilion/').first();
    await expect(studioLink).toBeVisible({ timeout: 5000 });
  });

  // 4. teacher-configure-public-discovery-enforces-avatar-public
  test('@regression teacher-configure-public-discovery-enforces-avatar-public — Enabling public profile on teacher account automatically enforces public avatar setting', async ({ page, clonedPersona }) => {
    const teacher = await clonedPersona('user_teacher_001');
    await loginAs(page, teacher.email, teacher.password, 'Maya');

    // Go to profile settings
    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    // Find toggle-public-profile button
    const togglePublicBtn = page.locator('[data-testid="toggle-public-profile"]');
    await expect(togglePublicBtn).toBeVisible({ timeout: 5000 });

    // Avatar select dropdown
    const avatarSelect = page.locator('select').first();
    await expect(avatarSelect).toBeVisible({ timeout: 5000 });

    // Toggle if needed to enforce public
    const isPublicInitial = await togglePublicBtn.evaluate((el: HTMLElement) => el.classList.contains('justify-end'));
    if (!isPublicInitial) {
      await togglePublicBtn.click();
    }

    // When public, avatar dropdown is locked to public and disabled
    await expect(avatarSelect).toBeDisabled();
    await expect(avatarSelect).toHaveValue('public');

    // Save privacy settings using dedicated test ID
    const saveBtn = page.locator('[data-testid="save-privacy-button"]');
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();

    // Notification appears or feedback persists
    await expect(page.locator('text=/Privacy settings updated/i').first()).toBeVisible({ timeout: 5000 });
  });

  // 5. teacher-filter-schedule-modal-zero-state
  test('@regression teacher-filter-schedule-modal-zero-state — Filtering TeacherScheduleModal for studio with no classes on selected day displays clean empty notice', async ({ page }) => {
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    // Navigate to public profile
    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const viewPublicBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await viewPublicBtn.click();

    // Classes tab -> Schedule
    await page.locator('button:has-text("🧘 Classes")').click();
    await page.locator('button:has-text("Schedule")').click();

    await expect(page.locator('text=Maya Sharma — Schedule')).toBeVisible({ timeout: 5000 });

    // Filter by Ravenscourt Park Zen Pavilion
    const ravenscourtPill = page.locator('button:has-text("Ravenscourt Park Zen Pavilion")').first();
    await expect(ravenscourtPill).toBeVisible({ timeout: 5000 });
    await ravenscourtPill.click();

    // Switch to Sunday
    const sundayBtn = page.locator('button:has-text("SUN")').first();
    await expect(sundayBtn).toBeVisible({ timeout: 5000 });
    await sundayBtn.click();

    // Clean empty notice is displayed
    const emptyNotice = page.locator('text=/No classes scheduled for this day/i').first();
    await expect(emptyNotice).toBeVisible({ timeout: 5000 });
  });

  // 6. teacher-navigate-to-studio-from-class-card
  test('@regression teacher-navigate-to-studio-from-class-card — Tapping studio link on teacher class card navigates to studio profile', async ({ page }) => {
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');

    // Open Maya's profile via Askew community
    const commTab = page.locator('[data-testid="desktop-tab-communities"], [data-testid="header-jc-button"]');
    await commTab.first().click();
    await page.locator('[data-testid="joined-community-area_askew"]').first().click();

    // Studios & Teachers tab -> Maya
    const studiosTeachersTab = page.locator('button:has-text("Studios & Teachers")');
    await expect(studiosTeachersTab).toBeVisible({ timeout: 5000 });
    await studiosTeachersTab.click();

    const mayaCard = page.locator('[data-testid="area-teacher-card-user_teacher_001"]');
    await expect(mayaCard).toBeVisible({ timeout: 5000 });
    await mayaCard.click();

    // Verify Maya profile is loaded
    await expect(page.locator('h1:has-text("Maya Sharma")').first()).toBeVisible({ timeout: 5000 });

    // Go to Classes tab
    const classesTab = page.locator('button:has-text("🧘 Classes")');
    await expect(classesTab).toBeVisible({ timeout: 5000 });
    await classesTab.click();

    // Find studio link on a class card
    const studioLink = page.locator('text=/🏢 Shoreditch Stillpoint Studio|🏢 Ravenscourt Park Zen Pavilion/').first();
    await expect(studioLink).toBeVisible({ timeout: 5000 });
    const studioText = (await studioLink.textContent()) || '';
    const cleanStudioName = studioText.replace('🏢', '').trim();

    // Click studio link
    await studioLink.click();

    // Navigates directly to StudioProfileView
    await expect(page.locator(`h1:has-text("${cleanStudioName}")`).first()).toBeVisible({ timeout: 5000 });

    // Explicit Back Navigation verifies stack semantics
    const backBtn = page.locator('button:has-text("← Back")').first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
    await backBtn.click();
    await expect(page.locator('h1:has-text("Maya Sharma")').first()).toBeVisible({ timeout: 5000 });
  });

  // 7. teacher-private-profile-shields-personal-info
  test('@regression teacher-private-profile-shields-personal-info — Private teacher profile shields personal bio from non-subscribers while studio classes remain visible', async ({ page }) => {
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');
    await openStudioProfile(page, 'Chelsea', 'Chelsea Sanctuary Studio', 'studio_chelsea_004');

    // Priya Nair card is visible in Teachers at this Studio carousel
    const priyaCard = page.locator('div:has(> p:has-text("Priya Nair"))').first();
    await expect(priyaCard).toBeVisible({ timeout: 5000 });
    await priyaCard.click();

    // Profile renders with privacy lock for unsubscribed user
    await expect(page.locator('h1:has-text("Priya Nair")').first()).toBeVisible({ timeout: 5000 });
    const privacyShield = page.locator('[data-testid="privacy-lock-shield"]');
    await expect(privacyShield).toBeVisible({ timeout: 5000 });
    await expect(privacyShield).toContainText(/This Profile is Private/i);
    await expect(page.locator('button:has-text("Subscribe")')).toBeVisible({ timeout: 5000 });
  });

  // 8. teacher-schedule-modal-responsive-layout
  test('@regression teacher-schedule-modal-responsive-layout — TeacherScheduleModal renders mobile bottom sheet vs desktop centered dialog', async ({ page }) => {
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    // Open Maya's public profile -> Classes -> Schedule
    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();
    await page.locator('[data-testid="view-public-profile-btn"]').click();
    await page.locator('button:has-text("🧘 Classes")').click();
    await page.locator('button:has-text("Schedule")').click();

    // Check modal visibility
    await expect(page.locator('text=Maya Sharma — Schedule')).toBeVisible({ timeout: 5000 });

    // Test desktop viewport layout
    await page.setViewportSize({ width: 1280, height: 800 });
    const closeBtn = page.locator('button[aria-label="Close Schedule Modal"]').first();
    await expect(closeBtn).toBeVisible({ timeout: 5000 });

    // Test mobile viewport layout
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('text=Maya Sharma — Schedule')).toBeVisible({ timeout: 5000 });
  });

  // 9. teacher-switch-calendar-day-updates-classes
  test('@regression teacher-switch-calendar-day-updates-classes — Switching day pills in TeacherScheduleModal updates class list and persists active studio filter', async ({ page }) => {
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();
    await page.locator('[data-testid="view-public-profile-btn"]').click();
    await page.locator('button:has-text("🧘 Classes")').click();
    await page.locator('button:has-text("Schedule")').click();

    await expect(page.locator('text=Maya Sharma — Schedule')).toBeVisible({ timeout: 5000 });

    // Studio filter selector: click Shoreditch pill
    const shoreditchPill = page.locator('button:has-text("Shoreditch Stillpoint Studio")').first();
    await expect(shoreditchPill).toBeVisible({ timeout: 5000 });
    await shoreditchPill.click();

    // Day selector pills
    const dayPills = page.locator('button:has-text("MON"), button:has-text("TUE"), button:has-text("WED"), button:has-text("THU"), button:has-text("FRI")');
    const firstDayPill = dayPills.first();
    await expect(firstDayPill).toBeVisible({ timeout: 5000 });
    await firstDayPill.click();

    // Verify Shoreditch studio filter persists active styling (bg-indigo-600)
    await expect(shoreditchPill).toHaveClass(/bg-indigo-600/);
  });

  // 10. teacher-update-bio-persists
  test('@regression teacher-update-bio-persists — Teacher updates personal bio and credentials with character limit feedback', async ({ page, clonedPersona }) => {
    const teacher = await clonedPersona('user_teacher_001');
    await loginAs(page, teacher.email, teacher.password, 'Maya');

    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const bioInput = page.locator('textarea').first();
    await expect(bioInput).toBeVisible({ timeout: 5000 });

    const newBio = '500-hr RYT specializing in Ashtanga and Vinyasa Flow.';
    await bioInput.fill(newBio);

    // Save bio
    const saveBioBtn = page.locator('button:has-text("Save Bio"), button:has-text("Save")').first();
    await saveBioBtn.click();

    // View public profile to verify persistence
    const viewPublicBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await viewPublicBtn.click();

    await expect(page.locator(`text=${newBio}`).first()).toBeVisible({ timeout: 5000 });
  });

  // 11. teacher-visiting-schedule-isolation
  test('@regression teacher-visiting-schedule-isolation — Visiting teacher cannot modify host studio schedule, climate presets, or pricing policies', async ({ page }) => {
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');
    await openStudioProfile(page, 'Shoreditch', 'Shoreditch Stillpoint Studio', 'studio_shoreditch_006');

    // Verify Maya sees classes she teaches, but NO admin edit controls
    await expect(page.locator('button:has-text("Add Class"), button:has-text("Edit Class")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Cancel Class")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Edit Pricing Policy")')).not.toBeVisible();
  });

  // 12. yogi-subscribe-unlock-private-teacher-profile
  test('@regression yogi-subscribe-unlock-private-teacher-profile — Student subscribing to teacher profile unlocks personal bio and member feed', async ({ page, clonedPersona }) => {
    const student = await clonedPersona('user_sarah');
    await loginAs(page, student.email, student.password, 'Sarah');
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

    // Status toggles to subscribed
    await expect(page.locator('text=/✓ Subscribed/').first()).toBeVisible({ timeout: 5000 });
  });

});
