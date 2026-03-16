import { create } from 'zustand';
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

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  profile: null,
  workspace: null,
  isLoading: false,
  errorMessage: '',

  async getLoginInfo(): Promise<boolean> {
    if (get().profile) return true;

    set({ isLoading: true, errorMessage: '' });
    try {
      const session = await authService.getLoginInfo();
      if (session) {
        set({ profile: session.profile, workspace: session.workspace, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ profile: null, workspace: null, isLoading: false });
      return false;
    }
  },

  async guestLogin(): Promise<void> {
    set({ isLoading: true, errorMessage: '' });
    try {
      await authService.guestLogin();
      const session = await authService.getLoginInfo();
      if (session) {
        set({ profile: session.profile, workspace: session.workspace, isLoading: false });
      }
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
      set({ isLoading: false, errorMessage: 'Failed to clone repository. Check the URL and try again.' });
    }
  },

  async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.clear();
    set({ profile: null, workspace: null });
  },

  githubAuthUrl(): string {
    return authService.getGithubAuthUrl();
  },
}));
