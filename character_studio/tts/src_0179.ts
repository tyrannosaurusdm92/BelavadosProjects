import { produce } from 'immer';
import { create } from 'zustand';

import { storeMiddleware } from './middleware';

export interface SessionState {
  platform: string;
  speaker: string;
  language: string;
  speed: number;
  currentTime: number;
  duration: number;
  volume: number;
  text: string;
  isEditing: boolean;
  speechToText: string;
  speechCloneText: string;
  audio: Blob | null;
  audioSrc: string;
  id: string;
  createdAt: number;
  updatedAt: number;
  isPlaying: boolean;
  isTextToSpeechGenerating: boolean;
  isFileToSpeech: boolean;
  genBy: string;
}

interface SessionActions {
  updateSession: (updates: Partial<SessionState>) => void;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  storeMiddleware<SessionStore>(
    (set) => ({
      platform: '',
      speaker: '',
      language: '',
      speed: 1,
      currentTime: 0,
      duration: 0,
      volume: 1,
      text: '',
      speechToText: '',
      speechCloneText: '',
      audio: null,
      audioSrc: '',
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isEditing: false,
      isPlaying: false,
      isTextToSpeechGenerating: false,
      isFileToSpeech: false,
      genBy: '',
      updateSession: (updates: Partial<SessionState>) =>
        set(
          produce((state: SessionState) => {
            Object.assign(state, updates);
            state.updatedAt = Date.now();
          })
        ),
    }),
    'session-store'
  )
);
