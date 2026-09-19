'use client';

import React from 'react';
import { useAccessibility } from '@/features/accessibility/context';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';

export interface SpeechButtonProps {
  textToRead: string;
  label?: string;
  className?: string;
}

export function SpeechButton({
  textToRead,
  label = 'Read aloud',
  className,
}: SpeechButtonProps) {
  const { isSpeechSupported, isSpeaking, speakText, stopSpeaking } = useAccessibility();

  // If browser does not genuinely support Web Speech API, hide control completely!
  if (!isSpeechSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(textToRead);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="small"
      onClick={handleClick}
      aria-label={isSpeaking ? 'Stop reading aloud' : `${label}`}
      className={className}
      leftIcon={
        isSpeaking ? (
          <VolumeX className="w-5 h-5 text-amber-700 animate-pulse" />
        ) : (
          <Volume2 className="w-5 h-5 text-stone-700" />
        )
      }
    >
      {isSpeaking ? 'Stop reading' : label}
    </Button>
  );
}
