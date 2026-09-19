'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context';
import {
  getReminders,
  saveReminder,
  toggleReminderComplete,
  deleteReminder,
} from '@/features/persistence/reminders';
import { Reminder } from '@/types/reminder';
import { ReminderForm } from '@/components/reminders/ReminderForm';
import { ReminderItem } from '@/components/reminders/ReminderItem';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export default function RemindersPage() {
  const { uid, isLoaded } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !uid) return;

    let isMounted = true;
    getReminders(uid).then((list) => {
      if (isMounted) {
        setReminders(list);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded]);

  const handleCreateReminder = async (item: {
    title: string;
    originalInput: string;
    dueTimestamp: number;
    dueDateString: string;
  }) => {
    if (!uid) return;

    setIsSaving(true);
    try {
      const reminderId =
        'rem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

      const newReminder: Reminder = {
        id: reminderId,
        userId: uid,
        title: item.title,
        originalInput: item.originalInput,
        dueTimestamp: item.dueTimestamp,
        dueDateString: item.dueDateString,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveReminder(uid, newReminder);
      const updated = await getReminders(uid);
      setReminders(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    if (!uid) return;
    await toggleReminderComplete(uid, id, completed);
    const updated = await getReminders(uid);
    setReminders(updated);
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    await deleteReminder(uid, id);
    const updated = await getReminders(uid);
    setReminders(updated);
  };

  const upcomingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <Bell className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Reminders
            </h1>
            <p className="text-lg sm:text-xl text-stone-600">
              Never forget bills, appointments, or important personal tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Creation Form */}
      <ReminderForm onSave={handleCreateReminder} isLoading={isSaving} />

      {/* Upcoming Reminders */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-700" />
          <span>Upcoming Reminders</span>
          {upcomingReminders.length > 0 && (
            <Badge variant="warning">{upcomingReminders.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <p className="text-lg text-stone-600">Loading your reminders…</p>
        ) : upcomingReminders.length === 0 ? (
          <Card variant="subtle" className="text-center p-8 border-dashed border-2">
            <p className="text-xl font-bold text-stone-700 mb-2">
              Nothing you need to remember right now.
            </p>
            <p className="text-base text-stone-500 max-w-md mx-auto">
              Use the form above to add a reminder, like paying an electricity bill or taking medicine.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingReminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-stone-200">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            <span>Completed Reminders</span>
            <Badge variant="success">{completedReminders.length}</Badge>
          </h2>

          <div className="flex flex-col gap-3">
            {completedReminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
