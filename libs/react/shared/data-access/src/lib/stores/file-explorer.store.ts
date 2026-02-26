import { create } from 'zustand';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { fileExplorerService } from '../services/file-explorer.service';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

interface FileExplorerState {
  directory: DirectoryResponseDto | null;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  loading: boolean;
}

interface FileExplorerActions {
  loadDirectory: (path: string) => Promise<void>;
  expandDirectory: (path: string) => Promise<void>;
  toggleExpanded: (path: string) => void;
  selectNode: (path: string | null) => void;
  revealFile: (filePath: string) => Promise<void>;
  rename: (payload: RenameRequestDto) => Promise<void>;
  createFile: (path: string) => Promise<FileResponseDto>;
  createDirectory: (path: string) => Promise<DirectoryResponseDto>;
  deleteNode: (path: string) => Promise<void>;
  refreshParentDirectory: (childPath: string) => Promise<void>;
}

export const useFileExplorerStore = create<FileExplorerState & FileExplorerActions>((set, get) => ({
  directory: null,
  expandedPaths: new Set(),
  selectedPath: null,
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

  toggleExpanded(path: string): void {
    const expanded = new Set(get().expandedPaths);
    expanded.has(path) ? expanded.delete(path) : expanded.add(path);
    set({ expandedPaths: expanded });
  },

  selectNode(path: string | null): void {
    set({ selectedPath: path });
  },

  async revealFile(filePath: string): Promise<void> {
    const rootPath = get().directory?.path;
    if (!rootPath) return;

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

    const expanded = new Set(get().expandedPaths);
    ancestors.forEach((p) => expanded.add(p));
    set({ expandedPaths: expanded, selectedPath: filePath });
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

