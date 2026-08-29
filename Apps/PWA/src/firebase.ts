import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBL8iJsmuIQVfNtoLQ6lcUaDMXpaZGDAlA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'inspired-yoga-app-staging.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'inspired-yoga-app-staging',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'inspired-yoga-app-staging.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '99296584767',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:99296584767:web:d1d94eb7c274704f70c48a',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to local Firebase Emulators if requested
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  console.log('⚡ Connecting PWA to local Firebase Emulators (Auth: 9099, Firestore: 8081)...');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8081);
}
