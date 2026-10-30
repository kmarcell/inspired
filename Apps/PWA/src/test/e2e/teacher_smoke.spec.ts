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

test.describe('Teacher Actor — P0 Smoke Scenarios', () => {

  // 1. teacher-carousel-link-opens-profile
  test('@smoke teacher-carousel-link-opens-profile — Tapping teacher card in studio carousel navigates to teacher UnifiedProfileView', async ({ page }) => {
    // Given Sarah views Maya Sharma card in studio carousel
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');
    await openStudioProfile(page, 'Shoreditch', 'Shoreditch Stillpoint Studio', 'studio_shoreditch_006');

    // Verify Teachers Carousel is rendered
    await expect(page.locator('text=Teachers at this Studio')).toBeVisible({ timeout: 5000 });
    const mayaCard = page.locator('div:has(> p:has-text("Maya Sharma"))').first();
    await expect(mayaCard).toBeVisible();

    // When she taps the card
    await mayaCard.click();

    // Then app navigates to Maya Sharma UnifiedProfileView
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🧘 Teacher')).toBeVisible();
    await expect(page.locator('text=SUBSCRIBERS')).toBeVisible();
    await expect(page.locator('text=POSTS')).toBeVisible();
  });

  // 2. teacher-filter-schedule-modal-by-studio
  test('@smoke teacher-filter-schedule-modal-by-studio — Filtering TeacherScheduleModal by studio location updates schedule and excludes other studios', async ({ page }) => {
    // Given modal is open with "All Studios" active
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    // Navigate to Maya's UnifiedProfileView
    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const viewPublicProfileBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await expect(viewPublicProfileBtn).toBeVisible({ timeout: 5000 });
    await viewPublicProfileBtn.click();

    // Open Classes tab
    const classesTab = page.locator('button:has-text("🧘 Classes")');
    await expect(classesTab).toBeVisible({ timeout: 5000 });
    await classesTab.click();

    // Tap Schedule button to open TeacherScheduleModal
    const scheduleBtn = page.locator('button:has-text("Schedule")');
    await expect(scheduleBtn).toBeVisible({ timeout: 5000 });
    await scheduleBtn.click();

    // Verify TeacherScheduleModal is open
    await expect(page.locator('text=Maya Sharma — Schedule')).toBeVisible({ timeout: 5000 });
    const allStudiosPill = page.locator('button:has-text("All Studios")');
    await expect(allStudiosPill).toBeVisible();

    // When user taps "Shoreditch Stillpoint Studio" filter pill
    const shoreditchPill = page.locator('button:has-text("Shoreditch Stillpoint Studio")');
    await expect(shoreditchPill).toBeVisible();
    await shoreditchPill.click();

    // Then only classes at Shoreditch are listed and classes at Askew and Ravenscourt are excluded
    const classCards = page.locator('[data-testid="teacher-schedule-card"]');
    await expect(classCards.first()).toBeVisible({ timeout: 5000 });
    await expect(classCards.first().locator('text=Shoreditch Stillpoint Studio')).toBeVisible();
    await expect(page.locator('[data-testid="teacher-schedule-card"]:has-text("Askew Road Zen Den")')).not.toBeVisible();
    await expect(page.locator('[data-testid="teacher-schedule-card"]:has-text("Ravenscourt Park Zen Pavilion")')).not.toBeVisible();
  });

  // 3. teacher-open-multistudio-schedule-modal
  test('@smoke teacher-open-multistudio-schedule-modal — Teacher opens TeacherScheduleModal calendar overlay across all partner studios', async ({ page }) => {
    // Given teacher taps "View Full Schedule"
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const viewPublicProfileBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await expect(viewPublicProfileBtn).toBeVisible({ timeout: 5000 });
    await viewPublicProfileBtn.click();

    const classesTab = page.locator('button:has-text("🧘 Classes")');
    await expect(classesTab).toBeVisible({ timeout: 5000 });
    await classesTab.click();

    const scheduleBtn = page.locator('button:has-text("Schedule")');
    await expect(scheduleBtn).toBeVisible({ timeout: 5000 });

    // When TeacherScheduleModal opens
    await scheduleBtn.click();

    // Then calendar header, week switcher, 7 day pills, and horizontal studio filter pills render
    await expect(page.locator('h3:has-text("Maya Sharma — Schedule")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Aug 31 – Sep 6, 2026')).toBeVisible();
    await expect(page.locator('text=MON').first()).toBeVisible();
    await expect(page.locator('text=TUE').first()).toBeVisible();
    await expect(page.locator('text=WED').first()).toBeVisible();
    await expect(page.locator('text=THU').first()).toBeVisible();
    await expect(page.locator('text=FRI').first()).toBeVisible();
    await expect(page.locator('text=SAT').first()).toBeVisible();
    await expect(page.locator('text=SUN').first()).toBeVisible();
    await expect(page.locator('button:has-text("All Studios")')).toBeVisible();
    await expect(page.locator('button:has-text("Shoreditch Stillpoint Studio")')).toBeVisible();
  });

  // 4. teacher-schedule-tile-link-opens-profile
  test('@smoke teacher-schedule-tile-link-opens-profile — Tapping underlined teacher link on studio schedule class row navigates to teacher profile', async ({ page }) => {
    // Given Sarah views class row with text "w/ Maya Sharma"
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');
    await openStudioProfile(page, 'Shoreditch', 'Shoreditch Stillpoint Studio', 'studio_shoreditch_006');

    // Locate the teacher link button within class row
    const teacherLink = page.locator('main button:has-text("Maya Sharma")').first();
    await expect(teacherLink).toBeVisible({ timeout: 5000 });

    // When she taps the underlined link "Maya Sharma"
    await teacherLink.click();

    // Then app navigates to Maya Sharma UnifiedProfileView
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=🧘 Teacher')).toBeVisible();
    await expect(page.locator('text=SUBSCRIBERS')).toBeVisible();
  });

  // 5. teacher-verify-carousel-presence-at-studio
  test('@smoke teacher-verify-carousel-presence-at-studio — Teacher appears in Teachers at this Studio carousel at partner studios without owning them', async ({ page }) => {
    // Given Sarah opens Shoreditch studio profile
    await loginAs(page, 'user_sarah@inspired.test', TEST_PASSWORD, 'Sarah');
    await openStudioProfile(page, 'Shoreditch', 'Shoreditch Stillpoint Studio', 'studio_shoreditch_006');

    // When she inspects "Teachers at this Studio" carousel
    const carouselSection = page.locator('div:has(> h3:has-text("Teachers at this Studio"))');
    await expect(carouselSection).toBeVisible({ timeout: 5000 });

    // Then Maya Sharma instructor card is visible with photo and name
    await expect(carouselSection.locator('text=Maya Sharma')).toBeVisible();
    await expect(carouselSection.locator('text=Vinyasa Flow')).toBeVisible();

    // And Omar Haddad does NOT appear as an instructor (non-teaching owner)
    await expect(carouselSection.locator('text=Omar Haddad')).not.toBeVisible();
  });

  // 6. teacher-view-my-studios-non-owner-boundary
  test('@smoke teacher-view-my-studios-non-owner-boundary — Freelance teacher accessing My Studios views zero ownership boundary without administrative controls', async ({ page }) => {
    // Given Maya opens navigation menu
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    // When she views studios navigation
    const studiosTab = page.locator('[data-testid="desktop-tab-studios"], button:has-text("My Studios")');
    await studiosTab.first().click();

    // Then notice "No independent studios registered" appears
    await expect(page.locator('text=No independent studios registered.')).toBeVisible({ timeout: 5000 });

    // And currency creation, timetable modification, and brand settings tabs are completely absent
    await expect(page.locator('button:has-text("Currencies")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Grant Pass")')).not.toBeVisible();
    await expect(page.locator('text=Create New Currency')).not.toBeVisible();
    await expect(page.locator('button:has-text("Manage Schedule")')).not.toBeVisible();
    await expect(page.locator('text=Brand Settings')).not.toBeVisible();
    await expect(page.locator('text=Company Settings')).not.toBeVisible();
  });

  // 7. teacher-view-own-profile-overview
  test('@smoke teacher-view-own-profile-overview — Teacher views personal profile overview, verified checkmark, handle, and 2-metric bar', async ({ page }) => {
    // Given Maya Sharma navigates to her profile
    await loginAs(page, 'user_teacher_001@inspired.test', TEST_PASSWORD, 'Maya');

    const profileTab = page.locator('[data-testid="desktop-tab-profile"], [data-testid="header-profile-button"]');
    await profileTab.first().click();

    const viewPublicProfileBtn = page.locator('[data-testid="view-public-profile-btn"]');
    await expect(viewPublicProfileBtn).toBeVisible({ timeout: 5000 });
    await viewPublicProfileBtn.click();

    // When profile loads
    // Then verified checkmark, handle "@maya_sharma#2026", "🧘 Teacher" badge, and bio render
    await expect(page.locator('h1:has-text("Maya Sharma")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('main').locator('text=✓').first()).toBeVisible();
    await expect(page.locator('main').locator('text=@yoga_maya#1001')).toBeVisible();
    await expect(page.locator('text=🧘 Teacher')).toBeVisible();
    await expect(page.locator('text=Certified Vinyasa teacher. Finding peace in movement.')).toBeVisible();

    // And 2-metric bar displays Subscribers and Posts counts
    await expect(page.locator('text=SUBSCRIBERS')).toBeVisible();
    await expect(page.locator('text=POSTS')).toBeVisible();
    await expect(page.locator('text=142')).toBeVisible();
  });
});
