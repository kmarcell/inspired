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

  console.log('🧪 Starting Privacy-First Security Rules Validation...');

  // Setup Maya (Public) and Jane (Private, Overlap with Maya) and Liam (Outsider)
  const mayaContext = testEnv.authenticatedContext('user_teacher_001', { joinedCommunities: ['area_askew'] });
  const janeContext = testEnv.authenticatedContext('user_student_001', { joinedCommunities: ['area_askew'] });
  const liamContext = testEnv.authenticatedContext('user_student_002', { joinedCommunities: ['area_chelsea'] });

  // Seed profiles
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    // Maya: Public Profile, Public Avatar
    await db.collection('users').doc('user_teacher_001').set({
      id: 'user_teacher_001',
      username: 'yoga_maya#1001',
      joinedCommunities: ['area_askew'],
      privacySettings: { isProfilePublic: true, avatarPrivacy: 'public' }
    });

    // Jane: Private Profile, Groups-Only Avatar
    await db.collection('users').doc('user_student_001').set({
      id: 'user_student_001',
      username: 'zen_explorer#2002',
      joinedCommunities: ['area_askew'],
      privacySettings: { isProfilePublic: false, avatarPrivacy: 'groups-only' }
    });
  });

  const dbJane = janeContext.firestore();
  const dbMaya = mayaContext.firestore();
  const dbLiam = liamContext.firestore();

  // --- Scenario 1: Public Profile Access ---
  console.log('✅ Case 1: Testing Public Profile Access (Should SUCCEEDS)');
  await assertSucceeds(dbJane.collection('users').doc('user_teacher_001').get());

  // --- Scenario 2: Private Profile Access (Overlap) ---
  console.log('✅ Case 2: Testing Private Profile Access with Community Overlap (Should FAIL)');
  await assertFails(dbMaya.collection('users').doc('user_student_001').get());

  // --- Scenario 3: Private Profile Access (Owner) ---
  console.log('✅ Case 3: Testing Private Profile Access as Owner (Should SUCCEED)');
  await assertSucceeds(dbJane.collection('users').doc('user_student_001').get());

  // --- Scenario 4: Write Constraint (Public Profile -> Public Avatar) ---
  console.log('✅ Case 4: Testing Write Constraint - Public Profile must have Public Avatar (Should FAIL)');
  await assertFails(dbJane.collection('users').doc('user_student_001').update({
    'privacySettings.isProfilePublic': true,
    'privacySettings.avatarPrivacy': 'groups-only'
  }));

  console.log('✅ Case 5: Testing Valid Write (Should SUCCEED)');
  await assertSucceeds(dbJane.collection('users').doc('user_student_001').update({
    'privacySettings.isProfilePublic': true,
    'privacySettings.avatarPrivacy': 'public'
  }));

  console.log('🚀 Privacy-First Security Rules Validated Successfully!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Validation Failed:', err);
  process.exit(1);
});
