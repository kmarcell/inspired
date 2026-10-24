import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or local Apps/PWA directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'local_secure_password_123';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

const TEST_ACCOUNTS = [
  { id: 'user_sarah', email: 'user_sarah@inspired.test', name: 'Sarah Jenkins', role: 'Active Yogi / Student (Active Pass Wallet)' },
  { id: 'user_newbie', email: 'user_newbie@inspired.test', name: 'Yoga Newbie', role: 'Clean Slate Yogi (Zero State)' },
  { id: 'user_teacher_001', email: 'user_teacher_001@inspired.test', name: 'Maya Sharma', role: 'Freelance Teacher (No Studio)' },
  { id: 'user_david_kim', email: 'user_david_kim@inspired.test', name: 'David Kim', role: 'Independent Studio Owner (No Currencies Setup)' },
  { id: 'user_sophia_vane', email: 'user_sophia_vane@inspired.test', name: 'Sophia Vane', role: 'Independent Studio Owner (Custom Currencies Setup)' },
  { id: 'user_elena', email: 'user_elena@inspired.test', name: 'Elena Rostova', role: 'Teacher + Brand Branch Studio Owner (Follow Brand Policy)' },
  { id: 'user_brand_founder', email: 'user_brand_founder@inspired.test', name: 'Marcus Vance', role: 'Brand Founder (Brand + Studio, Zero State)' },
  { id: 'user_maryia', email: 'user_maryia@inspired.test', name: 'Maryia Sharma', role: 'Feature-Complete Brand Founder & Studio Owner (Full Currencies, Schedule & Templates)' },
];

const suiteResults = {
  timestamp: new Date().toISOString(),
  totalAccounts: TEST_ACCOUNTS.length,
  accountResults: [],
  summary: {
    passed: 0,
    failed: 0,
    dataIntegrityIssuesFound: [],
    appBugsFound: [],
    verifiedFlows: []
  }
};

