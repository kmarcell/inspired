// Defines persona ownership manifests and functions to clone and clean up test personas.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { getEmulatorConfig, assertEmulatorOnly, applyEmulatorEnv } = require('./emulator');

// Ensure admin SDK is initialized pointing to local emulator
assertEmulatorOnly();
applyEmulatorEnv();

if (!admin.apps.length) {
  const config = getEmulatorConfig();
  admin.initializeApp({
    projectId: config.projectId,
  });
}

const db = admin.firestore();
const SEEDS_DIR = path.join(__dirname, '../../seeds');

function loadSeedJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(SEEDS_DIR, filename), 'utf8'));
}

/**
 * Returns all seed definitions for a persona by source user ID.
 */
function getPersonaManifest(sourceUserId) {
  const users = loadSeedJson('users.json');
  const user = users.find(u => u.id === sourceUserId);
  if (!user) {
    throw new Error(`Base persona with ID "${sourceUserId}" not found in users.json`);
  }

  const companies = loadSeedJson('companies.json').filter(c => c.ownerId === sourceUserId);
  const companyIds = companies.map(c => c.id);

  const studios = loadSeedJson('studios.json').filter(s => s.ownerId === sourceUserId);
  const studioIds = studios.map(s => s.id);

  // Currencies owned by the user's company or studios
  const currencies = loadSeedJson('company_currencies.json').filter(
    curr => (curr.companyId && companyIds.includes(curr.companyId)) ||
            (curr.studioId && studioIds.includes(curr.studioId))
  );

  // Currency policies for the user's studios
  const policies = loadSeedJson('studio_currency_policies.json').filter(
    p => studioIds.includes(p.studioId)
  );

  // Classes for the user's studios
  const classes = loadSeedJson('studio_classes.json').filter(
    c => studioIds.includes(c.studioId)
  );

  // Memberships for the user's studios
  const members = loadSeedJson('studio_members.json').filter(
    m => studioIds.includes(m.studioId)
  );

  // Passes belonging directly to this user
  const passes = loadSeedJson('user_passes.json').filter(p => p.userId === sourceUserId);

  // Templates belonging to the user's companies
  const templates = loadSeedJson('company_class_templates.json').filter(
    t => companyIds.includes(t.companyId)
  );

  // Communities linked to the user's studios or brand
  const communities = loadSeedJson('communities.json').filter(
    comm => (comm.linkedStudioId && studioIds.includes(comm.linkedStudioId))
  );

  return {
    user,
    companies,
    studios,
    currencies,
    policies,
    classes,
    members,
    passes,
    templates,
    communities,
  };
}

/**
 * Deeply rewrites strings in objects/arrays matching oldId -> newId
 */
function rewriteReferences(obj, idMap) {
  if (Array.isArray(obj)) {
    return obj.map(item => rewriteReferences(item, idMap));
  } else if (obj !== null && typeof obj === 'object') {
    const copy = {};
    for (const [key, val] of Object.entries(obj)) {
      copy[key] = rewriteReferences(val, idMap);
    }
    return copy;
  } else if (typeof obj === 'string') {
    let rewritten = obj;
    for (const [oldId, newId] of Object.entries(idMap)) {
      if (rewritten === oldId) {
        rewritten = newId;
      } else if (rewritten.includes(oldId)) {
        // e.g. community IDs or usernames containing oldId
        rewritten = rewritten.split(oldId).join(newId);
      }
    }
    return rewritten;
  }
  return obj;
}

/**
 * Clones a test persona for a given test ID.
 * Writes all documents with `_testClone: { runId, testId }`
 * Creates Auth user `<testId>@inspired.test` with password from process.env.TEST_USER_PASSWORD or default test password.
 */
