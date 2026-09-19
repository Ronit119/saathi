'use client';

import React, { useState } from 'react';
import { Reminder } from '@/types/reminder';
import { useLanguage } from '@/i18n/context';
import { formatRelativeLocaleDay } from '@/i18n/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Check, Trash2, Calendar } from 'lucide-react';

export interface ReminderItemProps {
  reminder: Reminder;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ReminderItem({
  reminder,
  onToggleComplete,
  onDelete,
}: ReminderItemProps) {
  const { t, uiLocale } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());

  const handleCheck = async () => {
    setIsUpdating(true);
    try {
      await onToggleComplete(reminder.id, !reminder.completed);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(reminder.id);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isPast = reminder.dueTimestamp < currentTimestamp && !reminder.completed;

  return (
    <>
      <Card
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 transition-colors ${
          reminder.completed
            ? 'bg-stone-50 border-stone-200 opacity-80'
            : isPast
            ? 'border-amber-400 bg-amber-50/50'
            : 'border-stone-300 bg-white hover:border-amber-400'
        }`}
      >
        <div className="flex items-start gap-3.5 flex-1">
          {/* Large touch-friendly Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={reminder.completed}
            aria-label={`${t('reminders.markDone')}: ${reminder.title}`}
            onClick={handleCheck}
            disabled={isUpdating}
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-colors cursor-pointer focus-visible:outline-none ${
              reminder.completed
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-stone-400 bg-white hover:border-emerald-600'
            }`}
          >
            {reminder.completed && <Check className="w-5 h-5 stroke-[3]" />}
          </button>

          <div className="flex flex-col gap-1">
            <h3
              className={`text-xl font-bold ${
                reminder.completed
                  ? 'line-through text-stone-500'
                  : 'text-stone-900'
              }`}
            >
              {reminder.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-stone-600">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>{formatRelativeLocaleDay(reminder.dueTimestamp, uiLocale)}</span>

              {isPast && (
                <Badge variant="warning" className="text-xs">
                  Past due
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Delete Action Button */}
        <Button
          variant="ghost"
          size="small"
          onClick={() => setIsDeleteModalOpen(true)}
          leftIcon={<Trash2 className="w-5 h-5 text-rose-600" />}
          className="text-rose-700 hover:bg-rose-50 self-end sm:self-center"
          aria-label={`${t('reminders.delete')}: ${reminder.title}`}
        >
          {t('reminders.delete')}
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete this reminder?"
        description={`"${reminder.title}"`}
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="default"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            {isDeleting ? t('common.loading') : t('reminders.delete')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
