import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { SessionState } from './use-session-store';

interface SessionsState {
  sessions: SessionState[];
}

interface SessionsActions {
  addSession: (SessionState: SessionState) => void;
  searchSessions: (query: string) => SessionState[];
  deleteSessionById: (id: string) => void;
  deleteSessionInBatch: (ids: string[]) => void;
  deleteAllSessions: () => number;
  updateSessionById: (id: string, updates: Partial<SessionState>) => void;
  updateSessionInBatch: (
    updatesArray: { id: string; updates: Partial<SessionState> }[]
  ) => void;
  getSessionById: (id: string) => SessionState | null;
  getSessionByIndex: (index: number) => SessionState | null;
  getSessionIndexById: (id: string) => number;
  getSessionCount: () => number;
  getLastSession: () => SessionState | null;
  getFirstSession: () => SessionState | null;
}

type SessionsStore = SessionsState & SessionsActions;

export const useSessionsStore = create<SessionsStore>()(
  immer((set, get) => ({
    sessions: [],

    addSession: (SessionState) =>
      set((state) => {
        state.sessions.unshift(SessionState);
      }),

    searchSessions: (query) => {
      const { sessions } = get();

      if (!query) return sessions;

      return sessions.filter((SessionState) =>
        SessionState.text.toLowerCase().includes(query.toLowerCase())
      );
    },

    deleteSessionById: (id) =>
      set((state) => {
        state.sessions = state.sessions.filter((s) => s.id !== id);
      }),

    deleteSessionInBatch: (ids) =>
      set((state) => {
        state.sessions = state.sessions.filter((s) => !ids.includes(s.id));
      }),

    deleteAllSessions: () => {
      const count = get().sessions.length;

      set({ sessions: [] });

      return count;
    },

    updateSessionById: (id, updates) =>
      set((state) => {
        const index = state.sessions.findIndex((s) => s.id === id);

        if (index !== -1) {
          Object.assign(state.sessions[index], updates, {
            updatedAt: Date.now(),
          });
        }
      }),

    updateSessionInBatch: (updatesArray) =>
      set((state) => {
        updatesArray.forEach(({ id, updates }) => {
          const index = state.sessions.findIndex((s) => s.id === id);

          if (index !== -1) {
            Object.assign(state.sessions[index], updates, {
              updatedAt: Date.now(),
            });
          }
        });
      }),

    getSessionById: (id) => get().sessions.find((s) => s.id === id) ?? null,

    getSessionByIndex: (index) => get().sessions[index] ?? null,

    getSessionIndexById: (id) => get().sessions.findIndex((s) => s.id === id),

    getSessionCount: () => get().sessions.length,

    getLastSession: () => get().sessions[0] ?? null,

    getFirstSession: () => {
      const { sessions } = get();

      return sessions[sessions.length - 1] ?? null;
    },
  }))
);