async function clonePersona(sourceUserId, testId, options = {}) {
  assertEmulatorOnly();
  const runId = options.runId || process.env.TEST_RUN_ID || 'run_local';
  const manifest = getPersonaManifest(sourceUserId);

  const suffix = `__${testId}`;
  const cloneUserId = `${sourceUserId}${suffix}`;
  const cloneEmail = `${testId}@inspired.test`;

  // Build ID mapping
  const idMap = {
    [sourceUserId]: cloneUserId,
  };

  manifest.companies.forEach(c => { idMap[c.id] = `${c.id}${suffix}`; });
  manifest.studios.forEach(s => { idMap[s.id] = `${s.id}${suffix}`; });
  manifest.currencies.forEach(curr => { idMap[curr.id] = `${curr.id}${suffix}`; });
  manifest.policies.forEach(p => { idMap[p.id] = `${p.id}${suffix}`; });
  manifest.classes.forEach(c => { idMap[c.id] = `${c.id}${suffix}`; });
  manifest.templates.forEach(t => { idMap[t.id] = `${t.id}${suffix}`; });
  manifest.communities.forEach(comm => { idMap[comm.id] = `${comm.id}${suffix}`; });
  manifest.passes.forEach(p => { idMap[p.id] = `${p.id}${suffix}`; });

  const testMarker = {
    _testClone: {
      runId,
      testId,
      sourceUserId,
      createdAt: new Date().toISOString(),
    },
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Prepare Auth Account
  const password = process.env.TEST_USER_PASSWORD || 'TestPass123!';
  try {
    await admin.auth().createUser({
      uid: cloneUserId,
      email: cloneEmail,
      password: password,
      displayName: manifest.user.displayName ? `${manifest.user.displayName} (Test)` : `Test User ${testId}`,
    });
    if (manifest.user.isAdmin) {
      await admin.auth().setCustomUserClaims(cloneUserId, { isAdmin: true });
    }
  } catch (err) {
    if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
      await admin.auth().updateUser(cloneUserId, {
        password: password,
        email: cloneEmail,
      });
    } else {
      throw err;
    }
  }

  // 2. Write Cloned Firestore Documents
  const batch = db.batch();

  // User document
  const clonedUser = {
    ...rewriteReferences(manifest.user, idMap),
    id: cloneUserId,
    email: cloneEmail,
    ...testMarker,
  };
  batch.set(db.collection('users').doc(cloneUserId), clonedUser);

  // Companies
  for (const comp of manifest.companies) {
    const clonedComp = {
      ...rewriteReferences(comp, idMap),
      ...testMarker,
    };
    batch.set(db.collection('companies').doc(idMap[comp.id]), clonedComp);
  }

  // Studios
  for (const studio of manifest.studios) {
    const clonedStudio = {
      ...rewriteReferences(studio, idMap),
      ...testMarker,
    };
    batch.set(db.collection('studios').doc(idMap[studio.id]), clonedStudio);
  }

  // Currencies
  for (const curr of manifest.currencies) {
    const clonedCurr = {
      ...rewriteReferences(curr, idMap),
      ...testMarker,
    };
    batch.set(db.collection('company_currencies').doc(idMap[curr.id]), clonedCurr);
  }

  // Studio Currency Policies
  for (const pol of manifest.policies) {
    const clonedPol = {
      ...rewriteReferences(pol, idMap),
      ...testMarker,
    };
    batch.set(db.collection('studio_currency_policies').doc(idMap[pol.id]), clonedPol);
  }

  // Passes
  for (const pass of manifest.passes) {
    const clonedPass = {
      ...rewriteReferences(pass, idMap),
      ...testMarker,
    };
    batch.set(db.collection('user_passes').doc(idMap[pass.id]), clonedPass);
  }

  // Templates
  for (const tmpl of manifest.templates) {
    const clonedTmpl = {
      ...rewriteReferences(tmpl, idMap),
      ...testMarker,
    };
    batch.set(db.collection('company_class_templates').doc(idMap[tmpl.id]), clonedTmpl);
  }

  // Communities
  for (const comm of manifest.communities) {
    const clonedComm = {
      ...rewriteReferences(comm, idMap),
      ...testMarker,
    };
    batch.set(db.collection('communities').doc(idMap[comm.id]), clonedComm);
  }

  await batch.commit();

  // 3. Write Subcollections (classes and members under cloned studios)
  for (const cls of manifest.classes) {
    const targetStudioId = idMap[cls.studioId];
    const clonedClass = {
      ...rewriteReferences(cls, idMap),
      dateString: cls.dateString === '{{today}}' ? todayStr : cls.dateString,
      status: cls.status || 'published',
      ...testMarker,
    };
    await db.collection('studios').doc(targetStudioId).collection('classes').doc(idMap[cls.id]).set(clonedClass);
  }

  for (const m of manifest.members) {
    const targetStudioId = idMap[m.studioId];
    const { studioId, ...memberData } = m;
    const clonedMember = {
      ...rewriteReferences(memberData, idMap),
      ...testMarker,
    };
    await db.collection('studios').doc(targetStudioId).collection('members').doc(clonedMember.id).set(clonedMember);
  }

  return {
    userId: cloneUserId,
    email: cloneEmail,
    password: password,
    idMap,
    manifest,
  };
}

