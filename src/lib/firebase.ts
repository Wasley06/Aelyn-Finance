import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Cloud Functions region for FirebaseWebAuthn extension (default: us-central1)
export const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1');

// Offline-first: cache reads + queue writes in IndexedDB when offline.
enableMultiTabIndexedDbPersistence(db).catch(() => {
  // Ignore if it can't be enabled (e.g., multiple tabs already open, private mode, etc.).
});
