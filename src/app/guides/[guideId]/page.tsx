'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context';
import { useLanguage } from '@/i18n/context';
import {
  getGuideById,
  completeStep,
  setGuideStepIndex,
  updateGuideStatus,
  deleteGuide,
} from '@/features/persistence/guides';
import { Guide } from '@/types/guide';
import { StepViewer } from '@/components/guides/StepViewer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';

export default function GuideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { uid, isLoaded } = useAuth();
  const { t } = useLanguage();
  const guideId = params.guideId as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !uid || !guideId) return;

    let isMounted = true;
    getGuideById(uid, guideId)
      .then((g) => {
        if (isMounted) {
          if (!g) {
            setError('This guided task could not be found.');
          } else {
            setGuide(g);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading guide:', err);
          setError('Failed to load guide.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [uid, isLoaded, guideId]);

  const handleStepComplete = async (stepIndex: number) => {
    if (!uid || !guide) return;
    const updated = await completeStep(uid, guide.id, stepIndex);
    setGuide(updated);
  };

  const handleStepChange = async (newIndex: number) => {
    if (!uid || !guide) return;
    const updated = await setGuideStepIndex(uid, guide.id, newIndex);
    setGuide(updated);
  };

  const handleGuideStatusChange = async (status: 'active' | 'completed' | 'paused') => {
    if (!uid || !guide) return;
    const updated = await updateGuideStatus(uid, guide.id, status);
    setGuide(updated);
  };

  const handleDelete = async () => {
    if (!uid || !guide) return;
    setIsDeleting(true);
    try {
      await deleteGuide(uid, guide.id);
      setIsDeleteModalOpen(false);
      router.push('/guides');
    } catch (err) {
      console.error('Failed to delete guide:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-xl font-bold text-stone-700">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <Card className="flex flex-col items-center text-center p-8 gap-4 max-w-xl mx-auto border-2 border-stone-300">
        <AlertCircle className="w-12 h-12 text-rose-600" />
        <h1 className="text-2xl font-bold text-stone-900">Task Not Found</h1>
        <p className="text-lg text-stone-600">
          {error || 'This guide does not exist or may have been removed.'}
        </p>
        <Button variant="primary" size="default" onClick={() => router.push('/guides')}>
          {t('guides.detail.allGuides')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="small"
          onClick={() => router.push('/guides')}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
        >
          {t('guides.detail.allGuides')}
        </Button>

        <Button
          variant="ghost"
          size="small"
          onClick={() => setIsDeleteModalOpen(true)}
          leftIcon={<Trash2 className="w-5 h-5 text-rose-600" />}
          className="text-rose-700 hover:bg-rose-50"
        >
          {t('guides.detail.deleteTask')}
        </Button>
      </div>

      {/* Active Step Viewer */}
      <StepViewer
        guide={guide}
        onStepComplete={handleStepComplete}
        onStepChange={handleStepChange}
        onGuideStatusChange={handleGuideStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('guides.detail.deleteConfirmTitle')}
        description={t('guides.detail.deleteConfirmDesc')}
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            {t('guides.detail.keepTask')}
          </Button>
          <Button
            variant="danger"
            size="default"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            {isDeleting ? t('common.loading') : t('guides.detail.confirmDelete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
