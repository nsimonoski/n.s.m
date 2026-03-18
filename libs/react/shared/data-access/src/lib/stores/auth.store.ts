import { create } from 'zustand';
import type { UserProfileDto, WorkspaceStatusDto } from '@org/shared/contracts';
import { authService } from '../services/auth.service';
import { workspaceService } from '../services/workspace.service';

const STORAGE_KEY = 'auth';

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

function loadFromStorage(): Pick<AuthState, 'profile' | 'workspace'> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data: Partial<Pick<AuthState, 'profile' | 'workspace'>>): void {
  const existing = loadFromStorage();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
}

const cached = loadFromStorage();

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  profile: cached?.profile ?? null,
  workspace: cached?.workspace ?? null,
  isLoading: false,
  errorMessage: '',

  async getLoginInfo(): Promise<boolean> {
    if (get().profile) return true;

    set({ isLoading: true, errorMessage: '' });
    try {
      const profile = await authService.getLoginInfo();
      if (profile) {
        saveToStorage({ profile });
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
      saveToStorage({ profile, workspace });
      set({ profile, workspace, isLoading: false });
    } catch {
      set({ isLoading: false, errorMessage: 'Failed to start guest session' });
    }
  },

  async cloneRepo(repoUrl: string): Promise<void> {
    set({ isLoading: true, errorMessage: '' });
    try {
      const workspace = await workspaceService.cloneRepo(repoUrl);
      saveToStorage({ workspace });
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
    localStorage.removeItem(STORAGE_KEY);
    set({ profile: null, workspace: null });
  },

  githubAuthUrl(): string {
    return authService.getGithubAuthUrl();
  },
}));
