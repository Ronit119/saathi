import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { Guide, GuideStatus } from '@/types/guide';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

function getLocalStorageKey(uid: string): string {
  return `saathi_guides_${uid}`;
}

function getLocalGuides(uid: string): Guide[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalStorageKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read local guides:', err);
    return [];
  }
}

function saveLocalGuides(uid: string, guides: Guide[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getLocalStorageKey(uid), JSON.stringify(guides));
}

/**
 * Get all guides for a user.
 */
export async function getGuides(uid: string): Promise<Guide[]> {
  if (!uid) return [];

  if (db && isFirebaseConfigured) {
    try {
      const guidesRef = collection(db, 'users', uid, 'guides');
      const q = query(guidesRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: Guide[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Guide);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getGuides error, checking local store:', err);
      return getLocalGuides(uid);
    }
  }

  return getLocalGuides(uid);
}

/**
 * Get a specific guide by ID.
 */
export async function getGuideById(uid: string, guideId: string): Promise<Guide | null> {
  if (!uid || !guideId) return null;

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid, 'guides', guideId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Guide;
      }
    } catch (err) {
      console.warn('Firestore getGuideById error, checking local store:', err);
    }
  }

  const list = getLocalGuides(uid);
  return list.find((g) => g.id === guideId) || null;
}

/**
 * Save or update a guide.
 */
export async function saveGuide(uid: string, guide: Guide): Promise<Guide> {
  if (!uid) throw new Error('User session not initialized');

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid, 'guides', guide.id);
      await setDoc(docRef, guide, { merge: true });
    } catch (err) {
      console.warn('Firestore saveGuide error, falling back to local store:', err);
    }
  }

  const list = getLocalGuides(uid);
  const existingIdx = list.findIndex((g) => g.id === guide.id);
  if (existingIdx >= 0) {
    list[existingIdx] = guide;
  } else {
    list.unshift(guide);
  }
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  saveLocalGuides(uid, list);

  return guide;
}

/**
 * Mark a step completed and advance to next step or complete guide.
 */
export async function completeStep(
  uid: string,
  guideId: string,
  stepIndex: number
): Promise<Guide> {
  const guide = await getGuideById(uid, guideId);
  if (!guide) throw new Error('Guide not found');

  if (guide.steps[stepIndex]) {
    guide.steps[stepIndex].completed = true;
  }

  // If this was the last step, mark entire guide completed
  if (stepIndex >= guide.steps.length - 1) {
    guide.status = 'completed';
    guide.currentStepIndex = guide.steps.length - 1;
  } else {
    guide.currentStepIndex = stepIndex + 1;
    guide.status = 'active';
  }

  guide.updatedAt = Date.now();
  return await saveGuide(uid, guide);
}

/**
 * Move current step to a specific index (forward or backward).
 */
export async function setGuideStepIndex(
  uid: string,
  guideId: string,
  newStepIndex: number
): Promise<Guide> {
  const guide = await getGuideById(uid, guideId);
  if (!guide) throw new Error('Guide not found');

  const boundedIndex = Math.max(0, Math.min(newStepIndex, guide.steps.length - 1));
  guide.currentStepIndex = boundedIndex;
  guide.updatedAt = Date.now();
  return await saveGuide(uid, guide);
}

/**
 * Update guide status (active, completed, paused).
 */
export async function updateGuideStatus(
  uid: string,
  guideId: string,
  status: GuideStatus
): Promise<Guide> {
  const guide = await getGuideById(uid, guideId);
  if (!guide) throw new Error('Guide not found');

  guide.status = status;
  guide.updatedAt = Date.now();
  return await saveGuide(uid, guide);
}

/**
 * Delete a guide.
 */
export async function deleteGuide(uid: string, guideId: string): Promise<void> {
  if (!uid) throw new Error('User session not initialized');

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid, 'guides', guideId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteGuide error:', err);
    }
  }

  const list = getLocalGuides(uid).filter((g) => g.id !== guideId);
  saveLocalGuides(uid, list);
}
