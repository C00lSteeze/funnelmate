
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// keys are pulled from vite.config.ts define
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let app;
let auth: any;
let db: any;

try {
    // Check if the key exists and isn't a placeholder (depending on how env vars are loaded)
    if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY.length > 5) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase config missing. App will run in Demo Mode.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export { auth, db };
