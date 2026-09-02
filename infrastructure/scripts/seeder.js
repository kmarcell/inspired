const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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
      if (user.isAdmin) {
        await admin.auth().setCustomUserClaims(user.id, { isAdmin: true });
        console.log(`🛡️ Set custom claim isAdmin: true for ${user.id}`);
      }
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

async function run() {
  try {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seeds/users.json'), 'utf8'));
    await seedAuth(usersData);
    
    await seedCollection('users', 'users.json');
    await seedCollection('studios', 'studios.json');
    await seedCollection('communities', 'communities.json');
    await seedCollection('posts', 'posts.json');

    // Seed studio class schedule & member subcollections
    console.log('🧘 Seeding studio classes & members subcollections...');
    const todayStr = new Date().toISOString().split('T')[0];

    const classesSeed = [
      // Askew Road Zen Den (studio_askew_001)
      {
        id: 'class_askew_1',
        studioId: 'studio_askew_001',
        className: 'Vinyasa Flow',
        styleName: 'Dynamic Vinyasa',
        classTypeDescription: 'A fluid, breath-synchronized sequence designed to build core strength and endurance while calming the mind.',
        teacherId: 'user_maryia',
        teacherName: 'Maryia Sharma',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        capacity: 24,
        bookedCount: 10,
        waitlist: [],
        roomClimate: 'natural_ambient',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Yoga Mat & Towel',
      },
      {
        id: 'class_askew_2',
        studioId: 'studio_askew_001',
        className: 'Hot Ashtanga Primary',
        styleName: 'Ashtanga Primary Series',
        classTypeDescription: 'Structured, traditional Ashtanga primary series in a warm studio environment for deep flexibility and detox.',
        teacherId: 'user_elena',
        teacherName: 'Elena Rostova',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '05:30 PM',
        endTime: '06:30 PM',
        capacity: 20,
        bookedCount: 20,
        waitlist: ['user_waitlist_1', 'user_waitlist_2'],
        roomClimate: 'hot_studio',
        temperatureCelsius: 35,
        skillLevel: 'Intermediate / Advanced',
        equipmentNeeded: 'Yoga Mat, Sweat Towel & Water',
      },
      {
        id: 'class_askew_3',
        studioId: 'studio_askew_001',
        className: 'Yin & Sound Bath',
        styleName: 'Restorative Yin',
        classTypeDescription: 'Gentle, long-held floor postures accompanied by Tibetan singing bowls for deep relaxation.',
        teacherId: 'user_maryia',
        teacherName: 'Maryia Sharma',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '07:00 PM',
        endTime: '08:00 PM',
        capacity: 15,
        bookedCount: 8,
        waitlist: [],
        roomClimate: 'air_conditioned',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Yoga Mat & Warm Socks',
      },
      // Chiswick Hot Yoga Studio (studio_chiswick_002)
      {
        id: 'class_chiswick_1',
        studioId: 'studio_chiswick_002',
        className: 'Vinyasa Flow',
        styleName: 'Dynamic Vinyasa',
        classTypeDescription: 'A fluid, breath-synchronized sequence designed to build core strength and endurance while calming the mind.',
        teacherId: 'user_maryia',
        teacherName: 'Maryia Sharma',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        capacity: 24,
        bookedCount: 10,
        waitlist: [],
        roomClimate: 'natural_ambient',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Yoga Mat & Towel',
      },
      {
        id: 'class_chiswick_2',
        studioId: 'studio_chiswick_002',
        className: 'Hot Ashtanga Primary',
        styleName: 'Ashtanga Primary Series',
        classTypeDescription: 'Structured, traditional Ashtanga primary series in a warm studio environment for deep flexibility and detox.',
        teacherId: 'user_elena',
        teacherName: 'Elena Rostova',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '05:30 PM',
        endTime: '06:30 PM',
        capacity: 20,
        bookedCount: 20,
        waitlist: ['user_waitlist_1', 'user_waitlist_2'],
        roomClimate: 'hot_studio',
        temperatureCelsius: 35,
        skillLevel: 'Intermediate / Advanced',
        equipmentNeeded: 'Yoga Mat, Sweat Towel & Water',
      },
      {
        id: 'class_chiswick_3',
        studioId: 'studio_chiswick_002',
        className: 'Yin & Sound Bath',
        styleName: 'Restorative Yin',
        classTypeDescription: 'Gentle, long-held floor postures accompanied by Tibetan singing bowls for deep relaxation.',
        teacherId: 'user_maryia',
        teacherName: 'Maryia Sharma',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '07:00 PM',
        endTime: '08:00 PM',
        capacity: 15,
        bookedCount: 8,
        waitlist: [],
        roomClimate: 'air_conditioned',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Yoga Mat & Warm Socks',
      },
      // Ravenscourt Park Zen Pavilion (studio_ravenscourt_003)
      {
        id: 'class_ravenscourt_1',
        studioId: 'studio_ravenscourt_003',
        className: 'Park Vinyasa & Tree Flow',
        styleName: 'Outdoor Vinyasa',
        classTypeDescription: 'Refresh your practice with a mindful open-air Vinyasa flow under the trees in Ravenscourt Park.',
        teacherId: 'user_david_kim',
        teacherName: 'David Kim',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '09:00 AM',
        endTime: '10:15 AM',
        capacity: 30,
        bookedCount: 14,
        waitlist: [],
        roomClimate: 'natural_ambient',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Outdoor Yoga Mat & Sunscreen',
      },
      {
        id: 'class_ravenscourt_2',
        studioId: 'studio_ravenscourt_003',
        className: 'Mindfulness & Breathwork Walk',
        styleName: 'Pranayama & Meditation',
        classTypeDescription: 'Guided outdoor breathwork and walking meditation session around the park glasshouse.',
        teacherId: 'user_teacher_001',
        teacherName: 'Maya Sharma',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '04:00 PM',
        endTime: '05:15 PM',
        capacity: 20,
        bookedCount: 18,
        waitlist: [],
        roomClimate: 'natural_ambient',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Comfortable Walking Shoes & Water',
      },
      // Chelsea Sanctuary Studio (studio_chelsea_004)
      {
        id: 'class_chelsea_1',
        studioId: 'studio_chelsea_004',
        className: 'Kundalini & Sound Healing',
        styleName: 'Kundalini Yoga',
        classTypeDescription: 'Transformative kriya practice combining pranayama breathwork, mantra chanting, and gong bath vibrations.',
        teacherId: 'user_sophia_vane',
        teacherName: 'Sophia Vane',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '08:00 AM',
        endTime: '09:15 AM',
        capacity: 18,
        bookedCount: 12,
        waitlist: [],
        roomClimate: 'air_conditioned',
        skillLevel: 'All Levels Welcome',
        equipmentNeeded: 'Yoga Mat & White Clothing (Optional)',
      },
      {
        id: 'class_chelsea_2',
        studioId: 'studio_chelsea_004',
        className: 'Reformer Pilates Vinyasa',
        styleName: 'Pilates Flow',
        classTypeDescription: 'High-energy hybrid session blending Pilates core alignment with dynamic yoga flow.',
        teacherId: 'user_sarah',
        teacherName: 'Sarah Jenkins',
        dayOfWeek: 1,
        dateString: todayStr,
        startTime: '06:00 PM',
        endTime: '07:15 PM',
        capacity: 12,
        bookedCount: 12,
        waitlist: ['user_waitlist_3'],
        roomClimate: 'air_conditioned',
        skillLevel: 'Intermediate',
        equipmentNeeded: 'Grip Socks & Water',
      },
    ];

    for (const cls of classesSeed) {
      await db.collection('studios').doc(cls.studioId).collection('classes').doc(cls.id).set(cls);
    }

    const askewMembersSeed = [
      { id: 'user_maryia', displayName: 'Maryia Sharma', isProfilePublic: true, joinedAt: '2026-01-15T10:00:00Z' },
      { id: 'user_elena', displayName: 'Elena Rostova', isProfilePublic: true, joinedAt: '2026-02-01T14:30:00Z' },
      { id: 'user_private_1', displayName: 'Anonymous Yogi #42', isProfilePublic: false, joinedAt: '2026-02-10T09:15:00Z' },
      { id: 'user_private_2', displayName: 'Zen Practitioner', isProfilePublic: false, joinedAt: '2026-02-20T16:45:00Z' },
      { id: 'user_sarah', displayName: 'Sarah Jenkins', isProfilePublic: true, joinedAt: '2026-03-01T11:20:00Z' },
    ];

    for (const m of askewMembersSeed) {
      await db.collection('studios').doc('studio_askew_001').collection('members').doc(m.id).set(m);
    }

    const chiswickMembersSeed = [
      { id: 'user_elena', displayName: 'Elena Rostova', isProfilePublic: true, privacyLevel: 'public', joinedAt: '2026-01-10T08:00:00Z' },
      { id: 'user_groups_only', displayName: 'Groups-Only Practitioner', isProfilePublic: false, privacyLevel: 'groups-only', joinedAt: '2026-01-20T11:30:00Z' },
      { id: 'user_members_only', displayName: 'Members-Only Yogi', isProfilePublic: false, privacyLevel: 'members-only', joinedAt: '2026-02-05T15:10:00Z' },
    ];

    for (const m of chiswickMembersSeed) {
      await db.collection('studios').doc('studio_chiswick_002').collection('members').doc(m.id).set(m);
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
          await db.collection('users').doc(authUser.uid).set({ isAdmin: true }, { merge: true });
          console.log(`🛡️ Granted Admin permissions to: ${cleanAdminEmail} (${authUser.uid})`);
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