async function runSuite() {
  console.log('🚀 Starting Inspired PWA Automated UI Regression Suite...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using Test Password from .env: ${TEST_PASSWORD ? '[LOADED]' : '[MISSING]'}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const account of TEST_ACCOUNTS) {
      console.log(`\n==================================================`);
      console.log(`👤 Testing Account: ${account.name} (${account.email})`);
      console.log(`==================================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: 430, height: 932 });

      const accountResult = {
        account: account,
        loginSuccess: false,
        scenarios: {},
        issues: []
      };

      try {
        // Step 1: Navigate to App
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

        // Step 2: Type dev credentials & submit
        await page.waitForSelector('[data-testid="dev-email-input"]', { timeout: 8000 });
        await page.type('[data-testid="dev-email-input"]', account.email);
        await page.type('[data-testid="dev-password-input"]', TEST_PASSWORD);
        await page.click('[data-testid="dev-submit-button"]');

        // Allow 3.5s for Firebase Auth state to settle
        await page.evaluate(() => new Promise(r => setTimeout(r, 3500)));

        // Verify login success
        const isLoggedIn = await page.evaluate(() => {
          const profileBtn = document.querySelector('[data-testid="header-profile-button"]');
          const jcBtn = document.querySelector('[data-testid="header-jc-button"]');
          const desktopTab = document.querySelector('[data-testid="desktop-tab-profile"]');
          return !!(profileBtn || jcBtn || desktopTab);
        });

        if (!isLoggedIn) {
          const loginErr = await page.evaluate(() => {
            const errEl = document.querySelector('[data-testid="login-error"]');
            return errEl ? errEl.innerText : null;
          });
          throw new Error(loginErr ? `Login error: ${loginErr}` : 'Main shell did not render post-login.');
        }

        accountResult.loginSuccess = true;
        console.log(`  ✅ Login successful for ${account.name}`);
        suiteResults.summary.verifiedFlows.push(`Login authentication flow for ${account.name}`);

        // Step 3: Audit Communities Tab
        console.log(`  🔍 Auditing Communities Tab...`);
        const jcBtn = await page.$('[data-testid="header-jc-button"]');
        if (jcBtn) {
          await jcBtn.click();
          await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
        }

        const communityBodyText = await page.evaluate(() => document.body.innerText);

        accountResult.scenarios.communitiesTab = {
          hasText: communityBodyText.length > 50,
          rawSnippet: communityBodyText.substring(0, 150).replace(/\n/g, ' ')
        };

        if (account.id === 'user_sarah') {
          const hasAskew = communityBodyText.includes('Askew Road') || communityBodyText.includes('Askew');
          if (!hasAskew) {
            const msg = `[DATA_INTEGRITY] [MEDIUM] User Sarah Jenkins is present in studio_askew_001 members collection, but Askew Community tile is MISSING from her Joined Communities UI view.`;
            accountResult.issues.push(msg);
            suiteResults.summary.dataIntegrityIssuesFound.push(msg);
            console.log(`  ⚠️ ${msg}`);
          } else {
            console.log(`  ✅ Sarah's Askew Community correctly rendered in UI.`);
            suiteResults.summary.verifiedFlows.push(`Joined Communities view for Sarah Jenkins`);
          }
        }

        if (account.id === 'user_elena') {
          const hasChiswick = communityBodyText.includes('Chiswick');
          if (!hasChiswick) {
            const msg = `[DATA_INTEGRITY] [MEDIUM] User Elena Rostova is present in studio_chiswick_002 members collection, but Chiswick Community tile is MISSING from her Joined Communities UI view.`;
            accountResult.issues.push(msg);
            suiteResults.summary.dataIntegrityIssuesFound.push(msg);
            console.log(`  ⚠️ ${msg}`);
          } else {
            console.log(`  ✅ Elena's Chiswick Community correctly rendered in UI.`);
            suiteResults.summary.verifiedFlows.push(`Joined Communities view for Elena Rostova`);
          }
        }

        // Step 4: Audit Profile & Passes
        console.log(`  🔍 Auditing User Profile & Pass Wallet...`);
        const profileBtn = await page.$('[data-testid="header-profile-button"]');
        if (profileBtn) {
          await profileBtn.click();
          await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
        }

        const profileText = await page.evaluate(() => document.body.innerText);
        const nameFirstName = account.name.split(' ')[0];
        const rendersName = profileText.includes(nameFirstName);

        if (!rendersName) {
          const msg = `[APP_BUG] User profile header did not render expected name "${nameFirstName}".`;
          accountResult.issues.push(msg);
          suiteResults.summary.appBugsFound.push(msg);
          console.log(`  ❌ ${msg}`);
        } else {
          console.log(`  ✅ Profile header rendered correctly for ${account.name}`);
          suiteResults.summary.verifiedFlows.push(`Profile view rendering for ${account.name}`);
        }

        // Step 5: Check My Studios / Pricing Managers for Studio Owners
        const clickedStudios = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find(b => b.innerText.includes('My Studios'));
          if (target) {
            target.click();
            return true;
          }
          return false;
        });

        if (clickedStudios && (account.id === 'user_sarah' || account.id === 'user_maryia' || account.id === 'user_elena')) {
          console.log(`  🔍 Auditing My Studios & Pricing Managers...`);
          await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

          const studiosText = await page.evaluate(() => document.body.innerText);

          if (account.id === 'user_sarah') {
            const leaksBrandPricing = studiosText.includes('Drop-in') && studiosText.includes('7-day unlimited pass') && studiosText.includes('£90');
            if (leaksBrandPricing) {
              const msg = `[APP_BUG] [HIGH] Independent Studio (Askew Road) shows Brand Pricing ("Drop-in 1 Credits £15", "7-day unlimited pass £90") owned by Maryia Vane! Firestore rules & UI filters must restrict brand passes to parent brand branches.`;
              accountResult.issues.push(msg);
              suiteResults.summary.appBugsFound.push(msg);
              console.log(`  ❌ ${msg}`);
            } else {
              console.log(`  ✅ Independent Studio pricing isolation verified.`);
              suiteResults.summary.verifiedFlows.push(`Independent Studio pricing isolation for Askew Road`);
            }
          }
        }

        // Step 6: Log out
        console.log(`  🚪 Signing out...`);
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const signOut = btns.find(b => b.innerText.includes('Sign Out') || b.innerText.includes('Log Out'));
          if (signOut) signOut.click();
          else localStorage.clear();
        });
        await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

        suiteResults.summary.passed++;
      } catch (err) {
        console.error(`  ❌ Error testing account ${account.name}: ${err.message}`);
        accountResult.loginSuccess = false;
        accountResult.error = err.message;
        suiteResults.summary.failed++;
      } finally {
        await page.close();
      }

      suiteResults.accountResults.push(accountResult);
    }

    console.log('\n==================================================');
    console.log('📊 UI REGRESSION SUITE COMPLETED');
    console.log(`Passed Accounts: ${suiteResults.summary.passed} / ${TEST_ACCOUNTS.length}`);
    console.log(`Data Integrity Issues Identified: ${suiteResults.summary.dataIntegrityIssuesFound.length}`);
    console.log(`App Code Bugs Identified: ${suiteResults.summary.appBugsFound.length}`);
    console.log(`Verified Flow Scenarios: ${suiteResults.summary.verifiedFlows.length}`);
    console.log('==================================================\n');

  } finally {
    await browser.close();
  }

  return suiteResults;
}

runSuite().then((results) => {
  console.log('RESULTS_JSON_START');
  console.log(JSON.stringify(results, null, 2));
  console.log('RESULTS_JSON_END');
}).catch(err => {
  console.error('Fatal suite execution failure:', err);
  process.exit(1);
});
