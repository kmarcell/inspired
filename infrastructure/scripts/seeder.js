const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { getEmulatorConfig, applyEmulatorEnv } = require('./lib/emulator');

// 1. Initialize Firebase Admin
// If local, use the Emulator (hosts/ports come from firebase.json). If staging, use default credentials.
const environment = process.argv[2] || 'local';
const emulatorConfig = getEmulatorConfig();

if (environment === 'local') {
  applyEmulatorEnv(emulatorConfig);
  admin.initializeApp({
    projectId: emulatorConfig.projectId
  });
  console.log('🌱 Seeding LOCAL Emulator...');
} else {
  const targetProjectId = environment === 'production' ? 'inspired-yoga-app' : 'inspired-yoga-app-staging';
  admin.initializeApp({
    projectId: targetProjectId,
  });
  console.log(`🌱 Seeding ${environment.toUpperCase()} Cloud Project (${targetProjectId})...`);
}

const db = admin.firestore();

function validateUserSchema(user) {
  const requiredFields = ['id', 'username', 'displayName', 'privacySettings', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!user[field]) {
      throw new Error(`User ${user.id || 'unknown'} missing required field: ${field}`);
    }
  }

  const validVisibility = ['public', 'groups-only', 'members-only'];
  const privacy = user.privacySettings;
  
  if (privacy) {
    if (privacy.avatarPrivacy && !validVisibility.includes(privacy.avatarPrivacy)) {
        throw new Error(`User ${user.id} has invalid avatarPrivacy: ${privacy.avatarPrivacy}`);
    }
    if (privacy.showJoinedGroups && !validVisibility.includes(privacy.showJoinedGroups)) {
        throw new Error(`User ${user.id} has invalid showJoinedGroups: ${privacy.showJoinedGroups}`);
    }
  }
}

function convertDates(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj[key])) {
        obj[key] = admin.firestore.Timestamp.fromDate(new Date(obj[key]));
      } else {
        obj[key] = convertDates(obj[key]);
      }
    });
  }
  return obj;
}

async function deleteSubcollections(docRef, subcollectionNames) {
  for (const subName of subcollectionNames) {
    const subRef = docRef.collection(subName);
    const snap = await subRef.get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

async function clearCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return;
  }

  console.log(`🗑️  Clearing ${snapshot.size} documents & subcollections from '${collectionName}'...`);
  
  for (const docSnap of snapshot.docs) {
    if (collectionName === 'studios') {
      await deleteSubcollections(docSnap.ref, ['members', 'classes', 'joinRequests', 'bookings']);
    }
    await docSnap.ref.delete();
  }
}

async function seedCollection(collectionName, fileName) {
  const filePath = path.join(__dirname, '../seeds', fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Seed file not found: ${fileName}. Skipping.`);
    return;
  }

  await clearCollection(collectionName);

  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (collectionName === 'users') {
    data.forEach(validateUserSchema);
  }

  if (collectionName === 'posts') {
    const now = Date.now();
    data.forEach((post, index) => {
      // Dynamically space posts over the past 7 days relative to right now
      const ageInHours = index * 3; // 3 hours apart
      const postTimestamp = new Date(now - ageInHours * 3600 * 1000);
      post.createdAt = admin.firestore.Timestamp.fromDate(postTimestamp);
      if (post.source && !post.source.id && post.source.name) {
        post.source.id = `area_${post.source.name.toLowerCase()}`;
      }
    });
  } else {
    data = convertDates(data);
  }
  
  console.log(`📡 Seeding ${data.length} documents into '${collectionName}'...`);

  const batch = db.batch();
  data.forEach((doc) => {
    const docRef = db.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc);
  });

  await batch.commit();
  console.log(`✅ Successfully seeded '${collectionName}'.`);
}

async function seedAuth(users) {
  if (environment !== 'local') {
    console.log(`ℹ️  Skipping Auth seeding for ${environment.toUpperCase()} (OAuth only).`);
    return;
  }

  const password = process.env.TEST_USER_PASSWORD;
  if (!password) {
    throw new Error('❌ TEST_USER_PASSWORD environment variable is required for local seeding.');
  }

  console.log('🧹 Clearing Auth Emulator accounts...');
  try {
    await fetch(`http://${emulatorConfig.authHost}/emulator/v1/projects/${emulatorConfig.projectId}/accounts`, {
      method: 'DELETE'
    });
    console.log('✅ Auth Emulator cleared.');
  } catch (error) {
    console.warn('⚠️ Failed to clear Auth Emulator:', error.message);
  }

  console.log(`🔑 Seeding ${users.length} users into Auth Emulator...`);
  for (const user of users) {
    try {
      const email = `${user.id}@inspired.test`;
      await admin.auth().createUser({
        uid: user.id,
        email: email,
        password: password,
        displayName: user.displayName
      });
      if (user.isAdmin) {
        await admin.auth().setCustomUserClaims(user.id, { isAdmin: true });
        console.log(`🛡️ Set custom claim isAdmin: true for ${user.id}`);
      }
      console.log(`✅ Created Auth user: ${user.id} (${email})`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        try {
          await admin.auth().updateUser(user.id, {
            password: password,
            email: `${user.id}@inspired.test`,
            displayName: user.displayName
          });
          if (user.isAdmin) {
            await admin.auth().setCustomUserClaims(user.id, { isAdmin: true });
            console.log(`🛡️ Set custom claim isAdmin: true for ${user.id}`);
          }
          console.log(`🔄 Synchronized existing Auth user password: ${user.id}`);
        } catch (updateErr) {
          console.warn(`⚠️ Failed to update Auth user ${user.id}:`, updateErr.message);
        }
      } else {
        console.warn(`⚠️ Failed to create Auth user ${user.id}:`, error.message);
      }
    }
  }
}

