'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'uploading'
  | 'transcribing'
  | 'ready'
  | 'processing'
  | 'speaking'
  | 'error';

export interface RecordedAudioResult {
  blob: Blob;
  mimeType: string;
  duration: number; // in seconds
}

export interface UseVoiceRecorderResult {
  state: RecorderState;
  setState: (state: RecorderState) => void;
  errorMessage: string | null;
  recordingDuration: number;
  selectedMimeType: string;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<RecordedAudioResult | null>;
  cancelRecording: () => void;
  isSupported: boolean;
}

const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/aac',
];

export function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return '';
  }
  for (const candidate of CANDIDATE_MIME_TYPES) {
    try {
      if (window.MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore browser compatibility check errors
    }
  }
  return '';
}

const MAX_RECORDING_SECONDS = 60;
const MIN_DURATION_SECONDS = 0.4;
const MIN_BLOB_SIZE_BYTES = 500;

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined';

  // Helper to stop all tracks immediately and turn off browser microphone indicator
  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping media track:', err);
        }
      });
      streamRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    stopAllTracks();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder during cancel:', err);
      }
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setState('idle');
    setErrorMessage(null);
  }, [stopAllTracks]);

  // Clean up on component unmount to guarantee no background listening
  useEffect(() => {
    return () => {
      stopAllTracks();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore unmount stop errors
        }
      }
    };
  }, [stopAllTracks]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setErrorMessage('Microphone recording is not supported on this browser.');
      setState('error');
      return false;
    }

    // Prevent starting while already recording or stopping
    if (state === 'recording' || state === 'stopping' || state === 'requesting_permission') {
      return false;
    }

    // Reset clean state
    cancelRecording();
    setState('requesting_permission');
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const negotiatedMime = getSupportedMimeType();
      setSelectedMimeType(negotiatedMime);

      const recorder = negotiatedMime
        ? new MediaRecorder(stream, { mimeType: negotiatedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;

      // Start recording
      recorder.start();
      startTimeRef.current = Date.now();
      setState('recording');

      // Start recording timer with automatic 60-second cutoff
      durationTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordingDuration(Math.round(elapsed));

        if (elapsed >= MAX_RECORDING_SECONDS) {
          // Auto-stop at max limit
          if (recorder.state === 'recording') {
            try {
              recorder.stop();
            } catch (err) {
              console.warn('Error auto-stopping recorder at max limit:', err);
            }
          }
        }
      }, 500);

      return true;
    } catch (err: unknown) {
      stopAllTracks();
      console.error('Failed to access microphone:', err);
      const errorName = (err as Error).name;

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone access is turned off. Please allow microphone permissions in your browser to speak with Saathi.'
        );
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setErrorMessage("I couldn't find a microphone on this device.");
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setErrorMessage('Your microphone may be in use by another application.');
      } else if (errorName === 'AbortError') {
        setErrorMessage('Microphone connection was interrupted. Please try again.');
      } else if (errorName === 'SecurityError') {
        setErrorMessage('Microphone access is restricted by your browser settings.');
      } else {
        setErrorMessage('Could not open microphone. Please check your device settings.');
      }

      setState('error');
      return false;
    }
  }, [isSupported, state, cancelRecording, stopAllTracks]);

  const stopRecording = useCallback(async (): Promise<RecordedAudioResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cancelRecording();
        resolve(null);
        return;
      }

      setState('stopping');
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      const finalDuration = (Date.now() - startTimeRef.current) / 1000;
      setRecordingDuration(Math.round(finalDuration));

      recorder.onstop = () => {
        try {
          // Stop media stream tracks immediately
          stopAllTracks();

          const mimeType = recorder.mimeType || selectedMimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          // Reject empty or tiny recordings
          if (finalDuration < MIN_DURATION_SECONDS || audioBlob.size < MIN_BLOB_SIZE_BYTES) {
            setErrorMessage("I couldn't hear enough audio. Please tap the microphone and try speaking again.");
            setState('error');
            resolve(null);
            return;
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('[VoiceRecorder] Captured audio:', {
              mimeType,
              sizeBytes: audioBlob.size,
              durationSeconds: finalDuration.toFixed(2),
            });
          }

          setState('ready');
          resolve({
            blob: audioBlob,
            mimeType,
            duration: finalDuration,
          });
        } catch (err) {
          console.error('Error finalizing recording:', err);
          setErrorMessage('Could not process recorded audio. Please try again.');
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
  }, [cancelRecording, selectedMimeType, stopAllTracks]);

  return {
    state,
    setState,
    errorMessage,
    recordingDuration,
    selectedMimeType,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  };
}
