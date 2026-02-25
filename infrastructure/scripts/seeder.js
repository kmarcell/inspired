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

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`📡 Seeding ${data.length} documents into '${collectionName}'...`);

  const batch = db.batch();
  data.forEach((doc) => {
    const docRef = db.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc);
  });

  await batch.commit();
  console.log(`✅ Successfully seeded '${collectionName}'.`);
}

async function run() {
  try {
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
