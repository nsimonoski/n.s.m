import { create } from 'zustand';
import { FileResponseDto } from '@org/shared/contracts';
import { MonacoUtils } from '@org/shared/utils';
import { fileExplorerService } from '../services/file-explorer.service';

interface CodeEditorState {
  openFiles: MonacoUtils.OpenFile[];
  activeFilePath: string | null;
}

interface CodeEditorActions {
  openFile: (file: FileResponseDto) => void;
  openDiff: (file: FileResponseDto, originalContent: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  closeOthers: (path: string) => void;
  closeAll: () => void;
  closeSaved: () => void;
  closeToTheRight: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  restoreOpenFiles: () => Promise<void>;
}

export const useCodeEditorStore = create<CodeEditorState & CodeEditorActions>((set, get) => ({
  openFiles: [],
  activeFilePath: loadFromStorage().activeFilePath,

  openFile(file: FileResponseDto): void {
    const { openFiles } = get();

    if (openFiles.some((f) => f.path === file.path)) {
      set({ activeFilePath: file.path });
      saveToStorage({ openFilePaths: openFiles.map((f) => f.path), activeFilePath: file.path });
      return;
    }

    const updated = [...openFiles, MonacoUtils.mapFile(file)];
    set({ openFiles: updated, activeFilePath: file.path });
    saveToStorage({ openFilePaths: updated.map((f) => f.path), activeFilePath: file.path });
  },

  openDiff(file: FileResponseDto, originalContent: string): void {
    const { openFiles } = get();

    if (openFiles.some((f) => f.path === file.path && f.mode === 'diff')) {
      set({ activeFilePath: file.path });
      return;
    }

    const mapped: MonacoUtils.OpenFile = { ...MonacoUtils.mapFile(file), originalContent, mode: 'diff' };
    set({ openFiles: [...openFiles, mapped], activeFilePath: file.path });
  },

  closeFile(path: string): void {
    const { openFiles, activeFilePath } = get();
    const files = openFiles.filter((f) => f.path !== path);

    let newActive = activeFilePath;
    if (activeFilePath === path) {
      const closedIndex = openFiles.findIndex((f) => f.path === path);
      newActive = files[Math.min(closedIndex, files.length - 1)]?.path ?? null;
    }

    set({ openFiles: files, activeFilePath: newActive });
    saveToStorage({ openFilePaths: files.map((f) => f.path), activeFilePath: newActive });
  },

  setActiveFile(path: string): void {
    set({ activeFilePath: path });
    saveToStorage({ ...loadFromStorage(), activeFilePath: path });
  },

  closeOthers(path: string): void {
    const kept = get().openFiles.filter((f) => f.path === path);
    set({ openFiles: kept, activeFilePath: path });
    saveToStorage({ openFilePaths: kept.map((f) => f.path), activeFilePath: path });
  },

  closeAll(): void {
    set({ openFiles: [], activeFilePath: null });
    saveToStorage({ openFilePaths: [], activeFilePath: null });
  },

  closeSaved(): void {
    const { openFiles, activeFilePath } = get();
    const dirty = openFiles.filter((f) => f.isDirty);
    const activeStillOpen = dirty.some((f) => f.path === activeFilePath);
    const newActive = activeStillOpen ? activeFilePath : (dirty[0]?.path ?? null);

    set({ openFiles: dirty, activeFilePath: newActive });
    saveToStorage({ openFilePaths: dirty.map((f) => f.path), activeFilePath: newActive });
  },

  closeToTheRight(path: string): void {
    const { openFiles, activeFilePath } = get();
    const idx = openFiles.findIndex((f) => f.path === path);
    const kept = openFiles.slice(0, idx + 1);
    const activeStillOpen = kept.some((f) => f.path === activeFilePath);
    const newActive = activeStillOpen ? activeFilePath : path;

    set({ openFiles: kept, activeFilePath: newActive });
    saveToStorage({ openFilePaths: kept.map((f) => f.path), activeFilePath: newActive });
  },

  updateContent(path: string, content: string): void {
    set({
      openFiles: get().openFiles.map((f) =>
        f.path === path ? { ...f, currentContent: content, isDirty: content !== f.content } : f,
      ),
    });
  },

  async saveFile(path: string): Promise<void> {
    const file = get().openFiles.find((f) => f.path === path);
    if (!file) return;

    const saved = await fileExplorerService.updateFile({
      name: file.name,
      path: file.path,
      content: file.currentContent,
      type: file.type,
    } as FileResponseDto);

    set({
      openFiles: get().openFiles.map((f) =>
        f.path === saved.path
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
    const stored = loadFromStorage();
    if (stored.openFilePaths.length === 0) return;

    const files = await fileExplorerService.getFiles(stored.openFilePaths);
    const fileMap = new Map(files.map((f) => [f.path, f]));
    const openFiles = stored.openFilePaths
      .map((path) => fileMap.get(path))
      .filter((f): f is FileResponseDto => !!f)
      .map(MonacoUtils.mapFile);

    const activeFilePath = stored.activeFilePath ?? openFiles[0]?.path ?? null;
    set({ openFiles, activeFilePath });
    saveToStorage({ openFilePaths: openFiles.map((f) => f.path), activeFilePath });
  },
}));

interface StoredEditorState {
  openFilePaths: string[];
  activeFilePath: string | null;
}

function loadFromStorage(): StoredEditorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { openFilePaths: [], activeFilePath: null };
    return JSON.parse(raw);
  } catch {
    return { openFilePaths: [], activeFilePath: null };
  }
}

function saveToStorage(data: StoredEditorState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const STORAGE_KEY = 'editor';
