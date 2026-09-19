'use client';

import React from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/features/accessibility/context';
import { Eye, Type, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { preferences, updateTextSize, toggleHighContrast } = useAccessibility();

  const handleNextTextSize = () => {
    if (preferences.textSize === 'normal') {
      updateTextSize('large');
    } else if (preferences.textSize === 'large') {
      updateTextSize('xlarge');
    } else {
      updateTextSize('normal');
    }
  };

  const textSizeLabels = {
    normal: 'Normal Text (18px)',
    large: 'Large Text (21px)',
    xlarge: 'Extra Large Text (24px)',
  };

  return (
    <header className="w-full border-b border-stone-200 bg-white shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:rounded-xl focus-visible:outline-none"
          aria-label="Saathi Home"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">
              SAATHI
            </h1>
            <p className="text-sm sm:text-base font-medium text-stone-600">
              Your Everyday Digital Companion
            </p>
          </div>
        </Link>

        {/* Quick Accessibility Access */}
        <div className="flex items-center gap-2" role="region" aria-label="Quick accessibility controls">
          <Button
            variant="outline"
            size="small"
            onClick={handleNextTextSize}
            aria-label={`Current text size: ${textSizeLabels[preferences.textSize]}. Click to change.`}
            title="Click to cycle text size"
            leftIcon={<Type className="w-5 h-5 text-stone-700" />}
            className="text-sm font-bold min-h-[44px]"
          >
            <span className="hidden md:inline">Text: </span>
            <span className="capitalize">{preferences.textSize}</span>
          </Button>

          <Button
            variant={preferences.highContrast ? 'primary' : 'outline'}
            size="small"
            onClick={toggleHighContrast}
            aria-label={preferences.highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            title="Toggle high contrast"
            leftIcon={<Eye className="w-5 h-5" />}
            className="text-sm font-bold min-h-[44px]"
          >
            <span className="hidden md:inline">Contrast</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