async function run() {
  try {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds/users.json'), 'utf8'));
    await seedAuth(usersData);
    
    await seedCollection('users', 'users.json');
    await seedCollection('companies', 'companies.json');
    await seedCollection('studios', 'studios.json');
    await seedCollection('communities', 'communities.json');
    await seedCollection('posts', 'posts.json');
    await seedCollection('company_currencies', 'company_currencies.json');
    await seedCollection('studio_currency_policies', 'studio_currency_policies.json');
    await seedCollection('user_passes', 'user_passes.json');
    await seedCollection('company_class_templates', 'company_class_templates.json');

    // Seed studio class schedule & member subcollections (seeds/studio_classes.json, seeds/studio_members.json)
    console.log('🧘 Seeding studio classes & members subcollections...');
    const todayStr = new Date().toISOString().split('T')[0];

    const classesSeed = JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds/studio_classes.json'), 'utf8'));
    for (const cls of classesSeed) {
      await db.collection('studios').doc(cls.studioId).collection('classes').doc(cls.id).set({
        ...cls,
        // "{{today}}" is replaced so seeded classes are always scheduled for the current day
        dateString: cls.dateString === '{{today}}' ? todayStr : cls.dateString,
        status: cls.status || 'published',
      });
    }

    const membersSeed = JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds/studio_members.json'), 'utf8'));
    for (const { studioId, ...member } of membersSeed) {
      await db.collection('studios').doc(studioId).collection('members').doc(member.id).set(member);
    }

    // Check for dynamic ADMIN_EMAIL environment variable or --admin-email flag
    const adminEmail = process.env.ADMIN_EMAIL || process.argv.find(arg => arg.startsWith('--admin-email='))?.split('=')[1];
    if (adminEmail) {
      const cleanAdminEmail = adminEmail.trim().toLowerCase();
      const existingInviteSnap = await db.collection('stagingInvites').where('email', '==', cleanAdminEmail).get();
      if (existingInviteSnap.empty) {
        await db.collection('stagingInvites').add({
          email: cleanAdminEmail,
          invitedBy: 'system_seeder',
          createdAt: new Date().toISOString(),
        });
        console.log(`✉️ Created Staging Invite for: ${cleanAdminEmail}`);
      } else {
        console.log(`✉️ Staging Invite already exists for: ${cleanAdminEmail}`);
      }

      // Grant Admin permissions if Auth user is already created
      try {
        const authUser = await admin.auth().getUserByEmail(cleanAdminEmail);
        if (authUser) {
          await admin.auth().setCustomUserClaims(authUser.uid, { isAdmin: true });
          await db.collection('users').doc(authUser.uid).set({
            id: authUser.uid,
            username: authUser.displayName ? `${authUser.displayName.toLowerCase().replace(/\s+/g, '_')}#001` : 'admin_user#001',
            email: cleanAdminEmail,
            displayName: authUser.displayName || 'Platform Admin',
            isAdmin: true,
            bio: 'Platform Administrator & Yoga Community Founder.',
            lastSearchArea: 'Askew',
            location_prefix: 'W12',
            joinedCommunities: ['area_askew', 'comm_studio_studio_askew_001', 'comm_brand_affordable_london'],
            privacySettings: {
              isProfilePublic: true,
              avatarPrivacy: 'public',
              showJoinedGroups: 'public'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          // Explicitly assign Affordable London Yoga brand network and Askew Road Zen Den studio to Admin user
          await db.collection('companies').doc('company_affordable_london').set({ ownerId: authUser.uid }, { merge: true });
          await db.collection('studios').doc('studio_askew_001').set({ ownerId: authUser.uid }, { merge: true });

          console.log(`🛡️ Granted Admin permissions & assigned brand/studio ownership to: ${cleanAdminEmail} (${authUser.uid})`);
        }
      } catch (e) {
        // User not registered yet in Auth; invite created in /stagingInvites
      }
    }

    console.log('🚀 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

run();
