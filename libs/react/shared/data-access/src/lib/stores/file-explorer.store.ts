import { create } from 'zustand';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { fileExplorerService } from '../services/file-explorer.service';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

interface FileExplorerState {
  directory: DirectoryResponseDto | null;
  loading: boolean;
}

interface FileExplorerActions {
  loadDirectory: (path: string) => Promise<void>;
  expandDirectory: (path: string) => Promise<void>;
  revealFile: (filePath: string) => Promise<{ ancestors: string[]; filePath: string } | null>;
  rename: (payload: RenameRequestDto) => Promise<void>;
  createFile: (path: string) => Promise<FileResponseDto>;
  createDirectory: (path: string) => Promise<DirectoryResponseDto>;
  deleteNode: (path: string) => Promise<void>;
  refreshParentDirectory: (childPath: string) => Promise<void>;
}

export const useFileExplorerStore = create<FileExplorerState & FileExplorerActions>((set, get) => ({
  directory: null,
  loading: false,

  async loadDirectory(path: string): Promise<void> {
    set({ loading: true });
    const directory = await fileExplorerService.readDirectory(path);
    set({ directory, loading: false });
  },

  async expandDirectory(path: string): Promise<void> {
    const fetched = await fileExplorerService.readDirectory(path);
    const currentDir = get().directory;
    if (!fetched || !currentDir) return;

    set({ directory: FileUtils.mergeDirectoryIntoTree(currentDir, fetched.path, fetched) });
  },

  async revealFile(filePath: string): Promise<{ ancestors: string[]; filePath: string } | null> {
    const rootPath = get().directory?.path;
    if (!rootPath) return null;

    const ancestors = FileUtils.getAncestorPaths(rootPath, filePath);

    for (const dirPath of ancestors) {
      const currentDir = get().directory;
      if (!currentDir || !FileUtils.isDirectoryLoaded(currentDir, dirPath)) {
        const fetched = await fileExplorerService.readDirectory(dirPath);
        const dirAfterFetch = get().directory;
        if (dirAfterFetch) {
          set({ directory: FileUtils.mergeDirectoryIntoTree(dirAfterFetch, fetched.path, fetched) });
        }
      }
    }

    return { ancestors, filePath };
  },

  async rename(payload: RenameRequestDto): Promise<void> {
    const result = await fileExplorerService.rename(payload);
    if (result) await get().refreshParentDirectory(result.path);
  },

  async createFile(path: string): Promise<FileResponseDto> {
    const file = await fileExplorerService.createFile(path);
    await get().refreshParentDirectory(file.path);
    return file;
  },

  async createDirectory(path: string): Promise<DirectoryResponseDto> {
    const directory = await fileExplorerService.createDirectory(path);
    await get().refreshParentDirectory(directory.path);
    return directory;
  },

  async deleteNode(path: string): Promise<void> {
    const result = await fileExplorerService.delete(path);
    await get().refreshParentDirectory(result.path);
  },

  async refreshParentDirectory(childPath: string): Promise<void> {
    const parentPath = childPath.substring(0, childPath.lastIndexOf('/'));
    const targetPath = parentPath || get().directory?.path;
    if (!targetPath || !get().directory) return;

    const fetched = await fileExplorerService.readDirectory(targetPath);
    const currentDir = get().directory;
    if (!fetched || !currentDir) return;

    set({ directory: FileUtils.refreshDirectoryInTree(currentDir, targetPath, fetched) });
  },
}));

export function initFileExplorer(): void {
  const store = useFileExplorerStore.getState();
  store.loadDirectory(ROOT_PATH);
}

