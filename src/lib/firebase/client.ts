import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_firebase_api_key'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err);
  }
}

export { app, auth, db };

/**
 * Initializes anonymous authentication session.
 * If Firebase is configured, signs in via Firebase Anonymous Auth.
 * Otherwise returns or initializes a persistent local anonymous session.
 */
export async function initAnonymousUser(): Promise<{ uid: string; isCloudAuth: boolean }> {
  if (typeof window === 'undefined') {
    return { uid: 'server-session', isCloudAuth: false };
  }

  // 1. If Firebase Auth is live, use genuine Firebase Anonymous Auth
  if (auth && isFirebaseConfigured) {
    try {
      if (auth.currentUser) {
        return { uid: auth.currentUser.uid, isCloudAuth: true };
      }
      const credential = await signInAnonymously(auth);
      return { uid: credential.user.uid, isCloudAuth: true };
    } catch (err) {
      console.warn('Firebase anonymous sign-in failed, falling back to local persistent UID:', err);
    }
  }

  // 2. Local resilient anonymous UID persisted in localStorage
  let localUid = localStorage.getItem('saathi_anonymous_uid');
  if (!localUid) {
    localUid = 'saathi-user-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    localStorage.setItem('saathi_anonymous_uid', localUid);
  }

  return { uid: localUid, isCloudAuth: false };
}
