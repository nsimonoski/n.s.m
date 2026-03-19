import { create } from 'zustand';
import { FileResponseDto } from '@org/shared/contracts';
import { MonacoUtils, TabManager } from '@org/shared/utils';
import { fileExplorerService } from '../services/file-explorer.service';
import { browserStorage } from '@org/shared/utils';

interface CodeEditorState {
  openFiles: MonacoUtils.OpenFile[];
  activeTabId: string | null;
}

interface CodeEditorActions {
  openFile: (file: FileResponseDto) => void;
  fetchAndOpenFile: (path: string) => Promise<void>;
  openDiff: (file: FileResponseDto, originalContent: string) => void;
  closeFile: (tabId: string) => void;
  setActiveFile: (tabId: string) => void;
  closeOthers: (tabId: string) => void;
  closeAll: () => void;
  closeSaved: () => void;
  closeToTheRight: (tabId: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  restoreOpenFiles: () => Promise<void>;
}

interface StoredEditorState {
  openFilePaths: string[];
  activeTabId: string | null;
}

const storage = browserStorage<StoredEditorState>('editor');

export const useCodeEditorStore = create<CodeEditorState & CodeEditorActions>((set, get) => ({
  openFiles: [],
  activeTabId: storage.load()?.activeTabId ?? null,

  openFile(file: FileResponseDto): void {
    const { openFiles } = get();
    const tabId = MonacoUtils.createTabId(file.path, 'regular');

    if (openFiles.some((f) => f.tabId === tabId)) {
      set({ activeTabId: tabId });
      persistState(openFiles, tabId);
      return;
    }

    const updated = [...openFiles, MonacoUtils.mapFile(file)];
    set({ openFiles: updated, activeTabId: tabId });
    persistState(updated, tabId);
  },

  async fetchAndOpenFile(path: string): Promise<void> {
    const file = await fileExplorerService.getFile(path);
    get().openFile(file);
  },

  openDiff(file: FileResponseDto, originalContent: string): void {
    const { openFiles } = get();
    const tabId = MonacoUtils.createTabId(file.path, 'diff');

    if (openFiles.some((f) => f.tabId === tabId)) {
      set({ activeTabId: tabId });
      return;
    }

    const mapped: MonacoUtils.OpenFile = {
      ...MonacoUtils.mapFile(file),
      tabId,
      originalContent,
      mode: 'diff',
    };
    set({ openFiles: [...openFiles, mapped], activeTabId: tabId });
  },

  closeFile(tabId: string): void {
    const result = TabManager.closeTab(get().openFiles, get().activeTabId, tabId);
    set({ openFiles: result.items, activeTabId: result.activeTabId });
    persistState(result.items, result.activeTabId);
  },

  setActiveFile(tabId: string): void {
    set({ activeTabId: tabId });
    storage.save({ activeTabId: tabId });
  },

  closeOthers(tabId: string): void {
    const result = TabManager.closeOtherTabs(get().openFiles, tabId);
    set({ openFiles: result.items, activeTabId: result.activeTabId });
    persistState(result.items, result.activeTabId);
  },

  closeAll(): void {
    const result = TabManager.closeAllTabs();
    set({ openFiles: result.items, activeTabId: result.activeTabId });
    persistState(result.items, result.activeTabId);
  },

  closeSaved(): void {
    const result = TabManager.closeSavedTabs(get().openFiles, get().activeTabId);
    set({ openFiles: result.items, activeTabId: result.activeTabId });
    persistState(result.items, result.activeTabId);
  },

  closeToTheRight(tabId: string): void {
    const result = TabManager.closeTabsToTheRight(get().openFiles, get().activeTabId, tabId);
    set({ openFiles: result.items, activeTabId: result.activeTabId });
    persistState(result.items, result.activeTabId);
  },

  updateContent(path: string, content: string): void {
    set({
      openFiles: get().openFiles.map((f) =>
        f.path === path && f.mode === 'regular'
          ? { ...f, currentContent: content, isDirty: content !== f.content }
          : f,
      ),
    });
  },

  async saveFile(path: string): Promise<void> {
    const file = get().openFiles.find((f) => f.path === path && f.mode === 'regular');
    if (!file) return;

    const saved = await fileExplorerService.updateFile({
      name: file.name,
      path: file.path,
      content: file.currentContent,
      type: file.type,
    } as FileResponseDto);

    set({
      openFiles: get().openFiles.map((f) =>
        f.path === saved.path && f.mode === 'regular'
          ? {
              ...f,
              content: saved.content ?? f.currentContent,
              currentContent: saved.content ?? f.currentContent,
              isDirty: false,
              updatedAt: saved.updatedAt,
            }
          : f,
      ),
    });
  },

  async restoreOpenFiles(): Promise<void> {
    const stored = storage.load();
    const paths = stored?.openFilePaths ?? [];
    if (paths.length === 0) return;

    const files = await fileExplorerService.getFiles(paths);
    const fileMap = new Map(files.map((f) => [f.path, f]));
    const openFiles = paths
      .map((path) => fileMap.get(path))
      .filter((f): f is FileResponseDto => !!f)
      .map(MonacoUtils.mapFile);

    const activeTabId = stored?.activeTabId ?? openFiles[0]?.tabId ?? null;
    set({ openFiles, activeTabId });
    persistState(openFiles, activeTabId);
  },
}));

function persistState(items: MonacoUtils.OpenFile[], activeTabId: string | null): void {
  storage.save({
    openFilePaths: items.filter((f) => f.mode === 'regular').map((f) => f.path),
    activeTabId,
  });
}
