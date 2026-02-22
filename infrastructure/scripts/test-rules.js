const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function runTests() {
  const rules = fs.readFileSync('infrastructure/backend/firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: 'inspired-yoga-app-staging',
    firestore: {
      rules: rules,
      host: 'localhost',
      port: 8081,
    },
  });

  console.log('🧪 Starting Security Rules Validation...');

  // --- Scenario 1: Community Overlap ---
  const maya = testEnv.authenticatedContext('user_teacher_001', { joinedCommunities: ['area_askew'] });
  const jane = testEnv.authenticatedContext('user_student_001', { joinedCommunities: ['area_askew'] });

  // Seed Maya's profile
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('users').doc('user_teacher_001').set({
      id: 'user_teacher_001',
      username: 'yoga_maya#1001',
      joinedCommunities: ['area_askew'],
      privacySettings: { avatarPrivacy: 'groups-only' }
    });
  });

  console.log('✅ Case 1: Testing Community Overlap (Should SUCCEED)');
  await assertSucceeds(jane.firestore().collection('users').doc('user_teacher_001').get());

  // --- Scenario 2: No Overlap ---
  const outsider = testEnv.authenticatedContext('user_outsider', { joinedCommunities: ['area_chelsea'] });
  console.log('✅ Case 2: Testing No Community Overlap (Should FAIL)');
  await assertFails(outsider.firestore().collection('users').doc('user_teacher_001').get());

  // --- Scenario 3: Unauthenticated ---
  const guest = testEnv.unauthenticatedContext();
  console.log('✅ Case 3: Testing Unauthenticated Access (Should FAIL)');
  await assertFails(guest.firestore().collection('users').doc('user_teacher_001').get());

  console.log('🚀 All Security Rules Validated Successfully!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Validation Failed:', err);
  process.exit(1);
});
