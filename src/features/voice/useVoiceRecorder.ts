'use client';

import { useState, useRef, useCallback } from 'react';

export type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseVoiceRecorderResult {
  state: RecorderState;
  errorMessage: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<{ audioBase64: string; mimeType: string } | null>;
  cancelRecording: () => void;
  isSupported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined';

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder:', err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setState('idle');
    setErrorMessage(null);
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setErrorMessage('Microphone recording is not supported on this browser.');
      setState('error');
      return false;
    }

    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Pick supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        '',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (!m || MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // 100ms time slice
      setState('recording');
      return true;
    } catch (err: unknown) {
      console.error('Failed to access microphone:', err);
      const errorName = (err as Error).name;
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone access is turned off. Please allow microphone permissions in your browser to speak.'
        );
      } else if (errorName === 'NotFoundError') {
        setErrorMessage('No microphone was found on this device.');
      } else {
        setErrorMessage('Could not open microphone. Please check your device settings.');
      }
      setState('error');
      return false;
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<{ audioBase64: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cancelRecording();
        resolve(null);
        return;
      }

      setState('processing');

      recorder.onstop = async () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          // Release tracks immediately for privacy
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          if (audioBlob.size < 500) {
            // Less than half a kilobyte is basically empty
            setErrorMessage("I couldn't hear enough audio. Please tap the microphone and try again.");
            setState('error');
            resolve(null);
            return;
          }

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1] || result;
            setState('idle');
            resolve({ audioBase64: base64Data, mimeType });
          };
          reader.onerror = () => {
            setErrorMessage('Could not read recorded audio.');
            setState('error');
            resolve(null);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Error in onstop handler:', err);
          setState('error');
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error('Failed to stop recorder:', err);
        cancelRecording();
        resolve(null);
      }
    });
  }, [cancelRecording]);

  return {
    state,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  };
}
