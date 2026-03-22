import { create } from 'zustand';
import type { GitBranchDto } from '@org/shared/contracts';
import { gitService } from '../services/git.service';
import { useAuthStore } from './auth.store';
import { useSnackbarStore } from './snackbar.store';

interface GitStatusState {
  rootPath: string;
  branch: string;
  tracking: boolean;
  branches: GitBranchDto[];
  stagedCount: number;
  changesCount: number;
  ahead: number;
  behind: number;
}

interface GitStatusActions {
  updateGitStatus: (partial: Partial<GitStatusState>) => void;
  loadGitStatus: () => Promise<void>;
  listBranches: () => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (branch: string, sourceBranch?: string) => Promise<void>;
  init: () => void;
}

function getRootPath(): string {
  return useAuthStore.getState().workspace?.rootPath ?? '';
}

export const useGitStatusStore = create<GitStatusState & GitStatusActions>((set, get) => ({
  rootPath: '',
  branch: '',
  tracking: true,
  branches: [],
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

    const { success, data } = await gitService.getStatusTree(rootPath);
    if (!success) return;

    set({
      branch: data.branch,
      tracking: data.tracking,
      stagedCount: data.stagedCount,
      changesCount: data.changesCount,
      ahead: data.ahead,
      behind: data.behind,
    });
  },

  async listBranches() {
    const rootPath = get().rootPath;
    if (!rootPath) return;

    const { success, data } = await gitService.listBranches(rootPath);
    if (!success) return;

    const current = data.find((b) => b.current);
    set({ branches: data, ...(current ? { branch: current.name } : {}) });
  },

  async checkout(branch: string) {
    const rootPath = get().rootPath;
    if (!rootPath) return;

    const result = await gitService.checkout(rootPath, branch);
    if (!result.success) {
      useSnackbarStore.getState().error(result.error);
      return;
    }

    await get().listBranches();
  },

  async createBranch(branch: string, sourceBranch?: string) {
    const rootPath = get().rootPath;
    if (!rootPath) return;

    const result = await gitService.createBranch(rootPath, branch, sourceBranch);
    if (!result.success) {
      useSnackbarStore.getState().error(result.error);
      return;
    }

    await get().listBranches();
    useSnackbarStore.getState().success(`Branch "${get().branch}" created`);
  },

  init() {
    const rootPath = getRootPath();
    set({ rootPath });
    get().loadGitStatus();
  },
}));
