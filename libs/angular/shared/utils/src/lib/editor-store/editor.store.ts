import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto, Enums } from '@org/shared/contracts';
import { getMonacoLanguage } from './language-map';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  currentContent: string;
  language: string;
  type: Enums.FileType;
  extension?: string;
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
  withComputed((state) => ({
    activeFile: computed(() => {
      const path = state.activeFilePath();
      return state.openFiles().find((f) => f.path === path) ?? null;
    }),
  })),
  withMethods((state) => {
    const http = inject(HttpClient);

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
          language,
          type: file.type,
          extension: file.extension,
          isDirty: false,
          updatedAt: file.updatedAt,
        };

        patchState(state, {
          openFiles: [...state.openFiles(), openFile],
          activeFilePath: file.path,
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

            return http.put<FileResponseDto>('http://localhost:3000/api/file-explorer/file', {
              name: file.name,
              path: file.path,
              content: file.currentContent,
              type: file.type,
            });
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
