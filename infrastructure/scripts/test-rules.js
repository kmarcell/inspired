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

  // Setup Maya (Authenticated) and Liam (Outsider)
  const mayaContext = testEnv.authenticatedContext('user_teacher_001');
  const liamContext = testEnv.authenticatedContext('user_student_002');

  // Seed data with security rules disabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    // 1. Users
    // Maya: Joined Askew and Ravenscourt
    await db.collection('users').doc('user_teacher_001').set({
      joinedCommunities: ['area_askew', 'comm_ravenscourt_yoga'],
      privacySettings: { isProfilePublic: true, avatarPrivacy: 'public' }
    });

    // Private User: No overlap with Maya
    await db.collection('users').doc('user_private_001').set({
      joinedCommunities: ['area_chelsea'],
      privacySettings: { isProfilePublic: false, avatarPrivacy: 'groups-only' }
    });

    // 2. Communities
    // Public Community
    await db.collection('communities').doc('area_askew').set({
      privacySettings: { isPublic: true }
    });
    await db.collection('communities').doc('comm_ravenscourt_yoga').set({
      privacySettings: { isPublic: true }
    });
    await db.collection('communities').doc('area_chelsea').set({
      privacySettings: { isPublic: true }
    });
    
    // Private Community
    await db.collection('communities').doc('comm_private_yoga').set({
      privacySettings: { isPublic: false }
    });

    // 3. Posts
    // Post in Area (Public)
    await db.collection('posts').doc('post_askew_001').set({
      author: { id: 'user_teacher_001' },
      source: { type: 'area', id: 'area_askew' }
    });

    // Post in Private Community (Private)
    await db.collection('posts').doc('post_private_001').set({
      author: { id: 'user_private_001' },
      source: { type: 'community', id: 'comm_private_yoga' }
    });

    // Post by Private User in Public Area (Visible)
    await db.collection('posts').doc('post_chelsea_001').set({
      author: { id: 'user_private_001' },
      source: { type: 'area', id: 'area_chelsea' }
    });
  });

  const dbMaya = mayaContext.firestore();
  const dbLiam = liamContext.firestore();

  // --- Scenario 1: Community Access ---
  console.log('✅ Case 1: Fetching Public Community (Should SUCCEED)');
  await assertSucceeds(dbMaya.collection('communities').doc('area_askew').get());

  console.log('✅ Case 2: Fetching Private Community - Non Member (Should FAIL)');
  await assertFails(dbMaya.collection('communities').doc('comm_private_yoga').get());

  // --- Scenario 2: Post Visibility ---
  console.log('✅ Case 3: Reading Post in Joined Area (Should SUCCEED)');
  await assertSucceeds(dbMaya.collection('posts').doc('post_askew_001').get());

  console.log('✅ Case 4: Reading Post in Non-Joined Area (Should SUCCEED - Areas are public)');
  await assertSucceeds(dbMaya.collection('posts').doc('post_chelsea_001').get());

  console.log('✅ Case 5: Reading Post in Private Community - Non Member (Should FAIL)');
  await assertFails(dbMaya.collection('posts').doc('post_private_001').get());

  console.log('✅ Case 6: Reading Post in Public Area from Private User (Should SUCCEED)');
  await assertSucceeds(dbMaya.collection('posts').doc('post_chelsea_001').get());

  // --- Scenario 3: Create Constraints ---
  console.log('✅ Case 7: Creating Post in Area (Should SUCCEED)');
  await assertSucceeds(dbMaya.collection('posts').doc('new_post_001').set({
    author: { id: 'user_teacher_001' },
    source: { type: 'area', id: 'area_askew' }
  }));

  console.log('✅ Case 8: Creating Post in Private Community - Non Member (Should FAIL)');
  await assertFails(dbMaya.collection('posts').doc('new_post_002').set({
    author: { id: 'user_teacher_001' },
    source: { type: 'community', id: 'comm_private_yoga' }
  }));

  console.log('🚀 All Security Rules Validated Successfully!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Validation Failed:', err);
  process.exit(1);
});
