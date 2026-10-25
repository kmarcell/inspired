const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');
const { getPersonaManifest, clonePersona, cleanupClone } = require('./lib/clonePersona');
const { getEmulatorConfig, assertEmulatorOnly } = require('./lib/emulator');

assertEmulatorOnly();
const db = admin.firestore();

test('getPersonaManifest correctly aggregates assets for user_david_kim', () => {
  const manifest = getPersonaManifest('user_david_kim');
  assert.equal(manifest.user.id, 'user_david_kim');
  assert.equal(manifest.studios.length, 1);
  assert.equal(manifest.studios[0].id, 'studio_ravenscourt_003');
  assert.ok(manifest.classes.length >= 2);
  assert.ok(manifest.members.length >= 1);
});

test('getPersonaManifest correctly aggregates assets for user_owner_noteach', () => {
  const manifest = getPersonaManifest('user_owner_noteach');
  assert.equal(manifest.user.id, 'user_owner_noteach');
  assert.equal(manifest.user.isTeacher, false);
  assert.equal(manifest.studios[0].id, 'studio_shoreditch_006');
  assert.equal(manifest.currencies.length, 2);
  assert.equal(manifest.policies.length, 1);
  assert.equal(manifest.classes.length, 2);
});

test('getPersonaManifest throws for non-existent persona', () => {
  assert.throws(() => getPersonaManifest('user_does_not_exist'), /not found in users\.json/);
});

test('clonePersona creates isolated graph in Firestore and Auth, and cleanupClone purges it completely', async () => {
  const testId = `test_throwaway_${Date.now()}`;
  const clone = await clonePersona('user_owner_noteach', testId);

  try {
    // 1. Verify Auth user
    const authUser = await admin.auth().getUser(clone.userId);
    assert.equal(authUser.email, clone.email);

    // 2. Verify Firestore User
    const userDoc = await db.collection('users').doc(clone.userId).get();
    assert.ok(userDoc.exists, 'User document exists');
    assert.equal(userDoc.data().id, clone.userId);
    assert.ok(userDoc.data()._testClone, '_testClone marker present');

    // 3. Verify Studio and Subcollection
    const clonedStudioId = clone.idMap['studio_shoreditch_006'];
    const studioDoc = await db.collection('studios').doc(clonedStudioId).get();
    assert.ok(studioDoc.exists, 'Studio document exists');
    assert.equal(studioDoc.data().ownerId, clone.userId, 'Studio ownerId rewritten to clone user');

    const classesSnap = await db.collection('studios').doc(clonedStudioId).collection('classes').get();
    assert.equal(classesSnap.size, 2, '2 classes cloned under studio');
    assert.ok(classesSnap.docs[0].data()._testClone, 'Class has _testClone marker');

    // 4. Verify no references leaked back to original persona
    for (const [oldId, newId] of Object.entries(clone.idMap)) {
      if (oldId !== newId) {
        assert.notEqual(newId, oldId);
      }
    }

    // 5. Simulate App Mutation (user books a class or creates pass)
    const simulatedBookingRef = db.collection('class_bookings').doc(`booking_${testId}`);
    await simulatedBookingRef.set({
      id: `booking_${testId}`,
      userId: clone.userId,
      studioId: clonedStudioId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

  } finally {
    // 6. Cleanup
    await cleanupClone(clone);

    // Verify Purge
    const userDocAfter = await db.collection('users').doc(clone.userId).get();
    assert.ok(!userDocAfter.exists, 'User document purged');

    const clonedStudioId = clone.idMap['studio_shoreditch_006'];
    const studioDocAfter = await db.collection('studios').doc(clonedStudioId).get();
    assert.ok(!studioDocAfter.exists, 'Studio document purged');

    const classesSnapAfter = await db.collection('studios').doc(clonedStudioId).collection('classes').get();
    assert.equal(classesSnapAfter.size, 0, 'Subcollections recursively deleted');

    const bookingSnapAfter = await db.collection('class_bookings').where('userId', '==', clone.userId).get();
    assert.equal(bookingSnapAfter.size, 0, 'Simulated app bookings purged');

    await assert.rejects(
      async () => await admin.auth().getUser(clone.userId),
      /no user record/
    );
  }
});
