import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { Reminder } from '@/types/reminder';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

function getLocalStorageKey(uid: string): string {
  return `saathi_reminders_${uid}`;
}

function getLocalReminders(uid: string): Reminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalStorageKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read local reminders:', err);
    return [];
  }
}

function saveLocalReminders(uid: string, reminders: Reminder[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getLocalStorageKey(uid), JSON.stringify(reminders));
}

/**
 * Fetch all reminders for user, sorted by dueTimestamp ascending.
 */
export async function getReminders(uid: string): Promise<Reminder[]> {
  if (!uid) return [];

  if (db && isFirebaseConfigured) {
    try {
      const remindersRef = collection(db, 'users', uid, 'reminders');
      const q = query(remindersRef, orderBy('dueTimestamp', 'asc'));
      const snapshot = await getDocs(q);
      const list: Reminder[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Reminder);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getReminders error, checking local store:', err);
      return getLocalReminders(uid);
    }
  }

  return getLocalReminders(uid);
}

/**
 * Save or update a reminder.
 */
export async function saveReminder(uid: string, reminder: Reminder): Promise<Reminder> {
  if (!uid) throw new Error('User session not initialized');

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid, 'reminders', reminder.id);
      await setDoc(docRef, reminder, { merge: true });
    } catch (err) {
      console.warn('Firestore saveReminder error, falling back to local store:', err);
    }
  }

  // Always mirror in local store for offline availability & immediate consistency
  const list = getLocalReminders(uid);
  const existingIdx = list.findIndex((r) => r.id === reminder.id);
  if (existingIdx >= 0) {
    list[existingIdx] = reminder;
  } else {
    list.push(reminder);
  }
  list.sort((a, b) => a.dueTimestamp - b.dueTimestamp);
  saveLocalReminders(uid, list);

  return reminder;
}

/**
 * Toggle reminder completion status.
 */
export async function toggleReminderComplete(
  uid: string,
  reminderId: string,
  completed: boolean
): Promise<void> {
  if (!uid) throw new Error('User session not initialized');

  const list = getLocalReminders(uid);
  const target = list.find((r) => r.id === reminderId);
  if (!target) throw new Error('Reminder not found');

  target.completed = completed;
  target.completedAt = completed ? Date.now() : null;
  target.updatedAt = Date.now();

  await saveReminder(uid, target);
}

/**
 * Delete a reminder.
 */
export async function deleteReminder(uid: string, reminderId: string): Promise<void> {
  if (!uid) throw new Error('User session not initialized');

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid, 'reminders', reminderId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteReminder error:', err);
    }
  }

  const list = getLocalReminders(uid).filter((r) => r.id !== reminderId);
  saveLocalReminders(uid, list);
}
