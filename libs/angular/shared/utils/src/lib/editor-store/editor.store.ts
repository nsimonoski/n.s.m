import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { Enums, FileResponseDto } from '@org/shared/contracts';
import { FileExplorerService } from '@org/angular-data-access';
import { getMonacoLanguage } from './language-map';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  currentContent: string;
  originalContent: string;
  language: string;
  type: Enums.FileType;
  extension?: string;
  mode: 'regular' | 'diff';
  isDirty: boolean;
  updatedAt: string;
}

interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
}

export const EditorStore = signalStore(
  { providedIn: 'root' },
  withState<EditorState>({
    openFiles: [],
    activeFilePath: null,
  }),
  withProps(() => ({
    fileService: inject(FileExplorerService),
  })),
  withComputed((state) => ({
    activeFile: computed(() => {
      const path = state.activeFilePath();
      return state.openFiles().find((f) => f.path === path) ?? null;
    }),
  })),
  withMethods((state) => {
    return {
      openFile(file: FileResponseDto): void {
        const existing = state.openFiles().find((f) => f.path === file.path);
        if (existing) {
          patchState(state, { activeFilePath: file.path });
          return;
        }

        const content = file.content ?? '';
        const language = getMonacoLanguage(file.type, file.extension);
        const openFile: OpenFile = {
          path: file.path,
          name: file.name,
          content,
          currentContent: content,
          originalContent: '',
          language,
          type: file.type,
          extension: file.extension,
          mode: 'regular',
          isDirty: false,
          updatedAt: file.updatedAt,
        };

        patchState(state, {
          openFiles: [...state.openFiles(), openFile],
          activeFilePath: file.path,
        });
      },

      openDiff(path: string, name: string, originalContent: string, modifiedContent: string, language: string): void {
        const existing = state.openFiles().find((f) => f.path === path && f.mode === 'diff');
        if (existing) {
          patchState(state, { activeFilePath: path });
          return;
        }

        const openFile: OpenFile = {
          path,
          name,
          content: modifiedContent,
          currentContent: modifiedContent,
          originalContent,
          language,
          type: Enums.FileType.OTHER,
          mode: 'diff',
          isDirty: false,
          updatedAt: '',
        };

        patchState(state, {
          openFiles: [...state.openFiles(), openFile],
          activeFilePath: path,
        });
      },

      closeFile(path: string): void {
        const files = state.openFiles().filter((f) => f.path !== path);
        let activePath = state.activeFilePath();

        if (activePath === path) {
          const closedIndex = state.openFiles().findIndex((f) => f.path === path);
          activePath = files[Math.min(closedIndex, files.length - 1)]?.path ?? null;
        }

        patchState(state, { openFiles: files, activeFilePath: activePath });
      },

      setActiveFile(path: string): void {
        patchState(state, { activeFilePath: path });
      },

      closeOthers(path: string): void {
        const kept = state.openFiles().filter((f) => f.path === path);
        patchState(state, { openFiles: kept, activeFilePath: path });
      },

      closeAll(): void {
        patchState(state, { openFiles: [], activeFilePath: null });
      },

      closeSaved(): void {
        const dirty = state.openFiles().filter((f) => f.isDirty);
        const activePath = state.activeFilePath();
        const activeStillOpen = dirty.some((f) => f.path === activePath);
        patchState(state, {
          openFiles: dirty,
          activeFilePath: activeStillOpen ? activePath : dirty[0]?.path ?? null,
        });
      },

      closeToTheRight(path: string): void {
        const idx = state.openFiles().findIndex((f) => f.path === path);
        const kept = state.openFiles().slice(0, idx + 1);
        const activePath = state.activeFilePath();
        const activeStillOpen = kept.some((f) => f.path === activePath);
        patchState(state, {
          openFiles: kept,
          activeFilePath: activeStillOpen ? activePath : path,
        });
      },

      updateContent(path: string, content: string): void {
        patchState(state, {
          openFiles: state.openFiles().map((f) =>
            f.path === path
              ? { ...f, currentContent: content, isDirty: content !== f.content }
              : f,
          ),
        });
      },

      saveFile: rxMethod<string>(
        pipe(
          switchMap((path: string) => {
            const file = state.openFiles().find((f) => f.path === path);
            if (!file) throw new Error(`File not found: ${path}`);

            return state.fileService.updateFile({
              name: file.name,
              path: file.path,
              content: file.currentContent,
              type: file.type,
            } as FileResponseDto);
          }),
          tap((saved) => {
            patchState(state, {
              openFiles: state.openFiles().map((f) =>
                f.path === saved.path
                  ? { ...f, content: saved.content ?? f.currentContent, currentContent: saved.content ?? f.currentContent, isDirty: false, updatedAt: saved.updatedAt }
                  : f,
              ),
            });
          }),
        ),
      ),
    };
  }),
);
