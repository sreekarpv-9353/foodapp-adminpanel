// src/services/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 🔹 Main app (used for admin login, normal operations)
let app;
const apps = getApps();

if (!apps.length) {
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0];
}

// 🔹 Secondary app (used ONLY for creating driver accounts so admin session is not affected)
let secondaryApp = apps.find((a) => a.name === 'secondary');

if (!secondaryApp) {
  secondaryApp = initializeApp(firebaseConfig, 'secondary');
}

// Firebase services for main app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 🔹 Auth for creating drivers (used in admin driver registration)
export const secondaryAuth = getAuth(secondaryApp);

export default app;
