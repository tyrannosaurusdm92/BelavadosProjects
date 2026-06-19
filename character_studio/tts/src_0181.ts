import { produce } from 'immer';
import { create } from 'zustand';

import { storeMiddleware } from './middleware';

interface UserState {
  language?: string;
}

interface UserActions {
  updateLanguage: (language: string) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  storeMiddleware<UserStore>(
    (set) => ({
      language: 'zh',
      updateLanguage: (language) =>
        set(
          produce((state) => {
            state.language = language;
          })
        ),
    }),
    'user-store'
  )
);
