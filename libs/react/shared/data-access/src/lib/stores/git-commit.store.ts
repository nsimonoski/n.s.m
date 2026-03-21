import { create } from 'zustand';
import type { GitLogEntryDto } from '@org/shared/contracts';
import { browserStorage } from '@org/shared/utils';
import { gitService } from '../services/git.service';
import { useGitStatusStore } from './git-status.store';

interface GitCommitState {
  commitMessage: string;
  commitHistory: GitLogEntryDto[];
  isCommitting: boolean;
  isPushing: boolean;
}

interface GitCommitActions {
  setCommitMessage: (msg: string) => void;
  commit: (msg: string) => Promise<void>;
  push: () => Promise<void>;
  fetchLog: () => Promise<void>;
  init: () => void;
}

interface StoredCommitState {
  commitMessage: string;
}

const storage = browserStorage<StoredCommitState>('git-explorer');

function getRootPath(): string {
  return useGitStatusStore.getState().rootPath;
}

export const useGitCommitStore = create<GitCommitState & GitCommitActions>((set, get) => ({
  commitMessage: storage.load()?.commitMessage ?? '',
  commitHistory: [],
  isCommitting: false,
  isPushing: false,

  setCommitMessage(msg: string) {
    set({ commitMessage: msg });
    storage.save({ commitMessage: msg });
  },

  async commit(msg: string) {
    const rootPath = getRootPath();
    if (!rootPath) return;

    set({ isCommitting: true });
    const { success } = await gitService.commit(rootPath, msg);
    set({ isCommitting: false });

    if (!success) return;

    set({ commitMessage: '' });
    storage.save({ commitMessage: '' });
    get().fetchLog();
  },

  async push() {
    const rootPath = getRootPath();
    if (!rootPath) return;

    set({ isPushing: true });
    await gitService.push(rootPath);
    set({ isPushing: false });
  },

  async fetchLog() {
    const rootPath = getRootPath();
    if (!rootPath) return;

    const { success, data } = await gitService.getLog(rootPath);
    if (!success) return;

    set({ commitHistory: data });
  },

  init() {
    get().fetchLog();
  },
}));
