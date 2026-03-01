const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Initialize Firebase Admin
// If local, use the Emulator. If staging, use default credentials.
const environment = process.argv[2] || 'local';

if (environment === 'local') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  admin.initializeApp({
    projectId: 'inspired-yoga-app-staging'
  });
  console.log('🌱 Seeding LOCAL Emulator...');
} else {
  admin.initializeApp();
  console.log(`🌱 Seeding ${environment.toUpperCase()} Cloud Project...`);
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

async function clearCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return;
  }

  console.log(`🗑️  Clearing ${snapshot.size} documents from '${collectionName}'...`);
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
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

  data = convertDates(data);
  
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
      await fetch(`http://localhost:9099/emulator/v1/projects/inspired-yoga-app-staging/accounts`, {
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
        console.log(`✅ Created Auth user: ${user.id} (${email})`);
      } catch (error) {
        if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
          console.log(`ℹ️ Auth user already exists: ${user.id}`);
        } else {
          console.warn(`⚠️ Failed to create Auth user ${user.id}:`, error.message);
        }
      }
    }
  }
}

async function run() {
  try {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds/users.json'), 'utf8'));
    await seedAuth(usersData);
    
    await seedCollection('users', 'users.json');
    await seedCollection('studios', 'studios.json');
    await seedCollection('posts', 'posts.json');
    console.log('🚀 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

run();
