import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { DEFAULT_PREFERENCES, UserPreferences } from '@/types/user';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function getLocalStorageKey(uid: string): string {
  return `saathi_prefs_${uid}`;
}

export async function getUserPreferences(uid: string): Promise<UserPreferences> {
  if (!uid) return DEFAULT_PREFERENCES;

  // 1. Try local storage first for instant zero-flicker render
  let localPrefs: UserPreferences | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getLocalStorageKey(uid));
      if (raw) {
        localPrefs = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read local preferences:', err);
    }
  }

  // 2. If Firebase is active, sync with Cloud Firestore
  if (db && isFirebaseConfigured) {
    try {
      const prefDoc = doc(db, 'users', uid, 'preferences', 'main');
      const snap = await getDoc(prefDoc);
      if (snap.exists()) {
        const cloudPrefs = snap.data() as UserPreferences;
        if (typeof window !== 'undefined') {
          localStorage.setItem(getLocalStorageKey(uid), JSON.stringify(cloudPrefs));
        }
        return cloudPrefs;
      }
    } catch (err) {
      console.warn('Firestore getUserPreferences error, using local:', err);
    }
  }

  return localPrefs || DEFAULT_PREFERENCES;
}

export async function saveUserPreferences(
  uid: string,
  prefs: UserPreferences
): Promise<UserPreferences> {
  if (!uid) return prefs;

  if (typeof window !== 'undefined') {
    localStorage.setItem(getLocalStorageKey(uid), JSON.stringify(prefs));
  }

  if (db && isFirebaseConfigured) {
    try {
      const prefDoc = doc(db, 'users', uid, 'preferences', 'main');
      await setDoc(prefDoc, prefs, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUserPreferences error:', err);
    }
  }

  return prefs;
}