/**
 * Cleans up everything owned or created by a cloned persona.
 */
async function cleanupClone(cloneInfo) {
  assertEmulatorOnly();
  if (process.env.KEEP_ON_FAIL === 'true' || process.env.KEEP_ON_FAIL === '1') {
    console.log(`ℹ️ KEEP_ON_FAIL is set: preserving data for ${cloneInfo.userId}`);
    return;
  }

  const { userId, idMap = {} } = cloneInfo;

  // 1. Delete Auth user
  try {
    await admin.auth().deleteUser(userId);
  } catch (err) {
    // Ignore if already deleted
  }

  // 2. Subcollections and Studio docs
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (oldId.startsWith('studio_')) {
      const studioRef = db.collection('studios').doc(newId);
      await admin.firestore().recursiveDelete(studioRef);
    } else if (oldId.startsWith('company_')) {
      const compRef = db.collection('companies').doc(newId);
      await admin.firestore().recursiveDelete(compRef);
    }
  }

  // 3. Delete from collections by ownership / ID match
  const collectionsToClean = [
    { col: 'users', docId: userId },
    { col: 'user_passes', queryField: 'userId', value: userId },
    { col: 'class_bookings', queryField: 'userId', value: userId },
    { col: 'posts', queryField: 'author.id', value: userId },
    { col: 'studioClaims', queryField: 'userId', value: userId },
    { col: 'studioClaims', queryField: 'claimantId', value: userId },
  ];

  for (const task of collectionsToClean) {
    if (task.docId) {
      await db.collection(task.col).doc(task.docId).delete().catch(() => {});
    } else if (task.queryField) {
      const snap = await db.collection(task.col).where(task.queryField, '==', task.value).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  }

  // 4. Clean dynamically created studios and companies (including subcollections)
  const dynStudios = await db.collection('studios').where('ownerId', '==', userId).get();
  for (const doc of dynStudios.docs) {
    await admin.firestore().recursiveDelete(doc.ref).catch(() => {});
  }
  const dynCompanies = await db.collection('companies').where('ownerId', '==', userId).get();
  for (const doc of dynCompanies.docs) {
    await admin.firestore().recursiveDelete(doc.ref).catch(() => {});
  }

  // Also remove standalone currencies, policies, templates, communities
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (oldId.startsWith('curr_')) {
      await db.collection('company_currencies').doc(newId).delete().catch(() => {});
    } else if (oldId.startsWith('comm_')) {
      await db.collection('communities').doc(newId).delete().catch(() => {});
    } else if (oldId.startsWith('tmpl_')) {
      await db.collection('company_class_templates').doc(newId).delete().catch(() => {});
    }
  }
}

/**
 * Sweep leftover test clone data from previous or crashed test runs.
 */
async function sweepStaleClones(currentRunId = null) {
  assertEmulatorOnly();
  const collections = [
    'users', 'studios', 'companies', 'company_currencies',
    'studio_currency_policies', 'user_passes', 'communities', 'posts', 'class_bookings'
  ];

  for (const col of collections) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const isClone = data._testClone || doc.id.includes('__');
      if (isClone) {
        if (!currentRunId || (data._testClone && data._testClone.runId !== currentRunId)) {
          await admin.firestore().recursiveDelete(doc.ref);
        }
      }
    }
  }

  // Auth sweep
  try {
    const listUsers = await admin.auth().listUsers(1000);
    for (const u of listUsers.users) {
      if (u.email && u.email.endsWith('@inspired.test') && u.email.includes('__')) {
        await admin.auth().deleteUser(u.uid);
      }
    }
  } catch (err) {
    // Auth sweep failure should not halt
  }
}

module.exports = {
  getPersonaManifest,
  clonePersona,
  cleanupClone,
  sweepStaleClones,
};
