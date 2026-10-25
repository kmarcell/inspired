import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key-staging-inspired-01',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'inspired-yoga-app-staging.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'inspired-yoga-app-staging',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'inspired-yoga-app-staging.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '99296584767',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:99296584767:web:d1d94eb7c274704f70c48a',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to local Firebase Emulators if running locally or requested.
// Ports default to those in firebase.json and can be overridden (e.g. by the e2e harness) via env.
if (import.meta.env.VITE_USE_EMULATORS === 'true' || window.location.hostname === 'localhost') {
  const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || 'localhost';
  const authPort = Number(import.meta.env.VITE_AUTH_EMULATOR_PORT) || 9099;
  const firestorePort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT) || 8081;
  console.log(`⚡ Connecting PWA to local Firebase Emulators (Auth: ${authPort}, Firestore: ${firestorePort})...`);
  connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, firestorePort);
}
