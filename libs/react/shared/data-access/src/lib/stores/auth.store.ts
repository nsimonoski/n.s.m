import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfileDto, WorkspaceStatusDto } from '@org/shared/contracts';
import { authService } from '../services/auth.service';
import { workspaceService } from '../services/workspace.service';

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
        try {
          const profile = await authService.getLoginInfo();
          if (profile) {
            set({ profile, isLoading: false });
            return true;
          }
          set({ profile: null, isLoading: false });
          return false;
        } catch {
          set({ profile: null, isLoading: false });
          return false;
        }
      },

      async guestLogin(): Promise<void> {
        set({ isLoading: true, errorMessage: '' });
        try {
          const profile = await authService.guestLogin();
          const workspace = await workspaceService.cloneDemoRepo();
          set({ profile, workspace, isLoading: false });
        } catch {
          set({ isLoading: false, errorMessage: 'Failed to start guest session' });
        }
      },

      async cloneRepo(repoUrl: string): Promise<void> {
        set({ isLoading: true, errorMessage: '' });
        try {
          const workspace = await workspaceService.cloneRepo(repoUrl);
          set({ workspace, isLoading: false });
        } catch {
          set({
            isLoading: false,
            errorMessage: 'Failed to clone repository. Check the URL and try again.',
          });
        }
      },

      async logout(): Promise<void> {
        try {
          await authService.logout();
        } catch {
          // ignore
        }
        useAuthStore.persist.clearStorage();
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
