'use client';

import React, { useState } from 'react';
import { Reminder } from '@/types/reminder';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeDay } from '@/lib/utils';
import { Check, Clock, Trash2, Calendar } from 'lucide-react';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const isPast = reminder.dueTimestamp < Date.now() && !reminder.completed;

  return (
    <>
      <Card
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 transition-colors ${
          reminder.completed
            ? 'bg-stone-50 border-stone-200 opacity-75'
            : isPast
            ? 'border-amber-400 bg-amber-50/40'
            : 'border-stone-300 bg-white hover:border-amber-400'
        }`}
      >
        <div className="flex items-start gap-3.5 flex-1">
          {/* Checkbox button */}
          <button
            type="button"
            onClick={handleCheck}
            disabled={isUpdating}
            role="checkbox"
            aria-checked={reminder.completed}
            aria-label={`Mark "${reminder.title}" as ${reminder.completed ? 'not completed' : 'completed'}`}
            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors mt-0.5 min-h-[40px] focus-visible:outline-none ${
              reminder.completed
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'border-stone-400 hover:border-emerald-600 bg-stone-50'
            }`}
          >
            {reminder.completed && <Check className="w-6 h-6 stroke-[3]" />}
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

            <div className="flex flex-wrap items-center gap-2 text-base text-stone-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-stone-500" />
                {formatRelativeDay(reminder.dueTimestamp)}
              </span>

              {isPast && (
                <Badge variant="warning" className="text-xs py-0.5">
                  Needs attention
                </Badge>
              )}

              {reminder.completed && (
                <Badge variant="success" className="text-xs py-0.5">
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Delete action */}
        <Button
          variant="ghost"
          size="small"
          onClick={() => setIsDeleteModalOpen(true)}
          aria-label={`Delete reminder: ${reminder.title}`}
          leftIcon={<Trash2 className="w-5 h-5 text-stone-400 hover:text-rose-600" />}
          className="text-stone-500 hover:text-rose-700 hover:bg-rose-50"
        >
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Reminder?"
        description={`Are you sure you want to delete "${reminder.title}"?`}
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="default"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete Reminder'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
