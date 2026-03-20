import { create } from 'zustand';
import type { GitStatusTreeResponseDto } from '@org/shared/contracts';
import { gitService } from '../services/git.service';
import { useAuthStore } from './auth.store';

interface GitStatusState {
  rootPath: string;
  branch: string;
  tracking: boolean;
  stagedCount: number;
  changesCount: number;
  ahead: number;
  behind: number;
}

interface GitStatusActions {
  updateGitStatus: (partial: Partial<GitStatusState>) => void;
  loadGitStatus: () => Promise<void>;
  init: () => void;
}

function getRootPath(): string {
  return useAuthStore.getState().workspace?.rootPath ?? '';
}

export const useGitStatusStore = create<GitStatusState & GitStatusActions>((set, get) => ({
  rootPath: '',
  branch: '',
  tracking: true,
  stagedCount: 0,
  changesCount: 0,
  ahead: 0,
  behind: 0,

  updateGitStatus(partial) {
    set(partial);
  },

  async loadGitStatus() {
    const rootPath = get().rootPath;
    if (!rootPath) return;

    const status: GitStatusTreeResponseDto = await gitService.getStatusTree(rootPath);
    set({
      branch: status.branch,
      tracking: status.tracking,
      stagedCount: status.stagedCount,
      changesCount: status.changesCount,
      ahead: status.ahead,
      behind: status.behind,
    });
  },

  init() {
    const rootPath = getRootPath();
    set({ rootPath });
  },
}));
