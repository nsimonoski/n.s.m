import { create } from 'zustand';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { fileExplorerService } from '../services/file-explorer.service';

interface FileExplorerState {
  directory: DirectoryResponseDto | null;
  loading: boolean;
}

interface FileExplorerActions {
  loadDirectory: (path: string) => Promise<void>;
  expandDirectory: (path: string) => Promise<void>;
  revealFile: (filePath: string) => Promise<{ ancestors: string[]; filePath: string } | null>;
  rename: (payload: RenameRequestDto) => Promise<void>;
  createFile: (path: string) => Promise<FileResponseDto | null>;
  createDirectory: (path: string) => Promise<DirectoryResponseDto | null>;
  deleteNode: (path: string) => Promise<void>;
  refreshParentDirectory: (childPath: string) => Promise<void>;
}

export const useFileExplorerStore = create<FileExplorerState & FileExplorerActions>((set, get) => ({
  directory: null,
  loading: false,

  async loadDirectory(path: string): Promise<void> {
    set({ loading: true });
    const { success, data } = await fileExplorerService.readDirectory(path);
    set({ directory: success ? data : null, loading: false });
  },

  async expandDirectory(path: string): Promise<void> {
    const { success, data } = await fileExplorerService.readDirectory(path);
    const currentDir = get().directory;
    if (!success || !currentDir) return;

    set({ directory: FileUtils.mergeDirectoryIntoTree(currentDir, data.path, data) });
  },

  async revealFile(filePath: string): Promise<{ ancestors: string[]; filePath: string } | null> {
    const rootPath = get().directory?.path;
    if (!rootPath) return null;

    const ancestors = FileUtils.getAncestorPaths(rootPath, filePath);

    for (const dirPath of ancestors) {
      const currentDir = get().directory;
      if (!currentDir || !FileUtils.isDirectoryLoaded(currentDir, dirPath)) {
        const { success, data } = await fileExplorerService.readDirectory(dirPath);
        const dirAfterFetch = get().directory;
        if (success && dirAfterFetch) {
          set({ directory: FileUtils.mergeDirectoryIntoTree(dirAfterFetch, data.path, data) });
        }
      }
    }

    return { ancestors, filePath };
  },

  async rename(payload: RenameRequestDto): Promise<void> {
    const { success, data } = await fileExplorerService.rename(payload);
    if (success) await get().refreshParentDirectory(data.path);
  },

  async createFile(path: string): Promise<FileResponseDto | null> {
    const { success, data } = await fileExplorerService.createFile(path);
    if (!success) return null;
    await get().refreshParentDirectory(data.path);
    return data;
  },

  async createDirectory(path: string): Promise<DirectoryResponseDto | null> {
    const { success, data } = await fileExplorerService.createDirectory(path);
    if (!success) return null;
    await get().refreshParentDirectory(data.path);
    return data;
  },

  async deleteNode(path: string): Promise<void> {
    const { success, data } = await fileExplorerService.delete(path);
    if (success) await get().refreshParentDirectory(data.path);
  },

  async refreshParentDirectory(childPath: string): Promise<void> {
    const parentPath = childPath.substring(0, childPath.lastIndexOf('/'));
    const targetPath = parentPath || get().directory?.path;
    if (!targetPath || !get().directory) return;

    const { success, data } = await fileExplorerService.readDirectory(targetPath);
    const currentDir = get().directory;
    if (!success || !currentDir) return;

    set({ directory: FileUtils.refreshDirectoryInTree(currentDir, targetPath, data) });
  },
}));
