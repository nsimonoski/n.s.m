import { create } from 'zustand';
import type { DirectoryResponseDto } from '@org/shared/contracts';
import { gitService } from '../services/git.service';
import { fileExplorerService } from '../services/file-explorer.service';
import { useGitStatusStore } from './git-status.store';
import { useCodeEditorStore } from './code-editor.store';

interface GitChangesState {
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
  isLoading: boolean;
}

interface GitChangesActions {
  getStatus: () => Promise<void>;
  stage: (paths: string[]) => Promise<void>;
  unstage: (paths: string[]) => Promise<void>;
  discard: (paths: string[]) => Promise<void>;
  stash: () => Promise<void>;
  stashPop: () => Promise<void>;
  stashApply: () => Promise<void>;
  openDiff: (filePath: string) => Promise<void>;
  applyStatusUpdate: (tree: DirectoryResponseDto, statusMap: Record<string, string>) => void;
}

function getRootPath(): string {
  return useGitStatusStore.getState().rootPath;
}

export const useGitChangesStore = create<GitChangesState & GitChangesActions>((set) => ({
  changesTree: null,
  statusMap: {},
  isLoading: false,

  async getStatus() {
    const rootPath = getRootPath();
    if (!rootPath) return;

    set({ isLoading: true });
    const { success, data } = await gitService.getStatusTree(rootPath);
    set({ isLoading: false });
    if (!success) return;

    set({ changesTree: data.tree, statusMap: data.statusMap });
    useGitStatusStore.getState().updateGitStatus({
      branch: data.branch,
      tracking: data.tracking,
      stagedCount: data.stagedCount,
      changesCount: data.changesCount,
      ahead: data.ahead,
      behind: data.behind,
    });
  },

  async stage(paths) {
    await gitService.stage(getRootPath(), paths);
  },

  async unstage(paths) {
    await gitService.unstage(getRootPath(), paths);
  },

  async discard(paths) {
    await gitService.discard(getRootPath(), paths);
  },

  async stash() {
    await gitService.stash(getRootPath());
  },

  async stashPop() {
    await gitService.stashPop(getRootPath());
  },

  async stashApply() {
    await gitService.stashApply(getRootPath());
  },

  async openDiff(filePath) {
    const rootPath = getRootPath();
    const [headContent, currentFile] = await Promise.all([
      gitService.showDiff(rootPath, filePath),
      fileExplorerService.getFile(`${rootPath}/${filePath}`),
    ]);
    if (!headContent.success || !currentFile.success) return;
    useCodeEditorStore.getState().openDiff(currentFile.data, headContent.data.content);
  },

  applyStatusUpdate(tree, statusMap) {
    set({ changesTree: tree, statusMap });
  },
}));
