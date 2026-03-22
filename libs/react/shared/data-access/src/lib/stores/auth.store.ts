import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfileDto, WorkspaceStatusDto } from '@org/shared/contracts';
import { browserStorage } from '@org/shared/utils';
import { authService } from '../services/auth.service';
import { workspaceService } from '../services/workspace.service';
import { useCodeEditorStore } from './code-editor.store';

interface AuthState {
  profile: UserProfileDto | null;
  workspace: WorkspaceStatusDto | null;
  isLoading: boolean;
  errorMessage: string;
}

interface AuthActions {
  getLoginInfo: () => Promise<boolean>;
  guestLogin: () => Promise<void>;
  cloneRepo: (repoUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  githubAuthUrl: () => string;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      profile: null,
      workspace: null,
      isLoading: false,
      errorMessage: '',

      async getLoginInfo(): Promise<boolean> {
        if (get().profile) return true;

        set({ isLoading: true, errorMessage: '' });
        const { success, data } = await authService.getLoginInfo();
        if (success && data) {
          set({ profile: data, isLoading: false });
          return true;
        }
        set({ profile: null, isLoading: false });
        return false;
      },

      async guestLogin(): Promise<void> {
        set({ isLoading: true, errorMessage: '' });
        const loginResult = await authService.guestLogin();
        if (!loginResult.success) {
          set({ isLoading: false, errorMessage: 'Failed to start guest session' });
          return;
        }
        const cloneResult = await workspaceService.cloneDemoRepo();
        if (!cloneResult.success) {
          set({ isLoading: false, errorMessage: 'Failed to start guest session' });
          return;
        }
        set({ profile: loginResult.data, workspace: cloneResult.data, isLoading: false });
      },

      async cloneRepo(repoUrl: string): Promise<void> {
        set({ isLoading: true, errorMessage: '' });
        const { success, data } = await workspaceService.cloneRepo(repoUrl);
        if (!success) {
          set({
            isLoading: false,
            errorMessage: 'Failed to clone repository. Check the URL and try again.',
          });
          return;
        }
        set({ workspace: data, isLoading: false });
      },

      async logout(): Promise<void> {
        await authService.logout();
        browserStorage('').clearAll();
        useCodeEditorStore.getState().closeAll();
        set({ profile: null, workspace: null });
      },

      githubAuthUrl(): string {
        return authService.getGithubAuthUrl();
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ profile: state.profile, workspace: state.workspace }),
    },
  ),
);
